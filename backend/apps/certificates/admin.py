from django.contrib import admin
from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'short_id', 'issued_at', 'score_percent')
    search_fields = ('student__email', 'course__title')
    readonly_fields = ('unique_id', 'issued_at')
