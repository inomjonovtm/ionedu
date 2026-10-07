from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import BlogViewSet, upload_image

router = DefaultRouter()
router.register('posts', BlogViewSet, basename='blogpost')

urlpatterns = [
    path('upload-image/', upload_image),
    *router.urls,
]
