from rest_framework import serializers
from apps.accounts.serializers import UserMiniSerializer
from .models import Resource


class ResourceSerializer(serializers.ModelSerializer):
    uploaded_by = UserMiniSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Resource
        fields = ['id', 'title', 'description', 'file', 'external_url', 'resource_type',
                  'grade_level', 'category', 'category_name', 'uploaded_by',
                  'download_count', 'file_size_mb', 'page_count', 'created_at']
        read_only_fields = ['uploaded_by', 'download_count', 'created_at']
