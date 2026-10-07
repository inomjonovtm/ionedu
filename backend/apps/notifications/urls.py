from django.urls import path
from .views import ListView, read_all, read_one, unread_count

urlpatterns = [
    path('', ListView.as_view()),
    path('read-all/', read_all),
    path('<int:pk>/read/', read_one),
    path('unread-count/', unread_count),
]
