from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Avg
from rest_framework import generics, permissions, status, viewsets, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    UserSerializer, RegisterSerializer, PhoneTokenObtainPairSerializer,
    PasswordResetSerializer, UserMiniSerializer, TeacherSerializer,
    AdminUserSerializer,
)
from .permissions import IsAdmin

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = PhoneTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def google_auth(request):
    """Sign in / sign up with a Google ID token (Google Identity Services)."""
    import requests as http
    from django.conf import settings as dj_settings

    credential = request.data.get('credential') or ''
    if not credential:
        return Response({'detail': 'credential kerak'}, status=400)

    try:
        r = http.get('https://oauth2.googleapis.com/tokeninfo',
                     params={'id_token': credential}, timeout=10)
        info = r.json()
    except Exception:
        return Response({'detail': "Google bilan bog'lanib bo'lmadi"}, status=502)

    client_id = getattr(dj_settings, 'GOOGLE_CLIENT_ID', '')
    if r.status_code != 200 or not info.get('email'):
        return Response({'detail': "Google token noto'g'ri"}, status=400)
    if client_id and info.get('aud') != client_id:
        return Response({'detail': "Google token boshqa ilovaga tegishli"}, status=400)
    if info.get('email_verified') not in (True, 'true'):
        return Response({'detail': 'Google email tasdiqlanmagan'}, status=400)

    email = info['email'].strip().lower()
    user = User.objects.filter(email__iexact=email).first()
    created = False
    if not user:
        user = User(email=email, username=email, role='student',
                    full_name=info.get('name', ''), is_verified=True)
        user.set_unusable_password()
        user.save()
        created = True
    if not user.is_active:
        return Response({'detail': 'Akkaunt bloklangan'}, status=403)

    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user, context={'request': request}).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'created': created,
    }, status=201 if created else 200)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        refresh = request.data.get('refresh')
        if refresh:
            RefreshToken(refresh).blacklist()
    except Exception:
        pass
    return Response({'detail': 'Logged out'})


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset(request):
    """Step 1 — send a 6-digit code via email (rate-limited to one per minute)."""
    import secrets
    from datetime import timedelta
    from django.core.mail import send_mail
    from django.conf import settings as dj_settings
    from django.utils import timezone
    from .models import PasswordResetCode

    ser = PasswordResetSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    email = ser.validated_data['email'].strip().lower()

    # Always return the same response so emails can't be enumerated.
    generic = {'detail': "Agar email mavjud bo'lsa, tasdiqlash kodi yuborildi."}

    if not User.objects.filter(email__iexact=email).exists():
        return Response(generic)

    recent = PasswordResetCode.objects.filter(
        email=email, created_at__gte=timezone.now() - timedelta(minutes=1)).exists()
    if recent:
        return Response({'detail': "Kod allaqachon yuborilgan. Bir daqiqadan so'ng qayta urinib ko'ring."}, status=429)

    code = f'{secrets.randbelow(1000000):06d}'
    PasswordResetCode.objects.create(email=email, code=code)
    send_mail(
        'Ionedu — parolni tiklash kodi',
        f'Parolni tiklash kodi: {code}\nKod 10 daqiqa amal qiladi.\n\nAgar bu siz bo\'lmasangiz, xatni e\'tiborsiz qoldiring.',
        getattr(dj_settings, 'DEFAULT_FROM_EMAIL', 'noreply@ionedu.uz'),
        [email],
        fail_silently=True,
    )
    return Response(generic)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    """Step 2 — verify the code and set a new password."""
    from .models import PasswordResetCode

    email = (request.data.get('email') or '').strip().lower()
    code = (request.data.get('code') or '').strip()
    new_password = request.data.get('new_password') or ''

    if not email or not code:
        return Response({'detail': 'Email va kod kerak'}, status=400)
    if len(new_password) < 6:
        return Response({'detail': 'Yangi parol kamida 6 ta belgi'}, status=400)

    rec = PasswordResetCode.objects.filter(email=email, used=False).first()
    if not rec or not rec.is_valid():
        return Response({'detail': "Kod muddati tugagan. Qaytadan so'rang."}, status=400)
    if rec.code != code:
        rec.attempts += 1
        rec.save()
        return Response({'detail': "Kod noto'g'ri"}, status=400)

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return Response({'detail': 'Foydalanuvchi topilmadi'}, status=404)

    rec.used = True
    rec.save()
    user.set_password(new_password)
    user.save()
    return Response({'detail': "Parol yangilandi. Endi yangi parol bilan kiring."})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    old = request.data.get('old_password') or ''
    new = request.data.get('new_password') or ''
    if not request.user.check_password(old):
        return Response({'detail': "Joriy parol noto'g'ri"}, status=400)
    if len(new) < 6:
        return Response({'detail': 'Yangi parol kamida 6 ta belgi'}, status=400)
    request.user.set_password(new)
    request.user.save()
    return Response({'detail': "Parol o'zgartirildi"})


