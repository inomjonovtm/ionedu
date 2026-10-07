from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, CourseViewSet, SectionViewSet, LessonViewSet,
    lesson_complete, pending_courses, approve_course, reject_course,
    SectionDetailView, LessonDetailView,
    LessonCommentsView, LessonMaterialsView, delete_comment, delete_material,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'courses', CourseViewSet, basename='course')

urlpatterns = [
    path('', include(router.urls)),
    path('courses/<slug:course_slug>/sections/', SectionViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('sections/<int:pk>/', SectionDetailView.as_view()),
    path('sections/<int:section_id>/lessons/', LessonViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('lessons/<int:pk>/', LessonDetailView.as_view()),
    path('lessons/<int:lesson_id>/complete/', lesson_complete),
    path('lessons/<int:lesson_id>/comments/', LessonCommentsView.as_view()),
    path('comments/<int:pk>/', delete_comment),
    path('lessons/<int:lesson_id>/materials/', LessonMaterialsView.as_view()),
    path('materials/<int:pk>/', delete_material),
    path('admin/courses/pending/', pending_courses),
    path('admin/courses/<slug:slug>/approve/', approve_course),
    path('admin/courses/<slug:slug>/reject/', reject_course),
]
