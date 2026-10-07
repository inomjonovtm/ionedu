from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.accounts.permissions import IsTeacher
from apps.notifications.utils import notify
from .models import Test, Question, AnswerOption, TestAttempt, AttemptAnswer
from .serializers import (
    TestSerializer, TestWriteSerializer, QuestionWriteSerializer,
    TestAttemptStartSerializer, TestAttemptResultSerializer,
    StandaloneTestSerializer,
    course_of_test, can_manage_test,
)


STANDALONE = {'section__isnull': True, 'lesson__isnull': True}


class StandaloneTestListView(generics.ListAPIView):
    """Public catalog of standalone tests (paginated, searchable)."""
    serializer_class = StandaloneTestSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Test.objects.filter(is_public=True, **STANDALONE).select_related('created_by', 'category')
        q = self.request.query_params.get('search')
        if q:
            from django.db.models import Q
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
        if user.role == 'admin' or user.is_superuser:
            return qs
        return qs.filter(created_by=user)


def _check_manage(test, user):
    if not can_manage_test(test, user):
        raise PermissionDenied("Bu test sizga tegishli emas")


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
        if user.role == 'admin' or user.is_superuser:
            return qs
        from django.db.models import Q
        return qs.filter(
            Q(section__course__teacher=user) | Q(lesson__section__course__teacher=user)
        )

    def perform_create(self, serializer):
        test = serializer.save(created_by=self.request.user)
        # When attached to a course, the course must belong to the requester.
        course = course_of_test(test)
        user = self.request.user
        if course and course.teacher_id != user.id and user.role != 'admin' and not user.is_superuser:
            test.delete()
            raise PermissionDenied("Bu kurs sizga tegishli emas")


class TestEditView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Test.objects.all()
    serializer_class = TestWriteSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get_object(self):
        obj = super().get_object()
        if self.request.method not in permissions.SAFE_METHODS:
            _check_manage(obj, self.request.user)
        return obj


class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionWriteSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get_queryset(self):
        return Question.objects.filter(test_id=self.kwargs.get('test_id')).prefetch_related('options')

    def perform_create(self, serializer):
        test = get_object_or_404(Test, pk=self.kwargs['test_id'])
        _check_manage(test, self.request.user)
        serializer.save(test=test)


class QuestionEditView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionWriteSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get_object(self):
        obj = super().get_object()
        if self.request.method not in permissions.SAFE_METHODS:
            _check_manage(obj.test, self.request.user)
        return obj


def _finalize_expired(attempt):
    """Grade an abandoned attempt from whatever answers were recorded (usually none)."""
    total = attempt.test.questions.count()
    correct = attempt.answers.filter(is_correct=True).count()
    attempt.correct_count = correct
    attempt.wrong_count = max(total - correct, 0)
    attempt.score_percent = round(correct / total * 100, 1) if total else 0
    attempt.passed = total > 0 and attempt.score_percent >= attempt.test.pass_percent
    attempt.finish_reason = TestAttempt.FINISH_TIMEOUT
    attempt.finished_at = timezone.now()
    attempt.save()


