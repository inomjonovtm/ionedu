from django.conf import settings
from django.db import models


class Notification(models.Model):
    KIND_CHOICES = (
        ('enrollment', 'Enrollment'),
        ('course_approved', 'Course Approved'),
        ('course_rejected', 'Course Rejected'),
        ('test_passed', 'Test Passed'),
        ('certificate', 'Certificate'),
        ('review', 'Review'),
        ('system', 'System'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    kind = models.CharField(max_length=30, choices=KIND_CHOICES, default='system')
    message = models.CharField(max_length=400)
    link = models.CharField(max_length=400, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email}: {self.message[:40]}'
