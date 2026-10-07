from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, permissions, filters, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin, IsTeacher, IsOwnerOrAdmin
from apps.notifications.utils import notify

from .models import (
    Category, Course, Section, Lesson, Enrollment, LessonProgress, Review,
    LessonComment, LessonResource,
)
from .serializers import (
    CategorySerializer, CategoryWithCountSerializer,
    CourseListSerializer, CourseDetailSerializer, CourseWriteSerializer,
    SectionSerializer, LessonSerializer, ReviewSerializer, EnrollmentSerializer,
    LessonCommentSerializer, LessonResourceSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    """Public read; admin-only create/update/delete."""
    serializer_class = CategoryWithCountSerializer
    pagination_class = None

    def get_queryset(self):
        from django.db.models import Count
        return Category.objects.annotate(
            course_count=Count('courses', distinct=True),
            test_count=Count('tests', distinct=True),
        )

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [IsAdmin()]


class CourseViewSet(viewsets.ModelViewSet):
    lookup_field = 'slug'
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    from django_filters.rest_framework import DjangoFilterBackend
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'teacher__full_name']
    ordering_fields = ['created_at', 'title', 'avg_rating']
    filterset_fields = ['category', 'level', 'status', 'is_free', 'teacher']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return CourseWriteSerializer
        return CourseListSerializer

    def get_queryset(self):
        from django.db.models import Q, Avg
        from django.db.models.functions import Coalesce
        qs = (Course.objects
              .select_related('teacher', 'category')
              .prefetch_related('sections__lessons')
              .annotate(avg_rating=Coalesce(Avg('reviews__rating'), 0.0)))
        user = self.request.user
        # Owner sees own (all statuses); admin sees all; everyone else only published.
        # This applies to detail views too so unpublished courses never leak by slug.
        if user.is_authenticated and (user.role == 'admin' or user.is_superuser):
            pass
        elif user.is_authenticated:
            qs = qs.filter(Q(status='published') | Q(teacher=user))
        else:
            qs = qs.filter(status='published')
        if self.action == 'list':
            status_q = self.request.query_params.get('status')
            if status_q:
                qs = qs.filter(status=status_q)
            mine = self.request.query_params.get('mine')
            if mine and user.is_authenticated:
                qs = qs.filter(teacher=user)
        return qs.distinct()

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'curriculum', 'reviews'):
            return [permissions.AllowAny()]
        if self.action in ('create',):
            return [IsTeacher()]
        if self.action in ('enroll', 'review'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    @action(detail=True, methods=['get'])
    def curriculum(self, request, slug=None):
        course = self.get_object()
        return Response(SectionSerializer(course.sections.all(), many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def enroll(self, request, slug=None):
        course = self.get_object()
        enrollment, created = Enrollment.objects.get_or_create(student=request.user, course=course)
        if created:
            notify(request.user, 'enrollment', f'"{course.title}" kursiga yozildingiz', f'/learn/{course.slug}')
        return Response(EnrollmentSerializer(enrollment).data, status=201 if created else 200)

    @action(detail=True, methods=['get', 'post'])
    def reviews(self, request, slug=None):
        course = self.get_object()
        if request.method == 'GET':
            return Response(ReviewSerializer(course.reviews.all(), many=True).data)
        if not request.user.is_authenticated:
            return Response({'detail': 'Auth required'}, status=401)
        review, _ = Review.objects.update_or_create(
            student=request.user, course=course,
            defaults={'rating': int(request.data.get('rating', 5)), 'comment': request.data.get('comment', '')},
        )
        return Response(ReviewSerializer(review).data, status=201)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def enrolled(self, request):
        enrollments = Enrollment.objects.filter(student=request.user).select_related('course__teacher')
        return Response(EnrollmentSerializer(enrollments, many=True, context={'request': request}).data)

    @action(detail=True, methods=['get'])
    def students(self, request, slug=None):
        """Per-course student statistics — only the course teacher or an admin."""
        from django.db.models import Count
        from apps.certificates.models import Certificate
        from apps.accounts.serializers import UserMiniSerializer

        course = self.get_object()
        enrollments = list(course.enrollments.select_related('student').order_by('-enrolled_at'))
        certs = {c.student_id: c for c in Certificate.objects.filter(course=course)}
        ratings = {r.student_id: r.rating for r in course.reviews.all()}
        lessons_total = Lesson.objects.filter(section__course=course).count()
        done_counts = dict(
            LessonProgress.objects.filter(lesson__section__course=course, completed=True)
            .values('student_id').annotate(n=Count('id')).values_list('student_id', 'n')
        )

        rows = []
        for e in enrollments:
            cert = certs.get(e.student_id)
            rows.append({
                'id': e.id,
                'student': UserMiniSerializer(e.student).data,
                'enrolled_at': e.enrolled_at,
                'progress_percent': e.progress_percent,
                'completed': e.completed,
                'completed_at': e.completed_at,
                'lessons_done': done_counts.get(e.student_id, 0),
                'rating': ratings.get(e.student_id),
                'certificate': {
                    'unique_id': str(cert.unique_id),
                    'score_percent': cert.score_percent,
                    'issued_at': cert.issued_at,
                } if cert else None,
            })

        n = len(enrollments)
        rating_values = list(ratings.values())
        return Response({
            'course': {'title': course.title, 'slug': course.slug, 'status': course.status,
                       'thumb_emoji': course.thumb_emoji, 'thumb_color': course.thumb_color},
            'stats': {
                'students': n,
                'avg_progress': round(sum(e.progress_percent for e in enrollments) / n, 1) if n else 0,
                'completed': sum(1 for e in enrollments if e.completed),
                'certificates': len(certs),
                'lessons_total': lessons_total,
                'rating_avg': round(sum(rating_values) / len(rating_values), 1) if rating_values else 0,
                'rating_count': len(rating_values),
            },
            'students': rows,
        })


# --- Sections / Lessons (nested under course) ---

class SectionViewSet(viewsets.ModelViewSet):
    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get_queryset(self):
        return Section.objects.filter(course__slug=self.kwargs['course_slug']).order_by('order')

    def perform_create(self, serializer):
        course = get_object_or_404(Course, slug=self.kwargs['course_slug'])
        if course.teacher != self.request.user and self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        serializer.save(course=course)


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Lesson.objects.filter(section_id=self.kwargs['section_id']).order_by('order')

    def perform_create(self, serializer):
        section = get_object_or_404(Section, pk=self.kwargs['section_id'])
        if section.course.teacher != self.request.user and self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        serializer.save(section=section)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def lesson_complete(request, lesson_id):
    lesson = get_object_or_404(Lesson, pk=lesson_id)
    LessonProgress.objects.get_or_create(student=request.user, lesson=lesson, defaults={'completed': True})
    enrollment, _ = Enrollment.objects.get_or_create(student=request.user, course=lesson.section.course)
    progress = enrollment.recompute_progress()
    cert_issued = False
    cert_uid = None
    if enrollment.completed:
        from apps.certificates.utils import issue_certificate
        cert, created = issue_certificate(request.user, lesson.section.course)
        cert_uid = str(cert.unique_id)
        if created:
            cert_issued = True
            notify(request.user, 'certificate',
                   f'"{lesson.section.course.title}" uchun sertifikat tayyor',
                   '/profile')
    return Response({
        'progress': progress,
        'completed': enrollment.completed,
        'certificate_issued': cert_issued,
        'certificate_uid': cert_uid,
    })


# --- Admin moderation ---

@api_view(['GET'])
@permission_classes([IsAdmin])
def pending_courses(request):
    qs = Course.objects.filter(status='pending').select_related('teacher', 'category')
    return Response(CourseListSerializer(qs, many=True, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def approve_course(request, slug):
    course = get_object_or_404(Course, slug=slug)
    course.status = 'published'
    course.rejection_note = ''
    course.save()
    notify(course.teacher, 'course_approved', f'"{course.title}" kursingiz nashr etildi', f'/courses/{course.slug}')
    return Response(CourseDetailSerializer(course, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def reject_course(request, slug):
    course = get_object_or_404(Course, slug=slug)
    course.status = 'rejected'
    course.rejection_note = request.data.get('note', '')
    course.save()
    notify(course.teacher, 'course_rejected', f'"{course.title}" kursingiz rad etildi', f'/teacher/courses/{course.slug}/edit')
    return Response(CourseDetailSerializer(course, context={'request': request}).data)


# Standalone Section/Lesson update/delete by id — only own course (or admin)
class SectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_superuser:
            return Section.objects.all()
        return Section.objects.filter(course__teacher=user)


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_superuser:
            return Lesson.objects.all()
        return Lesson.objects.filter(section__course__teacher=user)


# --- Lesson comments + resources ---

class LessonCommentsView(generics.ListCreateAPIView):
    serializer_class = LessonCommentSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return LessonComment.objects.filter(lesson_id=self.kwargs['lesson_id']).select_related('user')

    def perform_create(self, serializer):
        lesson = get_object_or_404(Lesson, pk=self.kwargs['lesson_id'])
        serializer.save(lesson=lesson, user=self.request.user)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_comment(request, pk):
    try:
        c = LessonComment.objects.get(pk=pk)
    except LessonComment.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    if c.user != request.user and request.user.role != 'admin' and not request.user.is_superuser:
        return Response({'detail': 'Forbidden'}, status=403)
    c.delete()
    return Response(status=204)


class LessonMaterialsView(generics.ListCreateAPIView):
    serializer_class = LessonResourceSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsTeacher()]

    def get_queryset(self):
        return LessonResource.objects.filter(lesson_id=self.kwargs['lesson_id'])

    def perform_create(self, serializer):
        lesson = get_object_or_404(Lesson, pk=self.kwargs['lesson_id'])
        user = self.request.user
        if lesson.section.course.teacher != user and user.role != 'admin' and not user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        serializer.save(lesson=lesson)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated, IsTeacher])
def delete_material(request, pk):
    try:
        m = LessonResource.objects.get(pk=pk)
    except LessonResource.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    user = request.user
    if m.lesson.section.course.teacher != user and user.role != 'admin' and not user.is_superuser:
        return Response({'detail': 'Forbidden'}, status=403)
    m.delete()
    return Response(status=204)