def _grade_answer(question, answer):
    """Grade one submitted answer for any question type.
    Returns (selected_option, selected_options_list, text_answer, is_correct)."""
    options = list(question.options.all())
    correct_ids = {o.id for o in options if o.is_correct}

    if question.question_type == Question.TYPE_MULTIPLE:
        picked_ids = {int(i) for i in (answer.get('option_ids') or []) if str(i).isdigit()}
        picked = [o for o in options if o.id in picked_ids]
        # Exact match required: all correct options and nothing else.
        is_correct = bool(correct_ids) and {o.id for o in picked} == correct_ids
        return None, picked, '', is_correct

    if question.question_type == Question.TYPE_TEXT:
        text = str(answer.get('text') or '').strip()[:500]
        accepted = {o.text.strip().casefold() for o in options if o.is_correct}
        is_correct = bool(text) and text.casefold() in accepted
        return None, [], text, is_correct

    # single / true_false
    opt_id = answer.get('option_id')
    if opt_id is None:
        ids = answer.get('option_ids') or []
        opt_id = ids[0] if ids else None
    opt = next((o for o in options if o.id == opt_id), None)
    return opt, [], '', bool(opt and opt.is_correct)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_attempt(request, test_id):
    """Start a test — or RESUME the active attempt, so a page refresh never
    resets the timer. Expired abandoned attempts are graded as-is first."""
    test = get_object_or_404(Test, pk=test_id)
    attempt = TestAttempt.objects.filter(
        student=request.user, test=test, finished_at__isnull=True,
    ).order_by('-started_at').first()

    if attempt and test.time_limit_minutes:
        elapsed = (timezone.now() - attempt.started_at).total_seconds()
        if elapsed > test.time_limit_minutes * 60 + 5:
            _finalize_expired(attempt)
            attempt = None

    created = False
    if not attempt:
        attempt = TestAttempt.objects.create(student=request.user, test=test)
        created = True

    data = TestAttemptStartSerializer(attempt, context={'request': request}).data
    data['resumed'] = not created
    return Response(data, status=201 if created else 200)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_attempt(request, attempt_id):
    attempt = get_object_or_404(TestAttempt, pk=attempt_id, student=request.user)
    if attempt.finished_at:
        return Response(TestAttemptResultSerializer(attempt).data)

    # [{question_id, option_id?, option_ids?, text?}]
    answers = request.data.get('answers', [])
    questions = list(attempt.test.questions.prefetch_related('options'))
    by_q = {q.id: q for q in questions}
    correct = 0
    seen = set()
    for a in answers:
        q = by_q.get(a.get('question_id'))
        if not q or q.id in seen:
            continue
        seen.add(q.id)
        opt, picked, text, is_correct = _grade_answer(q, a)
        aa = AttemptAnswer.objects.create(
            attempt=attempt, question=q, selected_option=opt,
            text_answer=text, is_correct=is_correct,
        )
        if picked:
            aa.selected_options.set(picked)
        if is_correct:
            correct += 1
    # Record unanswered questions too, so the review shows them.
    for q in questions:
        if q.id not in seen:
            AttemptAnswer.objects.create(attempt=attempt, question=q, is_correct=False)

    reason = request.data.get('reason')
    valid_reasons = {c[0] for c in TestAttempt.FINISH_CHOICES}
    attempt.finish_reason = reason if reason in valid_reasons else TestAttempt.FINISH_MANUAL

    total = len(questions)
    if total == 0:
        # An empty test must never block course completion.
        attempt.correct_count = 0
        attempt.wrong_count = 0
        attempt.score_percent = 100.0
        attempt.passed = True
    else:
        attempt.correct_count = correct
        attempt.wrong_count = total - correct
        attempt.score_percent = round(correct / total * 100, 1)
        attempt.passed = attempt.score_percent >= attempt.test.pass_percent
    attempt.finished_at = timezone.now()
    attempt.save()

    if attempt.passed and total > 0:
        notify(request.user, 'test_passed',
               f'"{attempt.test.title}" testidan {int(attempt.score_percent)}% to\'pladingiz',
               '')

    # Recompute the enrollment progress for the course this test belongs to.
    course = course_of_test(attempt.test)
    course_completed = False
    certificate_issued = False
    if course:
        from apps.courses.models import Enrollment
        enrollment = Enrollment.objects.filter(student=request.user, course=course).first()
        if enrollment:
            enrollment.recompute_progress()
            course_completed = enrollment.completed
            if enrollment.completed:
                from apps.certificates.utils import issue_certificate
                cert, created = issue_certificate(request.user, course)
                certificate_issued = created
                if created:
                    notify(request.user, 'certificate',
                           f'"{course.title}" uchun sertifikat tayyor',
                           '/profile')

    data = TestAttemptResultSerializer(attempt).data
    data['course_slug'] = course.slug if course else None
    data['course_completed'] = course_completed
    data['certificate_issued'] = certificate_issued
    return Response(data)


class AttemptResultView(generics.RetrieveAPIView):
    queryset = TestAttempt.objects.all()
    serializer_class = TestAttemptResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TestAttempt.objects.filter(student=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_attempts(request):
    qs = TestAttempt.objects.filter(student=request.user).select_related('test').order_by('-started_at')[:50]
    return Response(TestAttemptResultSerializer(qs, many=True).data)
