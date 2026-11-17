from rest_framework import serializers
from apps.accounts.serializers import UserMiniSerializer
from .models import (
    Category, Course, Section, Lesson, Enrollment, LessonProgress, Review,
    LessonComment, LessonResource,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon']


class CategoryWithCountSerializer(CategorySerializer):
    course_count = serializers.IntegerField(read_only=True)
    test_count = serializers.IntegerField(read_only=True)

    class Meta(CategorySerializer.Meta):
        fields = CategorySerializer.Meta.fields + ['course_count', 'test_count']


class LessonSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()
    tests = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'order', 'video_type', 'youtube_url', 'video_file',
                  'description', 'duration_minutes', 'is_free_preview', 'is_completed', 'tests']

    def get_is_completed(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user or not user.is_authenticated:
            return False
        return LessonProgress.objects.filter(student=user, lesson=obj, completed=True).exists()

    def get_tests(self, obj):
        # Kept for API compatibility — tests now live in section.items.
        return []


class SectionSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    tests = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    lesson_count = serializers.SerializerMethodField()
    test_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ["id", "title", "order", "lessons", "tests", "items", "lesson_count", "test_count"]

    def _tests(self, obj):
        cache = self.context.setdefault("_section_tests", {})
        if obj.id not in cache:
            from apps.tests.serializers import TestMiniSerializer
            tests = sorted(obj.tests.all(), key=lambda t: (t.order, t.id))
            cache[obj.id] = TestMiniSerializer(tests, many=True, context=self.context).data
        return cache[obj.id]

    def get_tests(self, obj):
        return self._tests(obj)

    def get_items(self, obj):
        """Lessons and tests merged into the single order the teacher arranged."""
        rows = []
        for l in obj.lessons.all():
            done = LessonProgress.objects.filter(
                student=self.context["request"].user, lesson=l, completed=True
            ).exists() if self._authed() else False
            rows.append({
                "kind": "lesson", "id": l.id, "title": l.title, "order": l.order,
                "duration_minutes": l.duration_minutes, "is_free_preview": l.is_free_preview,
                "video_type": l.video_type, "is_completed": done,
            })
        for t in self._tests(obj):
            rows.append({
                "kind": "test", "id": t["id"], "title": t["title"], "order": t["order"],
                "question_count": t["question_count"], "time_limit_minutes": t["time_limit_minutes"],
                "pass_percent": t["pass_percent"], "is_passed": t["is_passed"], "best_score": t["best_score"],
            })
        # Lessons win ties so legacy data (all tests at 0) keeps a sane order.
        rows.sort(key=lambda r: (r["order"], 0 if r["kind"] == "lesson" else 1, r["id"]))
        return rows

    def _authed(self):
        req = self.context.get("request")
        return bool(req and req.user and req.user.is_authenticated)

    def get_lesson_count(self, obj):
        return obj.lessons.count()

    def get_test_count(self, obj):
        return obj.tests.count()


class ReviewSerializer(serializers.ModelSerializer):
    student = UserMiniSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'student', 'rating', 'comment', 'created_at']
        read_only_fields = ['student', 'created_at']


class CourseListSerializer(serializers.ModelSerializer):
    teacher = UserMiniSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    rating_avg = serializers.FloatField(read_only=True)
    rating_count = serializers.IntegerField(read_only=True)
    students_count = serializers.IntegerField(read_only=True)
    lessons_count = serializers.IntegerField(read_only=True)
    progress = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'slug', 'title', 'description', 'thumbnail', 'thumb_emoji', 'thumb_color',
                  'teacher', 'category', 'level', 'status', 'is_free', 'price',
                  'rating_avg', 'rating_count', 'students_count', 'lessons_count',
                  'progress', 'is_enrolled', 'created_at']

    def _enrollment(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user or not user.is_authenticated:
            return None
        return Enrollment.objects.filter(student=user, course=obj).first()

    def get_progress(self, obj):
        e = self._enrollment(obj)
        return e.progress_percent if e else 0

    def get_is_enrolled(self, obj):
        return bool(self._enrollment(obj))


class CourseDetailSerializer(CourseListSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    total_duration_minutes = serializers.IntegerField(read_only=True)
    reviews = serializers.SerializerMethodField()
    rejection_note = serializers.SerializerMethodField()

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + ['sections', 'total_duration_minutes', 'reviews', 'rejection_note']

    def get_rejection_note(self, obj):
        # Visible only to the course owner / admin
        req = self.context.get('request')
        user = getattr(req, 'user', None)
        if user and user.is_authenticated and (user.id == obj.teacher_id or user.role == 'admin' or user.is_superuser):
            return obj.rejection_note
        return ''

    def get_reviews(self, obj):
        return ReviewSerializer(obj.reviews.all()[:5], many=True).data


class CourseWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Course
        fields = ['id', 'slug', 'title', 'description', 'thumbnail', 'thumb_emoji', 'thumb_color',
                  'category_id', 'level', 'is_free', 'price', 'status']
        read_only_fields = ['id', 'slug']

    def validate_status(self, value):
        user = self.context['request'].user
        is_admin = user.role == 'admin' or user.is_superuser
        if not is_admin and value not in ('draft', 'pending'):
            raise serializers.ValidationError(
                "Kursni nashr etish faqat moderatsiya orqali amalga oshiriladi")
        return value

    def create(self, validated):
        cat_id = validated.pop('category_id', None)
        course = Course.objects.create(teacher=self.context['request'].user, category_id=cat_id, **validated)
        return course

    def update(self, instance, validated):
        cat_id = validated.pop('category_id', None)
        if cat_id is not None:
            instance.category_id = cat_id
        for k, v in validated.items():
            setattr(instance, k, v)
        instance.save()
        return instance


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'course', 'enrolled_at', 'completed', 'completed_at', 'progress_percent']


class LessonCommentSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = LessonComment
        fields = ['id', 'lesson', 'user', 'text', 'created_at']
        read_only_fields = ['id', 'lesson', 'user', 'created_at']


class LessonResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonResource
        fields = ['id', 'lesson', 'title', 'file', 'created_at']
        read_only_fields = ['id', 'lesson', 'created_at']
