import re
import uuid as _uuid

from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.courses.models import Course, Enrollment
from .models import Certificate
from .serializers import CertificateSerializer
from .utils import issue_certificate


class MyCertificatesView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Certificate.objects.filter(student=self.request.user).select_related('course__teacher')


class CertificatePublicView(generics.RetrieveAPIView):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'unique_id'


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate(request, course_slug):
    course = get_object_or_404(Course, slug=course_slug)
    enrollment = Enrollment.objects.filter(student=request.user, course=course).first()
    if not enrollment or enrollment.progress_percent < 100:
        return Response({'detail': 'Kursni 100% tugatish kerak'}, status=400)
    cert, _ = issue_certificate(request.user, course, score_percent=enrollment.progress_percent)
    return Response(CertificateSerializer(cert).data, status=201)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def verify_certificate(request):
    """
    Public lookup that accepts EITHER:
      - full UUID (`unique_id`)
      - short_id format `IND-YYYY-XXXXXX` (year + first-6-of-uuid, case-insensitive)
      - bare 6-char hex prefix
    """
    raw = (request.query_params.get('id') or '').strip()
    if not raw:
        return Response({'detail': 'ID kerak'}, status=400)

    # Try as full UUID first
    try:
        u = _uuid.UUID(raw)
        cert = Certificate.objects.filter(unique_id=u).first()
        if cert:
            return Response(CertificateSerializer(cert, context={'request': request}).data)
    except (ValueError, AttributeError):
        pass

    # Try short_id format: IND-2026-ABC123  →  extract last 6 hex chars
    m = re.search(r'([0-9A-Fa-f]{6,8})\s*$', raw)
    if m:
        prefix = m.group(1).lower()[:6]
        # Find certs whose UUID starts with this prefix
        for cert in Certificate.objects.all().select_related('student', 'course__teacher'):
            if str(cert.unique_id).replace('-', '').lower().startswith(prefix):
                return Response(CertificateSerializer(cert, context={'request': request}).data)

    return Response({'detail': 'Sertifikat topilmadi'}, status=404)
