import random
import re
from datetime import timedelta

from django.db import transaction
from django.db.models import Q, Max
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from apps.accounts.permissions import IsTeacher
from apps.notifications.utils import notify
from .models import Test, Question, AnswerOption, TestAttempt, AttemptAnswer
from .serializers import (
    TestSerializer, TestWriteSerializer, QuestionWriteSerializer, QuestionSerializer,
    TestAttemptResultSerializer, StandaloneTestSerializer,
    course_of_test, can_manage_test,
)


STANDALONE = {'section__isnull': True, 'lesson__isnull': True}
# Network slack on top of the time limit before an attempt counts as expired.
GRACE_SECONDS = 20


def _is_admin(user):
    return user.role == 'admin' or user.is_superuser


def _check_manage(test, user):
    if not can_manage_test(test, user):
        raise PermissionDenied("Bu test sizga tegishli emas")


def _next_position(section):
    """End of the section's shared lesson/test sequence."""
    a = section.lessons.aggregate(m=Max('order'))['m']
    b = section.tests.aggregate(m=Max('order'))['m']
    vals = [v for v in (a, b) if v is not None]
    return max(vals) + 1 if vals else 0


# ─────────────────────────── Catalog / management ───────────────────────────

class StandaloneTestListView(generics.ListAPIView):
    """Public catalog of standalone tests (paginated, searchable)."""
    serializer_class = StandaloneTestSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Test.objects.filter(is_public=True, **STANDALONE).select_related('created_by', 'category')
        q = self.request.query_params.get('search')
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))
        cat = self.request.query_params.get('category')
        if cat:
            qs = qs.filter(category_id=cat)
        return qs


class MyTestsView(generics.ListAPIView):
    """Teacher's own standalone tests (admin sees all standalone tests)."""
    serializer_class = StandaloneTestSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        qs = Test.objects.filter(**STANDALONE).select_related('created_by', 'category')
        if _is_admin(user):
            return qs
        return qs.filter(created_by=user)


class TestDetailView(generics.RetrieveAPIView):
    queryset = Test.objects.all()
    serializer_class = TestSerializer
    permission_classes = [permissions.AllowAny]


class TestWriteView(generics.ListCreateAPIView):
    serializer_class = TestWriteSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get_queryset(self):
        user = self.request.user
        qs = Test.objects.all()
        if _is_admin(user):
            return qs
        return qs.filter(
            Q(section__course__teacher=user) | Q(lesson__section__course__teacher=user) | Q(created_by=user)
        ).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        section = serializer.validated_data.get('section')
        lesson = serializer.validated_data.get('lesson')
        extra = {'created_by': user}
        if lesson and not section:
            # Lesson-attached tests are stored as section tests right after the lesson.
            section = lesson.section
            extra.update(section=section, lesson=None)
        if section:
            if section.course.teacher_id != user.id and not _is_admin(user):
                raise PermissionDenied("Bu kurs sizga tegishli emas")
            if 'order' not in self.request.data:
                extra['order'] = _next_position(section)
        serializer.save(**extra)


class TestEditView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Test.objects.all()
    serializer_class = TestWriteSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get_object(self):
        obj = super().get_object()
        _check_manage(obj, self.request.user)
        return obj


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsTeacher])
def duplicate_test(request, pk):
    """Copy a test with all its questions (placed right after the original)."""
    src = get_object_or_404(Test, pk=pk)
    _check_manage(src, request.user)
    with transaction.atomic():
        questions = list(src.questions.prefetch_related('options'))
        copy = Test.objects.get(pk=src.pk)
        copy.pk = None
        copy.title = f'{src.title} (nusxa)'[:200]
        copy.created_by = request.user
        copy.is_public = False
        if src.section_id:
            copy.order = _next_position(src.section)
        copy.save()
        for q in questions:
            options = list(q.options.all())
            q.pk = None
            q.test = copy
            q.save()
            AnswerOption.objects.bulk_create([
                AnswerOption(question=q, text=o.text, is_correct=o.is_correct, order=o.order) for o in options
            ])
    return Response(TestSerializer(copy, context={'request': request}).data, status=201)


# ─────────────────────────── Questions ───────────────────────────

class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionWriteSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    pagination_class = None

    def _test(self):
        test = get_object_or_404(Test, pk=self.kwargs['test_id'])
        _check_manage(test, self.request.user)
        return test

    def get_queryset(self):
        return Question.objects.filter(test=self._test()).prefetch_related('options')

    def perform_create(self, serializer):
        test = self._test()
        extra = {'test': test}
        if 'order' not in serializer.validated_data:
            last = test.questions.aggregate(m=Max('order'))['m']
            extra['order'] = 0 if last is None else last + 1
        serializer.save(**extra)


