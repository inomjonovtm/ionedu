from rest_framework import serializers
from .models import Test, Question, AnswerOption, TestAttempt


def course_of_test(test):
    if test.section_id:
        return test.section.course
    if test.lesson_id:
        return test.lesson.section.course
    return None


def can_manage_test(test, user):
    """Course owner, test creator or admin — allowed to see/edit correct answers."""
    if not user or not user.is_authenticated:
        return False
    if getattr(user, 'role', '') == 'admin' or user.is_superuser:
        return True
    course = course_of_test(test)
    if course:
        return course.teacher_id == user.id
    return bool(test.created_by_id and test.created_by_id == user.id)


class AnswerOptionPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ['id', 'text', 'order']


class AnswerOptionFullSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ['id', 'text', 'is_correct', 'order']
        read_only_fields = ['id']


class QuestionSerializer(serializers.ModelSerializer):
    """Read serializer. Correct answers are included only for managers."""
    options = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'order', 'points', 'image', 'explanation', 'options']

    def to_representation(self, obj):
        data = super().to_representation(obj)
        if not self.context.get('manage'):
            data.pop('explanation', None)
        return data

    def get_options(self, obj):
        if self.context.get('manage'):
            return AnswerOptionFullSerializer(obj.options.all(), many=True).data
        # Written-answer options ARE the accepted answers — never expose them.
        if obj.question_type == Question.TYPE_TEXT:
            return []
        return AnswerOptionPublicSerializer(obj.options.all(), many=True).data


def _attempt_summary(test, user):
    """Per-user attempt facts used on cards and the intro screen."""
    if not user or not user.is_authenticated:
        return {'attempts_used': 0, 'best_score': None, 'is_passed': False, 'active_attempt': False}
    finished = list(test.attempts.filter(student=user))
    done = [a for a in finished if a.finished_at]
    return {
        'attempts_used': len(done),
        'best_score': max((a.score_percent for a in done), default=None),
        'is_passed': any(a.passed for a in done),
        'active_attempt': any(not a.finished_at for a in finished),
    }


class TestMiniSerializer(serializers.ModelSerializer):
    """Compact test row for curricula."""
    question_count = serializers.IntegerField(source='take_count', read_only=True)
    is_passed = serializers.SerializerMethodField()
    best_score = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = ['id', 'title', 'order', 'time_limit_minutes', 'pass_percent', 'question_count',
                  'is_passed', 'best_score']

    def _summary(self, obj):
        req = self.context.get('request')
        cache = self.context.setdefault('_test_summary', {})
        if obj.id not in cache:
            cache[obj.id] = _attempt_summary(obj, getattr(req, 'user', None))
        return cache[obj.id]

    def get_is_passed(self, obj):
        return self._summary(obj)['is_passed']

    def get_best_score(self, obj):
        return self._summary(obj)['best_score']


class TestSerializer(serializers.ModelSerializer):
    """Test detail. Students get settings + their attempt summary but NOT the
    questions (those are only served once an attempt is started); managers
    get the full question list with correct answers."""
    questions = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()
    total_points = serializers.SerializerMethodField()
    can_manage = serializers.SerializerMethodField()
    course_slug = serializers.SerializerMethodField()
    me = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'time_limit_minutes', 'pass_percent',
                  'section', 'lesson', 'category', 'is_public', 'order',
                  'shuffle_questions', 'shuffle_options', 'question_limit', 'max_attempts',
                  'show_answers', 'strict_mode', 'focus_loss_limit',
                  'questions', 'question_count', 'total_points', 'can_manage', 'course_slug', 'me']

    def _manage(self, obj):
        req = self.context.get('request')
        return can_manage_test(obj, getattr(req, 'user', None))

    def get_can_manage(self, obj):
        return self._manage(obj)

    def get_questions(self, obj):
        if not self._manage(obj):
            return []
        ctx = {**self.context, 'manage': True}
        return QuestionSerializer(obj.questions.all(), many=True, context=ctx).data

    def get_question_count(self, obj):
        return obj.questions.count() if self._manage(obj) else obj.take_count

    def get_total_points(self, obj):
        return sum(q.points for q in obj.questions.all())

    def get_course_slug(self, obj):
        course = course_of_test(obj)
        return course.slug if course else None

    def get_me(self, obj):
        req = self.context.get('request')
        return _attempt_summary(obj, getattr(req, 'user', None))


