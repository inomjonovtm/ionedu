from django.urls import path
from .views import (
    TestDetailView, TestWriteView, TestEditView,
    QuestionViewSet, QuestionEditView,
    start_attempt, submit_attempt, AttemptResultView, my_attempts,
    StandaloneTestListView, MyTestsView,
)

urlpatterns = [
    path('tests/', TestWriteView.as_view()),
    path('tests/standalone/', StandaloneTestListView.as_view()),
    path('tests/mine/', MyTestsView.as_view()),
    path('tests/<int:pk>/', TestEditView.as_view()),
    path('tests/<int:pk>/detail/', TestDetailView.as_view()),
    path('tests/<int:test_id>/start/', start_attempt),
    path('tests/<int:test_id>/questions/', QuestionViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('questions/<int:pk>/', QuestionEditView.as_view()),
    path('attempts/<int:attempt_id>/submit/', submit_attempt),
    path('attempts/<int:pk>/result/', AttemptResultView.as_view()),
    path('attempts/mine/', my_attempts),
]