class QuestionEditView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionWriteSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get_object(self):
        obj = super().get_object()
        _check_manage(obj.test, self.request.user)
        return obj


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsTeacher])
def bulk_questions(request, test_id):
    """Create many questions at once (used by the text-import tool).
    All-or-nothing: one invalid question rejects the whole batch."""
    test = get_object_or_404(Test, pk=test_id)
    _check_manage(test, request.user)
    items = request.data.get('questions')
    if not isinstance(items, list) or not items:
        return Response({'detail': "Savollar ro'yxati bo'sh"}, status=400)
    if len(items) > 200:
        return Response({'detail': 'Bir martada 200 tagacha savol yuklash mumkin'}, status=400)

    errors = {}
    sers = []
    for i, item in enumerate(items):
        ser = QuestionWriteSerializer(data=item)
        if ser.is_valid():
            sers.append(ser)
        else:
            errors[i + 1] = ser.errors
    if errors:
        return Response({'detail': "Ba'zi savollarda xatolik bor", 'errors': errors}, status=400)

    last = test.questions.aggregate(m=Max('order'))['m']
    pos = 0 if last is None else last + 1
    with transaction.atomic():
        for ser in sers:
            ser.save(test=test, order=pos)
            pos += 1
    return Response({'created': len(sers)}, status=201)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsTeacher])
def reorder_questions(request, test_id):
    test = get_object_or_404(Test, pk=test_id)
    _check_manage(test, request.user)
    ids = request.data.get('ids') or []
    own = set(test.questions.values_list('id', flat=True))
    with transaction.atomic():
        for pos, qid in enumerate(ids):
            if qid in own:
                Question.objects.filter(pk=qid).update(order=pos)
    return Response({'detail': 'ok'})


@api_view(['POST', 'DELETE'])
@permission_classes([permissions.IsAuthenticated, IsTeacher])
@parser_classes([MultiPartParser, FormParser])
def question_image(request, pk):
    q = get_object_or_404(Question, pk=pk)
    _check_manage(q.test, request.user)
    if request.method == 'DELETE':
        if q.image:
            q.image.delete(save=False)
        q.image = None
        q.save(update_fields=['image'])
        return Response(status=204)
    f = request.FILES.get('image')
    if not f:
        return Response({'detail': 'Rasm fayli kerak'}, status=400)
    if not (f.content_type or '').startswith('image/'):
        return Response({'detail': 'Faqat rasm yuklash mumkin'}, status=400)
    if f.size > 5 * 1024 * 1024:
        return Response({'detail': 'Rasm hajmi 5 MB dan oshmasin'}, status=400)
    if q.image:
        q.image.delete(save=False)
    q.image = f
    q.save()
    return Response({'image': q.image.url})


# ─────────────────────────── Grading ───────────────────────────

_APOSTROPHES = re.compile(r"[ʻʼ’‘`´ʹ′]")


def normalize_text(value):
    """Forgiving comparison for written answers: case, spacing, apostrophe
    variants (o‘ / o' / oʻ) and trailing punctuation do not matter."""
    s = _APOSTROPHES.sub("'", str(value or ''))
    s = re.sub(r'\s+', ' ', s).strip().strip('.,;:!?').strip()
    return s.casefold()


def _int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def _grade_answer(question, answer):
    """Grade one submitted answer for any question type.
    Returns (selected_option, selected_options_list, text_answer, is_correct)."""
    options = list(question.options.all())
    correct_ids = {o.id for o in options if o.is_correct}

    if question.question_type == Question.TYPE_MULTIPLE:
        raw = answer.get('option_ids')
        if not isinstance(raw, (list, tuple)):
            raw = []
        picked_ids = {_int(i) for i in raw} - {None}
        picked = [o for o in options if o.id in picked_ids]
        # Exact match required: all correct options and nothing else.
        is_correct = bool(correct_ids) and {o.id for o in picked} == correct_ids
        return None, picked, '', is_correct

    if question.question_type == Question.TYPE_TEXT:
        text = str(answer.get('text') or '').strip()[:500]
        accepted = {normalize_text(o.text) for o in options if o.is_correct}
        is_correct = bool(text) and normalize_text(text) in accepted
        return None, [], text, is_correct

    # single / true_false
    opt_id = _int(answer.get('option_id'))
    if opt_id is None:
        ids = answer.get('option_ids')
        if isinstance(ids, (list, tuple)) and ids:
            opt_id = _int(ids[0])
    opt = next((o for o in options if o.id == opt_id), None)
    return opt, [], '', bool(opt and opt.is_correct)


