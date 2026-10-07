from rest_framework import serializers
from apps.accounts.serializers import UserMiniSerializer
from .models import Certificate


class CertificateSerializer(serializers.ModelSerializer):
    student = UserMiniSerializer(read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_slug = serializers.CharField(source='course.slug', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    short_id = serializers.CharField(read_only=True)

    class Meta:
        model = Certificate
        fields = ['id', 'unique_id', 'short_id', 'student', 'course_title', 'course_slug',
                  'teacher_name', 'issued_at', 'pdf_file', 'score_percent']

    def get_teacher_name(self, obj):
        return obj.course.teacher.display_name if obj.course.teacher else ''
