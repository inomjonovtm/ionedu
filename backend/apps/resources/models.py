from django.conf import settings
from django.db import models


class Resource(models.Model):
    TYPE_CHOICES = (
        ('pdf', 'PDF'),
        ('video', 'Video'),
        ('map', 'Map / Atlas'),
        ('doc', 'Document'),
        ('link', 'External Link'),
    )
    GRADE_CHOICES = (
        ('5-6', '5–6 sinf'),
        ('7-8', '7–8 sinf'),
        ('9-10', '9–10 sinf'),
        ('11', '11-sinf'),
        ('all', 'Barchasi'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='resources/', null=True, blank=True)
    external_url = models.URLField(blank=True)
    resource_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='pdf')
    grade_level = models.CharField(max_length=10, choices=GRADE_CHOICES, default='all')
    category = models.ForeignKey('courses.Category', on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    download_count = models.PositiveIntegerField(default=0)
    file_size_mb = models.FloatField(default=0)
    page_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
