import uuid
from django.conf import settings
from django.db import models


class Certificate(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='certificates')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='certificates')
    unique_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    issued_at = models.DateTimeField(auto_now_add=True)
    pdf_file = models.FileField(upload_to='certificates/', null=True, blank=True)
    score_percent = models.FloatField(default=0)

    class Meta:
        unique_together = ('student', 'course')
        ordering = ['-issued_at']

    @property
    def short_id(self):
        return f'IND-{self.issued_at.year}-{str(self.unique_id)[:6].upper()}' if self.issued_at else str(self.unique_id)[:8]

    def __str__(self):
        return f'{self.student.email} – {self.course.title}'
