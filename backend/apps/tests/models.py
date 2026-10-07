from django.conf import settings
from django.db import models


class Test(models.Model):
    section = models.ForeignKey('courses.Section', on_delete=models.CASCADE, related_name='tests', null=True, blank=True)
    lesson = models.ForeignKey('courses.Lesson', on_delete=models.CASCADE, related_name='tests', null=True, blank=True)
    # Standalone tests (no section/lesson) live in the public "Testlar" catalog.
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='tests_created')
    category = models.ForeignKey('courses.Category', on_delete=models.SET_NULL,
                                 null=True, blank=True, related_name='tests')
    is_public = models.BooleanField(default=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    time_limit_minutes = models.PositiveIntegerField(null=True, blank=True)
    pass_percent = models.PositiveSmallIntegerField(default=60)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def question_count(self):
        return self.questions.count()

    @property
    def is_standalone(self):
        return self.section_id is None and self.lesson_id is None

    @property
    def attempt_count(self):
        return self.attempts.filter(finished_at__isnull=False).count()


class Question(models.Model):
    TYPE_SINGLE = 'single'
    TYPE_MULTIPLE = 'multiple'
    TYPE_TRUE_FALSE = 'true_false'
    TYPE_TEXT = 'text'
    TYPE_CHOICES = [
        (TYPE_SINGLE, "Bitta to'g'ri javob"),
        (TYPE_MULTIPLE, "Bir nechta to'g'ri javob"),
        (TYPE_TRUE_FALSE, "To'g'ri / Noto'g'ri"),
        (TYPE_TEXT, 'Yozma javob'),
    ]

    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=12, choices=TYPE_CHOICES, default=TYPE_SINGLE)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return self.text[:60]


class AnswerOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']


class TestAttempt(models.Model):
    FINISH_MANUAL = 'manual'
    FINISH_TIMEOUT = 'timeout'
    FINISH_FOCUS_LOST = 'focus_lost'
    FINISH_LEFT = 'left'
    FINISH_CHOICES = [
        (FINISH_MANUAL, "O'zi yakunladi"),
        (FINISH_TIMEOUT, 'Vaqt tugadi'),
        (FINISH_FOCUS_LOST, 'Sahifadan chiqib ketdi'),
        (FINISH_LEFT, 'Testni tark etdi'),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='test_attempts')
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='attempts')
    score_percent = models.FloatField(default=0)
    correct_count = models.PositiveIntegerField(default=0)
    wrong_count = models.PositiveIntegerField(default=0)
    passed = models.BooleanField(default=False)
    finish_reason = models.CharField(max_length=12, choices=FINISH_CHOICES, blank=True, default='')
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']


class AttemptAnswer(models.Model):
    attempt = models.ForeignKey(TestAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(AnswerOption, on_delete=models.SET_NULL, null=True, blank=True)
    # Multi-choice questions store every picked option here.
    selected_options = models.ManyToManyField(AnswerOption, blank=True, related_name='+')
    # Written-answer questions store the raw student input.
    text_answer = models.CharField(max_length=500, blank=True, default='')
    is_correct = models.BooleanField(default=False)
