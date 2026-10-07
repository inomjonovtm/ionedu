from django.conf import settings
from django.db import models
from django.utils.text import slugify
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    icon = models.CharField(max_length=20, blank=True, default='📘')

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Course(models.Model):
    LEVEL_CHOICES = (('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced'))
    STATUS_CHOICES = (('draft', 'Draft'), ('pending', 'Pending'), ('published', 'Published'), ('rejected', 'Rejected'))
    THUMB_COLORS = (
        ('blue', 'blue'), ('green', 'green'), ('amber', 'amber'),
        ('rose', 'rose'), ('teal', 'teal'), ('violet', 'violet'), ('slate', 'slate'),
    )

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(upload_to='courses/', null=True, blank=True)
    thumb_emoji = models.CharField(max_length=10, default='🌍')
    thumb_color = models.CharField(max_length=10, choices=THUMB_COLORS, default='blue')

    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='courses_taught')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='courses')
    level = models.CharField(max_length=15, choices=LEVEL_CHOICES, default='beginner')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='draft')
    is_free = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rejection_note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title) or 'course'
            slug = base
            i = 1
            while Course.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                i += 1
                slug = f'{base}-{i}'
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    @property
    def rating_avg(self):
        agg = self.reviews.aggregate(avg=models.Avg('rating'))['avg']
        return round(agg, 1) if agg else 0.0

    @property
    def rating_count(self):
        return self.reviews.count()

    @property
    def students_count(self):
        return self.enrollments.count()

    @property
    def lessons_count(self):
        return Lesson.objects.filter(section__course=self).count()

    @property
    def total_duration_minutes(self):
        agg = Lesson.objects.filter(section__course=self).aggregate(s=models.Sum('duration_minutes'))['s']
        return agg or 0


class Section(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sections')
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f'{self.course.title} – {self.title}'


class Lesson(models.Model):
    VIDEO_TYPES = (('youtube', 'YouTube'), ('upload', 'Upload'))
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)
    video_type = models.CharField(max_length=10, choices=VIDEO_TYPES, default='youtube')
    youtube_url = models.URLField(blank=True)
    video_file = models.FileField(upload_to='lessons/', null=True, blank=True)
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveIntegerField(default=10)
    is_free_preview = models.BooleanField(default=False)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return self.title


class Enrollment(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    progress_percent = models.FloatField(default=0)

    class Meta:
        unique_together = ('student', 'course')
        ordering = ['-enrolled_at']

    def recompute_progress(self):
        from apps.tests.models import Test, TestAttempt
        lessons_total = Lesson.objects.filter(section__course=self.course).count()
        tests_total = Test.objects.filter(section__course=self.course).count()
        total = lessons_total + tests_total
        if total == 0:
            self.progress_percent = 0
        else:
            lessons_done = LessonProgress.objects.filter(
                student=self.student, lesson__section__course=self.course, completed=True
            ).count()
            tests_passed = TestAttempt.objects.filter(
                student=self.student, test__section__course=self.course, passed=True
            ).values('test_id').distinct().count()
            done = lessons_done + tests_passed
            self.progress_percent = round(done / total * 100, 1)
        if self.progress_percent >= 100 and not self.completed:
            self.completed = True
            self.completed_at = timezone.now()
        elif self.progress_percent < 100:
            self.completed = False
            self.completed_at = None
        self.save()
        return self.progress_percent


class LessonProgress(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='completions')
    completed = models.BooleanField(default=True)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'lesson')


class Review(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')
        ordering = ['-created_at']


class LessonComment(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} on {self.lesson}'


class LessonResource(models.Model):
    """Downloadable material attached to a lesson."""
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='lesson-materials/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