def _attempt_questions(attempt):
    """Questions served in this attempt, in the order they were shown."""
    qs = {q.id: q for q in attempt.test.questions.prefetch_related('options')}
    ids = [qid for qid in (attempt.question_ids or []) if qid in qs]
    if not ids:
        ids = list(qs.keys())
    return [qs[i] for i in ids]


def _seconds_left(attempt):
    limit = attempt.test.time_limit_minutes
    if not limit:
        return None
    elapsed = (timezone.now() - attempt.started_at).total_seconds()
    return int(limit * 60 - elapsed)


def finalize_attempt(attempt, answers, reason):
    """Grade and close an attempt. `answers` is a list of
    {question_id, option_id? | option_ids? | text?}. Idempotent per attempt."""
    questions = _attempt_questions(attempt)
    by_q = {q.id: q for q in questions}
    attempt.answers.all().delete()

    correct = 0
    earned = 0.0
    seen = set()
    for a in answers or []:
        if not isinstance(a, dict):
            continue
        q = by_q.get(_int(a.get('question_id')))
        if not q or q.id in seen:
            continue
        seen.add(q.id)
        opt, picked, text, is_correct = _grade_answer(q, a)
        aa = AttemptAnswer.objects.create(
            attempt=attempt, question=q, selected_option=opt, text_answer=text,
            is_correct=is_correct, points_earned=q.points if is_correct else 0,
        )
        if picked:
            aa.selected_options.set(picked)
        if is_correct:
            correct += 1
            earned += q.points
    # Record unanswered questions too, so the review shows them.
    for q in questions:
        if q.id not in seen:
            AttemptAnswer.objects.create(attempt=attempt, question=q, is_correct=False)

    total = len(questions)
    max_points = float(sum(q.points for q in questions))
    valid_reasons = {c[0] for c in TestAttempt.FINISH_CHOICES}
    attempt.finish_reason = reason if reason in valid_reasons else TestAttempt.FINISH_MANUAL
    attempt.correct_count = correct
    attempt.wrong_count = total - correct
    attempt.earned_points = earned
    attempt.max_points = max_points
    if total == 0:
        # An empty test must never block course completion.
        attempt.score_percent = 100.0
        attempt.passed = True
    else:
        attempt.score_percent = round(earned / max_points * 100, 1) if max_points else 0
        attempt.passed = attempt.score_percent >= attempt.test.pass_percent

    finished = timezone.now()
    limit = attempt.test.time_limit_minutes
    if limit:
        # Never record more time than the test allows.
        deadline = attempt.started_at + timedelta(seconds=limit * 60)
        if finished > deadline:
            finished = deadline
            if attempt.finish_reason == TestAttempt.FINISH_MANUAL:
                attempt.finish_reason = TestAttempt.FINISH_TIMEOUT
    attempt.finished_at = finished
    attempt.draft = {}
    attempt.save()
    return attempt


def _expire_if_needed(attempt):
    """Close an abandoned attempt whose time ran out, grading the autosaved answers."""
    left = _seconds_left(attempt)
    if left is not None and left < -GRACE_SECONDS:
        with transaction.atomic():
            finalize_attempt(attempt, (attempt.draft or {}).get('answers') or [], TestAttempt.FINISH_TIMEOUT)
        _after_finish(attempt, attempt.student)
        return True
    return False


def _after_finish(attempt, user):
    """Notifications + course progress + certificate after an attempt closes."""
    info = {'course_slug': None, 'course_completed': False, 'certificate_issued': False}
    if attempt.passed and attempt.max_points > 0:
        notify(user, 'test_passed',
               f'"{attempt.test.title}" testidan {int(attempt.score_percent)}% to\'pladingiz', '')
    course = course_of_test(attempt.test)
    if not course:
        return info
    info['course_slug'] = course.slug
    from apps.courses.models import Enrollment
    enrollment = Enrollment.objects.filter(student=user, course=course).first()
    if enrollment:
        enrollment.recompute_progress()
        info['course_completed'] = enrollment.completed
        if enrollment.completed:
            from apps.certificates.utils import issue_certificate
            cert, created = issue_certificate(user, course)
            info['certificate_issued'] = created
            if created:
                notify(user, 'certificate', f'"{course.title}" uchun sertifikat tayyor', '/profile')
    return info