# ---- Teachers (public) ----

class TeacherViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TeacherSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name', 'email', 'bio']

    def get_queryset(self):
        # Subqueries keep each stat correct — a plain multi-JOIN annotate
        # multiplies rows and skews counts/averages.
        from django.db.models import OuterRef, Subquery
        from apps.courses.models import Course, Enrollment, Review

        courses_sq = Course.objects.filter(teacher=OuterRef('pk'), status='published') \
            .values('teacher').annotate(c=Count('id')).values('c')[:1]
        students_sq = Enrollment.objects.filter(course__teacher=OuterRef('pk')) \
            .values('course__teacher').annotate(c=Count('student', distinct=True)).values('c')[:1]
        reviews_base = Review.objects.filter(course__teacher=OuterRef('pk')).values('course__teacher')
        review_count_sq = reviews_base.annotate(c=Count('id')).values('c')[:1]
        avg_rating_sq = reviews_base.annotate(a=Avg('rating')).values('a')[:1]

        return User.objects.filter(role='teacher').annotate(
            course_count=Subquery(courses_sq),
            students_count=Subquery(students_sq),
            review_count=Subquery(review_count_sq),
            avg_rating=Subquery(avg_rating_sq),
        ).order_by('-date_joined')


# ---- Admin ----

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    search_fields = ['email', 'full_name', 'username', 'phone', 'school', 'region', 'district']
    filterset_fields = ['role', 'is_active', 'region', 'district', 'school', 'birth_year']

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        params = self.request.query_params
        for f in ('role', 'is_active', 'region', 'district', 'school', 'birth_year'):
            v = params.get(f)
            if v not in (None, ''):
                if f == 'is_active':
                    v = v in ('1', 'true', 'True')
                qs = qs.filter(**{f: v})
        # Search across multiple fields
        q = params.get('search')
        if q:
            from django.db.models import Q
            qs = qs.filter(
                Q(email__icontains=q) | Q(full_name__icontains=q) | Q(phone__icontains=q)
                | Q(school__icontains=q) | Q(district__icontains=q) | Q(region__icontains=q)
            )
        return qs


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_user_filter_options(request):
    """Distinct values for region/school/birth_year — used by filter UI."""
    regions = list(User.objects.exclude(region='').values_list('region', flat=True).distinct().order_by('region'))
    schools = list(User.objects.exclude(school='').values_list('school', flat=True).distinct().order_by('school'))
    years = list(User.objects.exclude(birth_year__isnull=True).values_list('birth_year', flat=True).distinct().order_by('-birth_year'))
    return Response({'regions': regions, 'schools': schools, 'birth_years': years})


