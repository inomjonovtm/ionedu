from django.urls import path
from .views import (
    TestDetailView, TestWriteView, TestEditView,
    QuestionViewSet, QuestionEditView,
    start_attempt, save_attempt, submit_attempt, AttemptResultView, my_attempts,
    StandaloneTestListView, MyTestsView,
    duplicate_test, bulk_questions, reorder_questions, question_image, test_stats,
)

urlpatterns = [
    path('tests/', TestWriteView.as_view()),
    path('tests/standalone/', StandaloneTestListView.as_view()),
    path('tests/mine/', MyTestsView.as_view()),
    path('tests/<int:pk>/', TestEditView.as_view()),
    path('tests/<int:pk>/detail/', TestDetailView.as_view()),
    path('tests/<int:pk>/duplicate/', duplicate_test),
    path('tests/<int:pk>/stats/', test_stats),
    path('tests/<int:test_id>/start/', start_attempt),
    path('tests/<int:test_id>/questions/', QuestionViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('tests/<int:test_id>/questions/bulk/', bulk_questions),
    path('tests/<int:test_id>/questions/reorder/', reorder_questions),
    path('questions/<int:pk>/', QuestionEditView.as_view()),
    path('questions/<int:pk>/image/', question_image),
    path('attempts/mine/', my_attempts),
    path('attempts/<int:attempt_id>/save/', save_attempt),
    path('attempts/<int:attempt_id>/submit/', submit_attempt),
    path('attempts/<int:pk>/result/', AttemptResultView.as_view()),
]
