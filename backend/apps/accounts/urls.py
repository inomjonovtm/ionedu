from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, logout_view, MeView,
    password_reset, password_reset_confirm, change_password,
    google_auth,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('google/', google_auth, name='google-auth'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', logout_view, name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('me/update/', MeView.as_view(), name='me-update'),
    path('password-reset/', password_reset, name='password-reset'),
    path('password-reset/confirm/', password_reset_confirm, name='password-reset-confirm'),
    path('change-password/', change_password, name='change-password'),
]
