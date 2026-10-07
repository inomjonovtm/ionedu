from django.urls import path
from .views import MyCertificatesView, CertificatePublicView, generate, verify_certificate

urlpatterns = [
    path('mine/', MyCertificatesView.as_view()),
    path('generate/<slug:course_slug>/', generate),
    path('verify/', verify_certificate),                           # ?id=IND-2026-XXXXXX or full UUID
    path('<uuid:unique_id>/', CertificatePublicView.as_view()),    # full UUID only
]
