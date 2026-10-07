from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeacherViewSet, AdminUserViewSet, set_user_role, admin_stats, search_view,
    site_settings_view, contact_submit, public_stats, admin_analytics,
    AdminReviewsView, admin_review_delete, AdminCertificatesView,
    admin_user_detail, admin_user_set_status, message_teacher,
    teacher_students, teacher_reviews,
    AdminContactMessagesView, admin_contact_mark_read,
    admin_user_filter_options,
    teacher_credentials_self, teacher_credentials_public, delete_credential,
    team_public, AdminTeamViewSet,
)

teachers_router = DefaultRouter()
teachers_router.register(r'teachers', TeacherViewSet, basename='teacher')

admin_router = DefaultRouter()
admin_router.register(r'users', AdminUserViewSet, basename='admin-user')
admin_router.register(r'team', AdminTeamViewSet, basename='admin-team')

urlpatterns = [
    path('', include(teachers_router.urls)),
    path('admin/', include(admin_router.urls)),
    path('admin/users/<int:user_id>/role/', set_user_role),
    path('admin/users/<int:pk>/detail/', admin_user_detail),
    path('admin/users/<int:pk>/status/', admin_user_set_status),
    path('admin/users-filter-options/', admin_user_filter_options),
    path('admin/stats/', admin_stats),
    path('admin/analytics/', admin_analytics),
    path('stats/', public_stats),
    path('team/', team_public),
    path('teachers/<int:teacher_id>/message/', message_teacher),
    path('admin/settings/', site_settings_view),
    path('admin/certificates/', AdminCertificatesView.as_view()),
    path('admin/reviews/', AdminReviewsView.as_view()),
    path('admin/reviews/<int:pk>/', admin_review_delete),
    path('teacher/students/', teacher_students),
    path('teacher/reviews/', teacher_reviews),
    path('teacher/credentials/', teacher_credentials_self),
    path('teacher/credentials/<int:pk>/', delete_credential),
    path('teachers/<int:teacher_id>/credentials/', teacher_credentials_public),
    path('search/', search_view),
    path('contact/', contact_submit),
    path('admin/contact-messages/', AdminContactMessagesView.as_view()),
    path('admin/contact-messages/<int:pk>/read/', admin_contact_mark_read),
]