@api_view(['PUT'])
@permission_classes([IsAdmin])
def set_user_role(request, user_id):
    role = request.data.get('role')
    if role not in dict(User.ROLE_CHOICES):
        return Response({'detail': 'Invalid role'}, status=400)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    user.role = role
    user.save()
    return Response(UserSerializer(user).data)


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_stats(request):
    from apps.courses.models import Course, Enrollment
    from apps.certificates.models import Certificate
    return Response({
        'users_total': User.objects.count(),
        'users_students': User.objects.filter(role='student').count(),
        'users_teachers': User.objects.filter(role='teacher').count(),
        'users_admins': User.objects.filter(role='admin').count(),
        'courses_total': Course.objects.count(),
        'courses_pending': Course.objects.filter(status='pending').count(),
        'courses_published': Course.objects.filter(status='published').count(),
        'enrollments_total': Enrollment.objects.count(),
        'certificates_total': Certificate.objects.count(),
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_analytics(request):
    """12-month time series + distributions for the admin dashboard charts."""
    from datetime import timedelta
    from django.utils import timezone
    from django.db.models import Count as C
    from django.db.models.functions import TruncMonth
    from apps.courses.models import Course, Enrollment
    from apps.certificates.models import Certificate
    from apps.tests.models import TestAttempt

    start = (timezone.now() - timedelta(days=365)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def monthly(qs, field):
        rows = (qs.filter(**{f'{field}__gte': start})
                .annotate(m=TruncMonth(field)).values('m')
                .annotate(c=C('id')).order_by('m'))
        return {r['m'].strftime('%Y-%m'): r['c'] for r in rows}

    # Continuous 12-month axis so charts have no gaps
    months = []
    cur = start
    now = timezone.now()
    while cur <= now:
        months.append(cur.strftime('%Y-%m'))
        cur = (cur + timedelta(days=32)).replace(day=1)

    u = monthly(User.objects.all(), 'date_joined')
    e = monthly(Enrollment.objects.all(), 'enrolled_at')
    c = monthly(Certificate.objects.all(), 'issued_at')

    top_courses = list(
        Course.objects.filter(status='published')
        .annotate(n=C('enrollments', distinct=True))
        .order_by('-n')[:6]
        .values('title', 'slug', 'n')
    )

    return Response({
        'months': months,
        'registrations': [u.get(m, 0) for m in months],
        'enrollments': [e.get(m, 0) for m in months],
        'certificates': [c.get(m, 0) for m in months],
        'roles': {
            'students': User.objects.filter(role='student').count(),
            'teachers': User.objects.filter(role='teacher').count(),
            'admins': User.objects.filter(role='admin').count(),
        },
        'top_courses': top_courses,
        'attempts_total': TestAttempt.objects.filter(finished_at__isnull=False).count(),
    })


# ---- Team (public list + admin CRUD) ----

from .models import TeamMember
from .serializers import TeamMemberSerializer


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def team_public(request):
    """Active team members for the About page."""
    qs = TeamMember.objects.filter(is_active=True)
    return Response(TeamMemberSerializer(qs, many=True, context={'request': request}).data)


class AdminTeamViewSet(viewsets.ModelViewSet):
    """Admin manages the About-page team."""
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_stats(request):
    """Public counters shown on the home page."""
    from apps.courses.models import Course
    from apps.certificates.models import Certificate
    return Response({
        'students': User.objects.filter(role='student').count(),
        'teachers': User.objects.filter(role='teacher').count(),
        'courses': Course.objects.filter(status='published').count(),
        'certificates': Certificate.objects.count(),
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_user_detail(request, pk):
    """Full user detail with their enrollments / courses / activity."""
    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    from apps.courses.models import Enrollment, Course
    from apps.certificates.models import Certificate
    from apps.tests.models import TestAttempt

    data = UserSerializer(u, context={'request': request}).data
    if u.role == 'student':
        data['enrollments'] = [{
            'id': e.id, 'course_title': e.course.title, 'course_slug': e.course.slug,
            'progress_percent': e.progress_percent, 'completed': e.completed, 'enrolled_at': e.enrolled_at,
        } for e in Enrollment.objects.filter(student=u).select_related('course')]
        data['certificates'] = [{
            'id': c.id, 'unique_id': str(c.unique_id), 'course_title': c.course.title,
            'issued_at': c.issued_at, 'score_percent': c.score_percent,
        } for c in Certificate.objects.filter(student=u).select_related('course')]
        data['attempts_count'] = TestAttempt.objects.filter(student=u).count()
    elif u.role == 'teacher':
        from apps.courses.serializers import CourseListSerializer
        data['courses'] = CourseListSerializer(
            Course.objects.filter(teacher=u), many=True, context={'request': request}
        ).data
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_user_set_status(request, pk):
    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    is_active = request.data.get('is_active')
    if is_active is not None:
        u.is_active = bool(is_active)
        u.save()
    return Response(UserSerializer(u, context={'request': request}).data)


# ---- Teacher credentials ----

from .models import TeacherCredential
from .serializers import TeacherCredentialSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser as _JSONParser


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def teacher_credentials_self(request):
    """Current teacher manages their own credentials."""
    if request.method == 'GET':
        if not request.user.is_authenticated:
            return Response({'detail': 'Auth required'}, status=401)
        qs = TeacherCredential.objects.filter(teacher=request.user)
        return Response(TeacherCredentialSerializer(qs, many=True, context={'request': request}).data)

    # POST — create new credential
    if request.user.role not in ('teacher', 'admin'):
        return Response({'detail': "Faqat o'qituvchilar uchun"}, status=403)
    ser = TeacherCredentialSerializer(data=request.data, context={'request': request})
    ser.is_valid(raise_exception=True)
    ser.save(teacher=request.user)
    return Response(ser.data, status=201)


teacher_credentials_self.parser_classes = [MultiPartParser, FormParser, _JSONParser]


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_credential(request, pk):
    try:
        cred = TeacherCredential.objects.get(pk=pk)
    except TeacherCredential.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    if cred.teacher != request.user and request.user.role != 'admin':
        return Response({'detail': 'Forbidden'}, status=403)
    cred.delete()
    return Response(status=204)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def teacher_credentials_public(request, teacher_id):
    qs = TeacherCredential.objects.filter(teacher_id=teacher_id)
    return Response(TeacherCredentialSerializer(qs, many=True, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def message_teacher(request, teacher_id):
    """Persist a message from student to teacher as a notification."""
    try:
        teacher = User.objects.get(pk=teacher_id, role__in=['teacher', 'admin'])
    except User.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    text = (request.data.get('text') or '').strip()
    if not text:
        return Response({'detail': "Xabar matni kerak"}, status=400)
    from django.utils.html import escape
    from apps.notifications.utils import notify
    sender = request.user.display_name
    # User content is escaped — the frontend renders only <strong> markup.
    notify(teacher, 'system', f"<strong>{escape(sender)}</strong>: {escape(text)}", '')
    return Response({'detail': "Xabar yuborildi"})


# ---- Search ----

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_view(request):
    from apps.courses.models import Course
    from apps.courses.serializers import CourseListSerializer
    from apps.resources.models import Resource
    from apps.resources.serializers import ResourceSerializer
    from apps.tests.models import Test
    from apps.tests.serializers import StandaloneTestSerializer

    q = (request.query_params.get('q') or '').strip()
    if not q:
        return Response({'courses': [], 'teachers': [], 'resources': [], 'tests': []})

    courses = Course.objects.filter(status='published').filter(
        Q(title__icontains=q) | Q(description__icontains=q)
    )[:12]
    teachers = User.objects.filter(role='teacher').filter(
        Q(full_name__icontains=q) | Q(email__icontains=q) | Q(bio__icontains=q)
    )[:8]
    resources = Resource.objects.filter(
        Q(title__icontains=q) | Q(description__icontains=q)
    )[:12]
    tests = Test.objects.filter(
        is_public=True, section__isnull=True, lesson__isnull=True,
    ).filter(Q(title__icontains=q) | Q(description__icontains=q))[:12]

    return Response({
        'q': q,
        'courses': CourseListSerializer(courses, many=True, context={'request': request}).data,
        'teachers': UserSerializer(teachers, many=True, context={'request': request}).data,
        'resources': ResourceSerializer(resources, many=True, context={'request': request}).data,
        'tests': StandaloneTestSerializer(tests, many=True, context={'request': request}).data,
    })


# ---- Site settings + contact ----

from .models import SiteSettings, ContactMessage
from .serializers import SiteSettingsSerializer, ContactMessageSerializer


@api_view(['GET', 'PUT'])
@permission_classes([permissions.AllowAny])
def site_settings_view(request):
    """Public GET; admin-only PUT."""
    obj = SiteSettings.get_solo()
    if request.method == 'GET':
        return Response(SiteSettingsSerializer(obj).data)
    if not (request.user.is_authenticated and (request.user.role == 'admin' or request.user.is_superuser)):
        return Response({'detail': 'Forbidden'}, status=403)
    ser = SiteSettingsSerializer(obj, data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response(ser.data)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def contact_submit(request):
    ser = ContactMessageSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response({'detail': 'Xabaringiz qabul qilindi'}, status=201)


class AdminContactMessagesView(generics.ListAPIView):
    """Paginated inbox — scales with data growth."""
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = ContactMessage.objects.all().order_by('is_read', '-created_at')
        q = self.request.query_params.get('search')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(email__icontains=q)
                           | Q(subject__icontains=q) | Q(message__icontains=q))
        unread = self.request.query_params.get('unread')
        if unread:
            qs = qs.filter(is_read=False)
        return qs


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_contact_mark_read(request, pk):
    try:
        m = ContactMessage.objects.get(pk=pk)
    except ContactMessage.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    m.is_read = True
    m.save()
    return Response(ContactMessageSerializer(m).data)


# ---- Admin reviews ----

class AdminReviewsView(generics.ListAPIView):
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        from rest_framework import serializers as drf
        from apps.courses.serializers import ReviewSerializer

        class AdminReviewSerializer(ReviewSerializer):
            course_title = drf.CharField(source='course.title', read_only=True)
            course_slug = drf.CharField(source='course.slug', read_only=True)

            class Meta(ReviewSerializer.Meta):
                fields = ReviewSerializer.Meta.fields + ['course_title', 'course_slug']

        return AdminReviewSerializer

    def get_queryset(self):
        from apps.courses.models import Review
        qs = Review.objects.select_related('student', 'course').order_by('-created_at')
        q = self.request.query_params.get('search')
        if q:
            qs = qs.filter(Q(comment__icontains=q) | Q(course__title__icontains=q)
                           | Q(student__full_name__icontains=q))
        return qs


@api_view(['DELETE'])
@permission_classes([IsAdmin])
def admin_review_delete(request, pk):
    from apps.courses.models import Review
    try:
        Review.objects.get(pk=pk).delete()
    except Review.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    return Response(status=204)


# ---- Teacher endpoints ----

from .permissions import IsTeacher


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsTeacher])
def teacher_students(request):
    from apps.courses.models import Enrollment
    qs = Enrollment.objects.filter(course__teacher=request.user).select_related('student', 'course').order_by('-enrolled_at')[:300]
    out = []
    for e in qs:
        out.append({
            'id': e.id,
            'student': UserMiniSerializer(e.student).data,
            'course_title': e.course.title,
            'course_slug': e.course.slug,
            'enrolled_at': e.enrolled_at,
            'completed': e.completed,
            'progress_percent': e.progress_percent,
        })
    return Response(out)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsTeacher])
def teacher_reviews(request):
    from apps.courses.models import Review
    qs = Review.objects.filter(course__teacher=request.user).select_related('student', 'course').order_by('-created_at')[:200]
    out = []
    for r in qs:
        out.append({
            'id': r.id,
            'student': UserMiniSerializer(r.student).data,
            'course_title': r.course.title,
            'rating': r.rating,
            'comment': r.comment,
            'created_at': r.created_at,
        })
    return Response(out)


# ---- Admin certificates list ----

class AdminCertificatesView(generics.ListAPIView):
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        from apps.certificates.serializers import CertificateSerializer
        return CertificateSerializer

    def get_queryset(self):
        from apps.certificates.models import Certificate
        qs = Certificate.objects.select_related('student', 'course__teacher').order_by('-issued_at')
        q = self.request.query_params.get('search')
        if q:
            qs = qs.filter(Q(student__full_name__icontains=q) | Q(student__phone__icontains=q)
                           | Q(course__title__icontains=q))
        return qs
