"""Email verification, auth config and full account deletion."""
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailVerification
from .permissions import IsAdmin

User = get_user_model()

CODE_TTL_MINUTES = 15
RESEND_COOLDOWN_SECONDS = 60


class AuthThrottle(AnonRateThrottle):
    """Brute-force guard for code/password endpoints (per IP)."""
    scope = 'auth'
    rate = '30/min'


def _dev_mail():
    return settings.DEBUG and settings.EMAIL_BACKEND.endswith('console.EmailBackend')


def _email_html(title, code, note, minutes=CODE_TTL_MINUTES):
    return f"""
<div style="background:#FBF6EA;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#14213D">
  <div style="max-width:460px;margin:0 auto;background:#fff;border:2px solid #14213D;border-radius:20px;padding:32px">
    <div style="font-size:22px;font-weight:800;letter-spacing:-.5px">ionedu</div>
    <h1 style="font-size:20px;margin:22px 0 8px">{title}</h1>
    <p style="font-size:14px;line-height:1.6;color:#3B4763;margin:0 0 20px">{note}</p>
    <div style="font-size:34px;font-weight:800;letter-spacing:10px;text-align:center;background:#FFC83D;
                border:2px solid #14213D;border-radius:14px;padding:16px 0">{code}</div>
    <p style="font-size:12px;color:#6C7690;margin:20px 0 0">Kod {minutes} daqiqa amal qiladi.
      Agar bu so'rovni siz yubormagan bo'lsangiz, xatni e'tiborsiz qoldiring.</p>
  </div>
</div>"""


def send_verification_code(user, force=False):
    """Create + email a 6-digit code. Returns (sent: bool, wait_seconds, debug_code)."""
    email = user.email
    last = EmailVerification.objects.filter(email=email).first()
    # The cooldown only applies while a usable code is still out there.
    if last and last.is_valid() and not force:
        age = (timezone.now() - last.created_at).total_seconds()
        if age < RESEND_COOLDOWN_SECONDS:
            return False, int(RESEND_COOLDOWN_SECONDS - age), None

    code = f'{secrets.randbelow(1000000):06d}'
    EmailVerification.objects.filter(email=email, used=False).update(used=True)
    EmailVerification.objects.create(email=email, code=code)
    send_mail(
        'Ionedu — emailni tasdiqlash kodi',
        f'Emailni tasdiqlash kodi: {code}\nKod {CODE_TTL_MINUTES} daqiqa amal qiladi.',
        settings.DEFAULT_FROM_EMAIL,
        [email],
        html_message=_email_html(
            'Emailingizni tasdiqlang', code,
            "Ionedu'ga xush kelibsiz! Ro'yxatdan o'tishni yakunlash uchun quyidagi kodni kiriting."),
        fail_silently=True,
    )
    return True, RESEND_COOLDOWN_SECONDS, code if _dev_mail() else None


def verification_response(user, status=202):
    """Standard body telling the client to show the code-entry step."""
    sent, wait, debug_code = send_verification_code(user)
    body = {
        'verification_required': True,
        'email': user.email,
        'resend_in': wait,
        'detail': 'Emailingizga tasdiqlash kodi yuborildi',
    }
    if debug_code:
        # Dev only (DEBUG + console mail backend): no mailbox to read the code from.
        body['debug_code'] = debug_code
    return Response(body, status=status)


def token_response(user, request, status=200, **extra):
    from .serializers import UserSerializer
    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user, context={'request': request}).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        **extra,
    }, status=status)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthThrottle])
def verify_email(request):
    """Confirm the 6-digit code → account becomes verified and is signed in."""
    email = (request.data.get('email') or '').strip().lower()
    code = (request.data.get('code') or '').strip()
    if not email or not code:
        return Response({'detail': 'Email va kod kerak'}, status=400)

    user = User.objects.filter(email__iexact=email).first()
    rec = EmailVerification.objects.filter(email=email, used=False).first()
    if not user or not rec or not rec.is_valid():
        return Response({'detail': "Kod muddati tugagan. Yangi kod so'rang.", 'code': 'expired'}, status=400)
    if not secrets.compare_digest(rec.code, code):
        rec.attempts += 1
        rec.save(update_fields=['attempts'])
        left = max(EmailVerification.MAX_ATTEMPTS - rec.attempts, 0)
        return Response({'detail': f"Kod noto'g'ri. Qolgan urinishlar: {left}", 'code': 'invalid'}, status=400)
    if not user.is_active:
        return Response({'detail': 'Akkaunt bloklangan'}, status=403)

    rec.used = True
    rec.save(update_fields=['used'])
    if not user.is_verified:
        user.is_verified = True
        user.save(update_fields=['is_verified'])
        from apps.notifications.utils import notify
        notify(user, 'system', "Xush kelibsiz! Emailingiz tasdiqlandi — endi kurslarni boshlashingiz mumkin.", '/courses')
    return token_response(user, request)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthThrottle])
def resend_verification(request):
    email = (request.data.get('email') or '').strip().lower()
    user = User.objects.filter(email__iexact=email, is_verified=False).first()
    # Same answer whether or not the email exists — no account enumeration.
    body = {'detail': "Agar email ro'yxatdan o'tgan bo'lsa, yangi kod yuborildi.", 'resend_in': RESEND_COOLDOWN_SECONDS}
    if user:
        sent, wait, debug_code = send_verification_code(user)
        body['resend_in'] = wait
        if not sent:
            body['detail'] = f"Kod yaqinda yuborilgan. {wait} soniyadan so'ng qayta urinib ko'ring."
            return Response(body, status=429)
        if debug_code:
            body['debug_code'] = debug_code
    return Response(body)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def auth_config(request):
    """Public auth settings for the frontend (single source of truth)."""
    return Response({
        'google_client_id': getattr(settings, 'GOOGLE_CLIENT_ID', '') or '',
        'email_verification': True,
    })


