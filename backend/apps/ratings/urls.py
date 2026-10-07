from django.urls import path
from .views import students_leaderboard, teachers_leaderboard, courses_leaderboard

urlpatterns = [
    path('students/', students_leaderboard),
    path('teachers/', teachers_leaderboard),
    path('courses/', courses_leaderboard),
]