def _serve_attempt(attempt, request):
    """Payload for the test-taking screen: the attempt's own question set
    (never includes correct answers), timer and autosaved draft."""
    test = attempt.test
    rng = random.Random(attempt.id)
    questions = []
    for q in _attempt_questions(attempt):
        opts = [] if q.question_type == Question.TYPE_TEXT else [
            {'id': o.id, 'text': o.text} for o in q.options.all()
        ]
        if test.shuffle_options and q.question_type in (Question.TYPE_SINGLE, Question.TYPE_MULTIPLE):
            rng.shuffle(opts)
        questions.append({
            'id': q.id, 'text': q.text, 'question_type': q.question_type, 'points': q.points,
            'image': request.build_absolute_uri(q.image.url) if q.image else None,
            'options': opts,
        })
    draft = attempt.draft or {}
    return {
        'id': attempt.id,
        'started_at': attempt.started_at,
        'remaining_seconds': _seconds_left(attempt),
        'focus_losses': attempt.focus_losses,
        'draft': {
            'answers': draft.get('answers') or [],
            'flags': draft.get('flags') or [],
            'index': draft.get('index') or 0,
        },
        'test': {
            'id': test.id, 'title': test.title, 'description': test.description,
            'time_limit_minutes': test.time_limit_minutes, 'pass_percent': test.pass_percent,
            'strict_mode': test.strict_mode, 'focus_loss_limit': test.focus_loss_limit,
            'total_points': sum(q['points'] for q in questions),
            'questions': questions,
        },
    }


# ─────────────────────────── Attempts ───────────────────────────

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_attempt(request, test_id):
    """Start a test — or RESUME the active attempt, so a page refresh never
    resets the timer or loses answers. Expired attempts are graded first."""
    test = get_object_or_404(Test, pk=test_id)
    user = request.user
    manage = can_manage_test(test, user)

    if not manage and test.is_standalone and not test.is_public:
        return Response({'detail': 'Bu test hozircha yopiq'}, status=403)

    with transaction.atomic():
        active = list(TestAttempt.objects.select_for_update().filter(
            student=user, test=test, finished_at__isnull=True).order_by('-started_at'))
        attempt = None
        for a in active:
            if attempt is None and not _expire_if_needed(a):
                attempt = a
            elif a.finished_at is None:
                # Stray duplicate — close it from its own draft.
                finalize_attempt(a, (a.draft or {}).get('answers') or [], TestAttempt.FINISH_LEFT)

        created = False
        if not attempt:
            used = TestAttempt.objects.filter(student=user, test=test, finished_at__isnull=False).count()
            if test.max_attempts and used >= test.max_attempts and not manage:
                return Response({
                    'detail': f"Urinishlar tugadi: bu testni {test.max_attempts} marta ishlash mumkin",
                    'code': 'attempts_exhausted',
                }, status=403)
            ids = list(test.questions.values_list('id', flat=True))
            if not ids:
                return Response({'detail': "Bu testda hali savollar yo'q"}, status=400)
            if test.shuffle_questions or test.question_limit:
                random.shuffle(ids)
            if test.question_limit:
                ids = ids[:test.question_limit]
            attempt = TestAttempt.objects.create(student=user, test=test, question_ids=ids)
            created = True

    data = _serve_attempt(attempt, request)
    data['resumed'] = not created
    return Response(data, status=201 if created else 200)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_attempt(request, attempt_id):
    """Autosave in-progress answers. Returns the authoritative remaining time."""
    attempt = get_object_or_404(TestAttempt, pk=attempt_id, student=request.user)
    if attempt.finished_at:
        return Response({'finished': True, 'remaining_seconds': 0})

    answers = request.data.get('answers')
    if isinstance(answers, list) and len(answers) <= 500:
        attempt.draft = {
            'answers': answers,
            'flags': [f for f in (request.data.get('flags') or []) if isinstance(f, int)][:500],
            'index': _int(request.data.get('index')) or 0,
        }
    losses = _int(request.data.get('focus_losses'))
    if losses is not None and losses > attempt.focus_losses:
        attempt.focus_losses = min(losses, 999)
    attempt.save(update_fields=['draft', 'focus_losses'])

    if _expire_if_needed(attempt):
        return Response({'finished': True, 'remaining_seconds': 0})
    return Response({'finished': False, 'remaining_seconds': _seconds_left(attempt),
                     'focus_losses': attempt.focus_losses})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_attempt(request, attempt_id):
    with transaction.atomic():
        attempt = get_object_or_404(TestAttempt.objects.select_for_update(),
                                    pk=attempt_id, student=request.user)
        already = bool(attempt.finished_at)
        if not already:
            answers = request.data.get('answers')
            if not isinstance(answers, list):
                answers = (attempt.draft or {}).get('answers') or []
            losses = _int(request.data.get('focus_losses'))
            if losses is not None and losses > attempt.focus_losses:
                attempt.focus_losses = min(losses, 999)
            finalize_attempt(attempt, answers, request.data.get('reason'))

    info = {'course_slug': None, 'course_completed': False, 'certificate_issued': False}
    if already:
        course = course_of_test(attempt.test)
        info['course_slug'] = course.slug if course else None
    else:
        info = _after_finish(attempt, request.user)

    data = TestAttemptResultSerializer(attempt, context={'request': request}).data
    data.update(info)
    return Response(data)


