from rest_framework import serializers
from .models import Test, Question, AnswerOption, TestAttempt, AttemptAnswer


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
    if test.created_by_id and test.created_by_id == user.id:
        return True
    course = course_of_test(test)
    return bool(course and course.teacher_id == user.id)


class AnswerOptionPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ['id', 'text', 'order']


class AnswerOptionFullSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ['id', 'text', 'is_correct', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'order', 'options']

    def get_options(self, obj):
        # Only the course owner / admin may see which option is correct.
        req = self.context.get('request')
        user = getattr(req, 'user', None)
        if can_manage_test(obj.test, user):
            return AnswerOptionFullSerializer(obj.options.all(), many=True).data
        # Written-answer options ARE the accepted answers — never expose them.
        if obj.question_type == Question.TYPE_TEXT:
            return []
        return AnswerOptionPublicSerializer(obj.options.all(), many=True).data


class TestMiniSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)
    is_passed = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = ['id', 'title', 'time_limit_minutes', 'pass_percent', 'question_count', 'is_passed']

    def get_is_passed(self, obj):
        req = self.context.get('request')
        if not req or not req.user or not req.user.is_authenticated:
            return False
        return TestAttempt.objects.filter(student=req.user, test=obj, passed=True).exists()


class TestSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'time_limit_minutes', 'pass_percent',
                  'section', 'lesson', 'questions', 'question_count']


class StandaloneTestSerializer(serializers.ModelSerializer):
    """Card data for the public "Testlar" catalog and the teacher's test manager."""
    question_count = serializers.IntegerField(read_only=True)
    attempt_count = serializers.IntegerField(read_only=True)
    created_by = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    my_best = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'time_limit_minutes', 'pass_percent',
                  'is_public', 'category', 'created_by', 'question_count', 'attempt_count',
                  'my_best', 'created_at']

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
                  'section', 'lesson', 'category', 'is_public']


class QuestionWriteSerializer(serializers.ModelSerializer):
    options = AnswerOptionFullSerializer(many=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'order', 'options']

    def create(self, validated):
        options = validated.pop('options', [])
        q = Question.objects.create(**validated)
        for o in options:
            AnswerOption.objects.create(question=q, **o)
        return q

    def update(self, instance, validated):
        options = validated.pop('options', None)
        for k, v in validated.items():
            setattr(instance, k, v)
        instance.save()
        if options is not None:
            instance.options.all().delete()
            for o in options:
                AnswerOption.objects.create(question=instance, **o)
        return instance


class TestAttemptResultSerializer(serializers.ModelSerializer):
    test = TestSerializer(read_only=True)
    answers = serializers.SerializerMethodField()

    class Meta:
        model = TestAttempt
        fields = ['id', 'test', 'score_percent', 'correct_count', 'wrong_count', 'passed',
                  'finish_reason', 'started_at', 'finished_at', 'answers']

    def get_answers(self, obj):
        out = []
        qs = obj.answers.select_related('question', 'selected_option') \
                        .prefetch_related('selected_options', 'question__options')
        for a in qs:
            q = a.question
            correct_opts = [o for o in q.options.all() if o.is_correct]

            if q.question_type == Question.TYPE_TEXT:
                selected_text = a.text_answer or None
            elif q.question_type == Question.TYPE_MULTIPLE:
                picked = list(a.selected_options.all())
                selected_text = ', '.join(o.text for o in picked) if picked else None
            else:
                selected_text = a.selected_option.text if a.selected_option else None

            out.append({
                'question_id': q.id,
                'question_text': q.text,
                'question_type': q.question_type,
                'selected_option_id': a.selected_option_id,
                'selected_text': selected_text,
                'correct_option_id': correct_opts[0].id if correct_opts else None,
                'correct_text': ', '.join(o.text for o in correct_opts) if correct_opts else None,
                'is_correct': a.is_correct,
            })
        return out


class TestAttemptStartSerializer(serializers.ModelSerializer):
    test = TestSerializer(read_only=True)

    class Meta:
        model = TestAttempt
        fields = ['id', 'test', 'started_at']
