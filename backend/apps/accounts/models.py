from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
import re


def normalize_phone(phone: str) -> str:
    """Normalize to +998XXXXXXXXX format."""
    if not phone:
        return phone
    digits = re.sub(r'\D', '', str(phone))
    if digits.startswith('998'):
        return '+' + digits
    if len(digits) == 9:
        return '+998' + digits
    if digits.startswith('8') and len(digits) == 12:
        return '+99' + digits
    return '+' + digits if not str(phone).startswith('+') else str(phone)


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        extra.setdefault('username', email)
        if extra.get('phone'):
            extra['phone'] = normalize_phone(extra['phone'])
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email=None, password=None, **extra):
        extra.setdefault('is_staff', False)
        extra.setdefault('is_superuser', False)
        # Backward compat: allow create_user(phone=...) style
        if not email and extra.get('phone'):
            email = f"{normalize_phone(extra['phone']).lstrip('+')}@ionedu.uz"
        return self._create_user(email, password, **extra)

    def create_superuser(self, email=None, password=None, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        extra.setdefault('role', 'admin')
        extra.setdefault('is_verified', True)
        return self._create_user(email, password, **extra)


class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    )

    phone = models.CharField(max_length=20, unique=True, null=True, blank=True, db_index=True)
    email = models.EmailField(unique=True, null=True, blank=True, db_index=True)
    full_name = models.CharField(max_length=120, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    is_verified = models.BooleanField(default=False)
    bio = models.TextField(blank=True)
    city = models.CharField(max_length=80, blank=True)

    # Student extras
    birth_year = models.PositiveIntegerField(null=True, blank=True)
    region = models.CharField(max_length=80, blank=True, default='')
    district = models.CharField(max_length=80, blank=True, default='')
    school = models.CharField(max_length=200, blank=True, default='')

    # Teacher extras
    specialty = models.CharField(max_length=160, blank=True, default='',
                                 help_text="Masalan: Fizik geografiya o'qituvchisi")
    experience_years = models.PositiveIntegerField(null=True, blank=True)
    education = models.TextField(blank=True, default='',
                                 help_text="Diplom, daraja, oliy ta'lim muassasasi")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = UserManager()

    def save(self, *args, **kwargs):
        if self.phone:
            self.phone = normalize_phone(self.phone)
        else:
            self.phone = None  # '' would violate unique
        if self.email:
            self.email = self.email.strip().lower()
        else:
            self.email = None
        if not self.username:
            self.username = self.email or self.phone
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email or self.phone or self.username

    @property
    def display_name(self):
        return self.full_name or (self.email.split('@')[0] if self.email else '') or self.phone or self.username

    @property
    def initials(self):
        if self.full_name:
            parts = self.full_name.split()
            if len(parts) >= 2:
                return (parts[0][0] + parts[1][0]).upper()
            return parts[0][:2].upper()
        if self.email:
            return self.email[:2].upper()
        if self.phone:
            d = re.sub(r'\D', '', self.phone)
            return d[-2:] if len(d) >= 2 else '??'
        return '??'


class SiteSettings(models.Model):
    """Single-row table for global site config."""
    site_name = models.CharField(max_length=80, default='Ionedu')
    contact_email = models.EmailField(default='info@ionedu.uz')
    contact_phone = models.CharField(max_length=30, blank=True, default='')
    address = models.CharField(max_length=200, blank=True, default='')
    telegram_url = models.URLField(blank=True, default='')
    instagram_url = models.URLField(blank=True, default='')
    youtube_url = models.URLField(blank=True, default='')
    facebook_url = models.URLField(blank=True, default='')
    about_text = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Site settings'
        verbose_name_plural = 'Site settings'

    def __str__(self):
        return self.site_name

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class ContactMessage(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} – {self.subject}'


class PasswordResetCode(models.Model):
    """6-digit verification code for password reset (email; legacy rows used phone)."""
    phone = models.CharField(max_length=20, db_index=True, blank=True, default='')
    email = models.EmailField(db_index=True, blank=True, default='')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def is_valid(self):
        from django.utils import timezone
        from datetime import timedelta
        return (not self.used and self.attempts < 5
                and timezone.now() - self.created_at < timedelta(minutes=10))


class TeamMember(models.Model):
    """Platform team member shown on the public About page; managed by admins."""
    full_name = models.CharField(max_length=120)
    position = models.CharField(max_length=160)
    bio = models.CharField(max_length=300, blank=True, default='')
    photo = models.ImageField(upload_to='team/', null=True, blank=True)
    telegram = models.URLField(blank=True, default='')
    linkedin = models.URLField(blank=True, default='')
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return self.full_name

    @property
    def initials(self):
        parts = self.full_name.split()
        return ''.join(p[0].upper() for p in parts[:2]) or '?'


class TeacherCredential(models.Model):
    """External credential — diploma, certificate, license — that a teacher uploads to their profile."""
    teacher = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='credentials')
    title = models.CharField(max_length=200)
    issuer = models.CharField(max_length=200, blank=True, default='')
    issued_year = models.PositiveIntegerField(null=True, blank=True)
    file = models.FileField(upload_to='credentials/', null=True, blank=True)
    note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-issued_year', '-created_at']

    def __str__(self):
        return self.title
