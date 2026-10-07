from django.contrib.auth import get_user_model
from django.db.models import Count, Avg, F
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.accounts.serializers import UserMiniSerializer
from apps.certificates.models import Certificate
from apps.courses.models import Course, Enrollment
from apps.tests.models import TestAttempt

User = get_user_model()


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def students_leaderboard(request):
    qs = (User.objects.filter(role='student')
          .annotate(
              certs=Count('certificates', distinct=True),
              completed=Count('enrollments', filter=F('enrollments__completed'), distinct=True),
              avg_score=Avg('test_attempts__score_percent'),
          )
          .order_by('-certs', '-completed'))[:50]

    data = []
    for i, u in enumerate(qs, start=1):
        score = int((u.certs or 0) * 500 + (u.completed or 0) * 200 + (u.avg_score or 0))
        data.append({
            **UserMiniSerializer(u).data,
            'rank': i,
            'certificates_count': u.certs or 0,
            'completed_count': u.completed or 0,
            'avg_score': round(u.avg_score or 0, 1),
            'score': score,
            'city': u.city,
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def teachers_leaderboard(request):
    qs = (User.objects.filter(role='teacher')
          .annotate(
              course_count=Count('courses_taught', distinct=True),
              avg_rating=Avg('courses_taught__reviews__rating'),
              students_count=Count('courses_taught__enrollments', distinct=True),
          )
          .order_by('-avg_rating', '-students_count'))[:50]

    data = []
    for i, u in enumerate(qs, start=1):
        data.append({
            **UserMiniSerializer(u).data,
            'rank': i,
            'course_count': u.course_count or 0,
            'avg_rating': round(u.avg_rating or 0, 1),
            'students_count': u.students_count or 0,
            'city': u.city,
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def courses_leaderboard(request):
    from apps.courses.serializers import CourseListSerializer
    qs = (Course.objects.filter(status='published')
          .annotate(students_n=Count('enrollments', distinct=True),
                    rating=Avg('reviews__rating'))
          .order_by('-rating', '-students_n'))[:30]
    return Response(CourseListSerializer(qs, many=True, context={'request': request}).data)