class StandaloneTestSerializer(serializers.ModelSerializer):
    """Card data for the public "Testlar" catalog and the teacher's test manager."""
    question_count = serializers.IntegerField(source='take_count', read_only=True)
    attempt_count = serializers.IntegerField(read_only=True)
    created_by = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    my_best = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'time_limit_minutes', 'pass_percent',
                  'is_public', 'category', 'created_by', 'question_count', 'attempt_count',
                  'max_attempts', 'strict_mode', 'my_best', 'created_at']

    def get_created_by(self, obj):
        u = obj.created_by
        if not u:
            return None
        return {'id': u.id, 'display_name': u.display_name, 'initials': u.initials}

    def get_category(self, obj):
        c = obj.category
        return {'id': c.id, 'name': c.name, 'icon': c.icon} if c else None

    def get_my_best(self, obj):
        req = self.context.get('request')
        user = getattr(req, 'user', None)
        if not user or not user.is_authenticated:
            return None
        best = obj.attempts.filter(student=user, finished_at__isnull=False).order_by('-score_percent').first()
        if not best:
            return None
        return {'score_percent': best.score_percent, 'passed': best.passed}


class TestWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'time_limit_minutes', 'pass_percent',
                  'section', 'lesson', 'category', 'is_public', 'order',
                  'shuffle_questions', 'shuffle_options', 'question_limit', 'max_attempts',
                  'show_answers', 'strict_mode', 'focus_loss_limit']

    def validate_title(self, v):
        v = (v or '').strip()
        if not v:
            raise serializers.ValidationError('Test nomini kiriting')
        return v

    def validate_pass_percent(self, v):
        if not 0 <= v <= 100:
            raise serializers.ValidationError("O'tish bali 0–100 oralig'ida bo'lishi kerak")
        return v

    def validate_time_limit_minutes(self, v):
        if v is not None and v <= 0:
            return None
        return v

    def validate_question_limit(self, v):
        return v or None

    def validate_max_attempts(self, v):
        return v or None

    def validate_focus_loss_limit(self, v):
        return max(1, min(v or 3, 20))


class QuestionWriteSerializer(serializers.ModelSerializer):
    options = AnswerOptionFullSerializer(many=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'order', 'points', 'explanation', 'image', 'options']
        read_only_fields = ['id', 'image']
        extra_kwargs = {'order': {'required': False}}

    def validate_text(self, v):
        v = (v or '').strip()
        if not v:
            raise serializers.ValidationError('Savol matnini kiriting')
        return v

    def validate_points(self, v):
        return max(1, min(v or 1, 100))

    def validate(self, attrs):
        qtype = attrs.get('question_type') or getattr(self.instance, 'question_type', Question.TYPE_SINGLE)
        options = attrs.get('options')
        if options is None:
            return attrs
        # Drop blank options, trim text, renumber.
        cleaned = []
        for o in options:
            text = (o.get('text') or '').strip()
            if text:
                cleaned.append({'text': text, 'is_correct': bool(o.get('is_correct')), 'order': len(cleaned)})
        correct = sum(1 for o in cleaned if o['is_correct'])

        if qtype == Question.TYPE_TEXT:
            if not cleaned:
                raise serializers.ValidationError({'options': "Kamida bitta to'g'ri javob variantini yozing"})
            for o in cleaned:
                o['is_correct'] = True
        elif qtype == Question.TYPE_TRUE_FALSE:
            if len(cleaned) != 2 or correct != 1:
                raise serializers.ValidationError({'options': "To'g'ri/Noto'g'ri savolida 2 ta variant va 1 ta to'g'ri javob bo'lishi kerak"})
        elif qtype == Question.TYPE_MULTIPLE:
            if len(cleaned) < 2:
                raise serializers.ValidationError({'options': 'Kamida 2 ta variant kiriting'})
            if correct < 1:
                raise serializers.ValidationError({'options': "Kamida bitta to'g'ri javobni belgilang"})
        else:
            if len(cleaned) < 2:
                raise serializers.ValidationError({'options': 'Kamida 2 ta variant kiriting'})
            if correct != 1:
                raise serializers.ValidationError({'options': "Aynan bitta to'g'ri javobni belgilang"})
        if len({o['text'].casefold() for o in cleaned}) != len(cleaned):
            raise serializers.ValidationError({'options': 'Variantlar takrorlanmasligi kerak'})
        attrs['options'] = cleaned
        return attrs

    def create(self, validated):
        options = validated.pop('options', [])
        q = Question.objects.create(**validated)
        AnswerOption.objects.bulk_create([AnswerOption(question=q, **o) for o in options])
        return q

    def update(self, instance, validated):
        options = validated.pop('options', None)
        for k, v in validated.items():
            setattr(instance, k, v)
        instance.save()
        if options is not None:
            # Keep option ids stable when the text is unchanged, so answers
            # recorded in earlier attempts still point at the right option.
            existing = {o.text.casefold(): o for o in instance.options.all()}
            keep = set()
            for o in options:
                cur = existing.get(o['text'].casefold())
                if cur and cur.id not in keep:
                    cur.text, cur.is_correct, cur.order = o['text'], o['is_correct'], o['order']
                    cur.save()
                    keep.add(cur.id)
                else:
                    keep.add(AnswerOption.objects.create(question=instance, **o).id)
            instance.options.exclude(id__in=keep).delete()
        return instance