class AttemptResultView(generics.RetrieveAPIView):
    """Result + review. Visible to the student who took it and to whoever manages the test."""
    serializer_class = TestAttemptResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TestAttempt.objects.select_related('test').prefetch_related(
            'answers__question__options', 'answers__selected_option', 'answers__selected_options')

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        self._manage = can_manage_test(obj.test, user)
        if obj.student_id != user.id and not self._manage:
            raise PermissionDenied()
        if not obj.finished_at and not _expire_if_needed(obj):
            raise PermissionDenied('Test hali yakunlanmagan')
        return obj

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        ctx = {'request': request, 'manage': self._manage and obj.student_id != request.user.id}
        data = TestAttemptResultSerializer(obj, context=ctx).data
        test = obj.test
        used = TestAttempt.objects.filter(student=obj.student, test=test, finished_at__isnull=False).count()
        data['attempts_used'] = used
        data['can_retake'] = not test.max_attempts or used < test.max_attempts
        data['student'] = {'id': obj.student_id, 'display_name': obj.student.display_name}
        return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_attempts(request):
    qs = (TestAttempt.objects.filter(student=request.user, finished_at__isnull=False)
          .select_related('test').order_by('-started_at')[:50])
    return Response(TestAttemptResultSerializer(qs, many=True, context={'request': request, 'brief': True}).data)


# ─────────────────────────── Analytics ───────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsTeacher])
def test_stats(request, pk):
    """Teacher analytics: score distribution, hardest questions, recent attempts."""
    test = get_object_or_404(Test, pk=pk)
    _check_manage(test, request.user)

    attempts = list(test.attempts.filter(finished_at__isnull=False).select_related('student').order_by('-finished_at'))
    n = len(attempts)
    scores = [a.score_percent for a in attempts]
    durations = [a.duration_seconds for a in attempts if a.duration_seconds is not None]
    buckets = [0, 0, 0, 0, 0]  # 0-19, 20-39, 40-59, 60-79, 80-100
    for s in scores:
        buckets[min(int(s // 20), 4)] += 1

    per_q = {}
    for row in AttemptAnswer.objects.filter(attempt__test=test, attempt__finished_at__isnull=False) \
            .values('question_id', 'is_correct'):
        d = per_q.setdefault(row['question_id'], [0, 0])
        d[0] += 1
        d[1] += 1 if row['is_correct'] else 0
    questions = []
    for i, q in enumerate(test.questions.all()):
        shown, right = per_q.get(q.id, [0, 0])
        questions.append({
            'id': q.id, 'number': i + 1, 'text': q.text, 'question_type': q.question_type,
            'shown': shown, 'correct': right,
            'correct_rate': round(right / shown * 100) if shown else None,
        })

    return Response({
        'test': {'id': test.id, 'title': test.title, 'pass_percent': test.pass_percent},
        'attempts': n,
        'students': len({a.student_id for a in attempts}),
        'avg_score': round(sum(scores) / n, 1) if n else 0,
        'best_score': max(scores) if n else 0,
        'pass_rate': round(sum(1 for a in attempts if a.passed) / n * 100) if n else 0,
        'avg_duration_seconds': round(sum(durations) / len(durations)) if durations else 0,
        'distribution': buckets,
        'questions': questions,
        'recent': [{
            'id': a.id,
            'student': {'id': a.student_id, 'display_name': a.student.display_name, 'initials': a.student.initials},
            'score_percent': a.score_percent, 'passed': a.passed,
            'correct_count': a.correct_count, 'wrong_count': a.wrong_count,
            'finish_reason': a.finish_reason, 'focus_losses': a.focus_losses,
            'duration_seconds': a.duration_seconds, 'finished_at': a.finished_at,
        } for a in attempts[:100]],
    })
