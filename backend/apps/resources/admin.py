from django.contrib import admin
from .models import Resource


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'resource_type', 'grade_level', 'uploaded_by', 'download_count', 'created_at')
    list_filter = ('resource_type', 'grade_level')
    search_fields = ('title', 'description')