class TestAttemptResultSerializer(serializers.ModelSerializer):
    test = serializers.SerializerMethodField()
    answers = serializers.SerializerMethodField()
    duration_seconds = serializers.IntegerField(read_only=True)

    class Meta:
        model = TestAttempt
        fields = ['id', 'test', 'score_percent', 'correct_count', 'wrong_count', 'passed',
                  'earned_points', 'max_points', 'finish_reason', 'focus_losses',
                  'started_at', 'finished_at', 'duration_seconds', 'answers']

    def get_test(self, obj):
        t = obj.test
        return {
            'id': t.id, 'title': t.title, 'description': t.description,
            'time_limit_minutes': t.time_limit_minutes, 'pass_percent': t.pass_percent,
            'section': t.section_id, 'lesson': t.lesson_id,
            'question_count': t.take_count, 'max_attempts': t.max_attempts,
            'show_answers': t.show_answers,
        }

    def get_answers(self, obj):
        if self.context.get('brief'):
            return []
        reveal = obj.test.show_answers or self.context.get('manage')
        rows = {a.question_id: a for a in obj.answers.all()}
        ordered_ids = [qid for qid in (obj.question_ids or []) if qid in rows]
        ordered_ids += [qid for qid in rows if qid not in ordered_ids]

        out = []
        for qid in ordered_ids:
            a = rows[qid]
            q = a.question
            options = list(q.options.all())
            correct_opts = [o for o in options if o.is_correct]
            picked_ids = set()

            if q.question_type == Question.TYPE_TEXT:
                selected_text = a.text_answer or None
            elif q.question_type == Question.TYPE_MULTIPLE:
                picked = list(a.selected_options.all())
                picked_ids = {o.id for o in picked}
                selected_text = ', '.join(o.text for o in picked) if picked else None
            else:
                if a.selected_option_id:
                    picked_ids = {a.selected_option_id}
                selected_text = a.selected_option.text if a.selected_option else None

            row = {
                'question_id': q.id,
                'question_text': q.text,
                'question_type': q.question_type,
                'image': q.image.url if q.image else None,
                'points': q.points,
                'points_earned': a.points_earned,
                'selected_option_id': a.selected_option_id,
                'selected_text': selected_text,
                'answered': bool(selected_text),
                'is_correct': a.is_correct,
                'correct_option_id': None,
                'correct_text': None,
                'explanation': '',
                'options': [],
            }
            if q.question_type != Question.TYPE_TEXT:
                row['options'] = [{
                    'id': o.id, 'text': o.text, 'selected': o.id in picked_ids,
                    'is_correct': o.is_correct if reveal else None,
                } for o in options]
            if reveal:
                row['correct_option_id'] = correct_opts[0].id if correct_opts else None
                row['correct_text'] = ', '.join(o.text for o in correct_opts) if correct_opts else None
                row['explanation'] = q.explanation
            out.append(row)
        return out