# ─────────────────────────── Full account deletion ───────────────────────────

def _collect_user_files(user):
    """Every uploaded file that belongs only to this user (deleted with them)."""
    from apps.courses.models import Course, Lesson, LessonResource
    from apps.certificates.models import Certificate
    from apps.tests.models import Question
    from .models import TeacherCredential

    files = []
    if user.avatar:
        files.append(user.avatar)
    files += [c.file for c in TeacherCredential.objects.filter(teacher=user) if c.file]
    files += [c.pdf_file for c in Certificate.objects.filter(student=user) if c.pdf_file]
    files += [c.thumbnail for c in Course.objects.filter(teacher=user) if c.thumbnail]
    files += [l.video_file for l in Lesson.objects.filter(section__course__teacher=user) if l.video_file]
    files += [m.file for m in LessonResource.objects.filter(lesson__section__course__teacher=user) if m.file]
    files += [q.image for q in Question.objects.filter(test__section__course__teacher=user) if q.image]
    try:
        from apps.community.models import Post
        files += [p.image for p in Post.objects.filter(author=user) if p.image]
    except Exception:  # community app is optional
        pass
    return files


def purge_user(user):
    """Permanently delete a user with everything they own.

    Cascades remove enrollments, progress, attempts, certificates, reviews,
    comments, notifications, credentials and — for teachers — their courses
    with all sections, lessons and tests. Standalone tests they authored are
    removed too; blog posts / shared resources keep existing without an author.
    Uploaded files are removed from storage after the DB commit.
    """
    from apps.courses.models import Enrollment, Lesson
    from apps.tests.models import Test

    files = _collect_user_files(user)
    # A lesson copy can share a video with its original — keep files still in use.
    names = [f.name for f in files]
    summary = {
        'email': user.email,
        'courses': user.courses_taught.count(),
        'enrollments': Enrollment.objects.filter(student=user).count(),
        'attempts': user.test_attempts.count(),
        'certificates': user.certificates.count(),
    }
    with transaction.atomic():
        Test.objects.filter(created_by=user, section__isnull=True, lesson__isnull=True).delete()
        PasswordAndCodes.purge(user)
        user.delete()

    still_used = set(Lesson.objects.filter(video_file__in=names).values_list('video_file', flat=True))
    removed = 0
    for f in files:
        if f.name in still_used:
            continue
        try:
            f.storage.delete(f.name)
            removed += 1
        except Exception:  # a missing file must not undo the deletion
            pass
    summary['files_removed'] = removed
    return summary


class PasswordAndCodes:
    @staticmethod
    def purge(user):
        from .models import PasswordResetCode
        if user.email:
            PasswordResetCode.objects.filter(email=user.email).delete()
            EmailVerification.objects.filter(email=user.email).delete()


def _is_last_admin(user):
    if not (user.role == 'admin' or user.is_superuser):
        return False
    from django.db.models import Q
    others = User.objects.filter(Q(role='admin') | Q(is_superuser=True), is_active=True).exclude(pk=user.pk)
    return not others.exists()


def admin_delete_guard(target, actor):
    """Returns an error message if `actor` may not delete `target`, else None."""
    if target.pk == actor.pk:
        return "O'z akkauntingizni bu yerdan o'chira olmaysiz — Profil → Akkauntni o'chirish bo'limidan foydalaning"
    if _is_last_admin(target):
        return "Oxirgi administratorni o'chirib bo'lmaydi"
    if target.is_superuser and not actor.is_superuser:
        return "Superadminni faqat boshqa superadmin o'chira oladi"
    return None


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_bulk_delete_users(request):
    """Delete several users at once. Body: {"ids": [1, 2, 3]}"""
    ids = request.data.get('ids')
    if not isinstance(ids, list) or not ids:
        return Response({'detail': "Foydalanuvchilar tanlanmagan"}, status=400)
    deleted, skipped = [], []
    for u in User.objects.filter(pk__in=ids[:200]):
        err = admin_delete_guard(u, request.user)
        if err:
            skipped.append({'id': u.pk, 'name': u.display_name, 'reason': err})
            continue
        uid = u.pk
        purge_user(u)
        deleted.append(uid)
    return Response({'deleted': deleted, 'skipped': skipped})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def delete_me(request):
    """Self-service account deletion. Requires the password (or, for
    Google-only accounts without a password, typing the account email)."""
    user = request.user
    if user.has_usable_password():
        if not user.check_password(request.data.get('password') or ''):
            return Response({'detail': "Parol noto'g'ri"}, status=400)
    elif (request.data.get('confirm') or '').strip().lower() != (user.email or '').lower():
        return Response({'detail': 'Tasdiqlash uchun email manzilingizni kiriting'}, status=400)
    if _is_last_admin(user):
        return Response({'detail': "Oxirgi administrator akkauntini o'chirib bo'lmaydi"}, status=400)
    purge_user(user)
    return Response({'detail': "Akkaunt butunlay o'chirildi"})
