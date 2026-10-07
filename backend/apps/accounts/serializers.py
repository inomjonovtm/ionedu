from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import normalize_phone, TeamMember

User = get_user_model()


class UserMiniSerializer(serializers.ModelSerializer):
    initials = serializers.CharField(read_only=True)
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'phone', 'email', 'username', 'full_name', 'display_name', 'initials', 'avatar', 'role']


class UserSerializer(serializers.ModelSerializer):
    initials = serializers.CharField(read_only=True)
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'phone', 'email', 'username', 'full_name', 'display_name', 'initials', 'avatar',
                  'role', 'is_active', 'is_verified', 'bio', 'city',
                  'birth_year', 'region', 'district', 'school',
                  'specialty', 'experience_years', 'education',
                  'date_joined']
        read_only_fields = ['id', 'date_joined', 'is_verified', 'username']


class AdminUserSerializer(UserSerializer):
    """Full-power serializer for the admin panel — every profile field is
    editable (including is_verified / is_active / role), and an optional
    write-only `password` field lets an admin set a new password."""
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['password']
        read_only_fields = ['id', 'date_joined', 'username']

    def validate_phone(self, v):
        if not v:
            return None
        v = normalize_phone(v)
        qs = User.objects.filter(phone=v)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Bu telefon raqami band')
        return v

    def validate_email(self, v):
        if not v:
            return None
        v = v.strip().lower()
        qs = User.objects.filter(email=v)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Bu email band')
        return v

    def update(self, instance, validated):
        password = validated.pop('password', None)
        user = super().update(instance, validated)
        if password:
            user.set_password(password)
            user.save(update_fields=['password'])
        return user


class TeacherSerializer(UserSerializer):
    """Public teacher card/profile — includes aggregate stats annotated by the view."""
    course_count = serializers.SerializerMethodField()
    students_count = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['course_count', 'students_count', 'review_count', 'avg_rating']

    def get_course_count(self, obj):
        return getattr(obj, 'course_count', 0) or 0

    def get_students_count(self, obj):
        return getattr(obj, 'students_count', 0) or 0

    def get_review_count(self, obj):
        return getattr(obj, 'review_count', 0) or 0

    def get_avg_rating(self, obj):
        v = getattr(obj, 'avg_rating', None)
        return round(v, 1) if v else 0


class TeamMemberSerializer(serializers.ModelSerializer):
    initials = serializers.CharField(read_only=True)

    class Meta:
        model = TeamMember
        fields = ['id', 'full_name', 'position', 'bio', 'photo', 'telegram', 'linkedin',
                  'order', 'is_active', 'initials', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField()
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ['email', 'phone', 'password', 'full_name', 'role',
                  'birth_year', 'region', 'district', 'school',
                  'specialty', 'experience_years', 'education', 'bio']
        extra_kwargs = {
            'birth_year': {'required': False, 'allow_null': True},
            'region': {'required': False, 'allow_blank': True},
            'district': {'required': False, 'allow_blank': True},
            'school': {'required': False, 'allow_blank': True},
            'specialty': {'required': False, 'allow_blank': True},
            'experience_years': {'required': False, 'allow_null': True},
            'education': {'required': False, 'allow_blank': True},
            'bio': {'required': False, 'allow_blank': True},
        }

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Bu email allaqachon ro'yxatdan o'tgan")
        return value

    def validate_phone(self, value):
        if not value:
            return None
        norm = normalize_phone(value)
        if User.objects.filter(phone=norm).exists():
            raise serializers.ValidationError("Bu telefon raqam allaqachon ro'yxatdan o'tgan")
        return norm

    def validate_role(self, value):
        if value not in ('student', 'teacher'):
            raise serializers.ValidationError("Role student yoki teacher bo'lishi kerak")
        return value

    def create(self, validated):
        validated.setdefault('role', 'student')
        password = validated.pop('password')
        validated['username'] = validated['email']
        user = User(**validated)
        user.set_password(password)
        user.save()
        return user


class EmailTokenObtainPairSerializer(serializers.Serializer):
    """Login by email + password (legacy phone logins still resolve)."""
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from rest_framework_simplejwt.tokens import RefreshToken

        identifier = attrs['email'].strip()
        if '@' in identifier:
            user = User.objects.filter(email__iexact=identifier).first()
        else:
            user = User.objects.filter(phone=normalize_phone(identifier)).first()

        if not user or not user.check_password(attrs['password']):
            raise serializers.ValidationError({'detail': "Email yoki parol noto'g'ri"})
        if not user.is_active:
            raise serializers.ValidationError({'detail': 'Akkaunt bloklangan'})

        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user, context=self.context).data,
        }


# Keep alias so any existing imports still resolve
PhoneTokenObtainPairSerializer = EmailTokenObtainPairSerializer


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()


from .models import SiteSettings, ContactMessage


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = ['site_name', 'contact_email', 'contact_phone', 'address',
                  'telegram_url', 'instagram_url', 'youtube_url', 'facebook_url',
                  'about_text', 'updated_at']
        read_only_fields = ['updated_at']


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'created_at', 'is_read']
        read_only_fields = ['id', 'created_at', 'is_read']


from .models import TeacherCredential


class TeacherCredentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherCredential
        fields = ['id', 'teacher', 'title', 'issuer', 'issued_year', 'file', 'note', 'created_at']
        read_only_fields = ['id', 'teacher', 'created_at']
