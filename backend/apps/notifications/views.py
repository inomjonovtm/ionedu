from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class ListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)[:80]


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def read_all(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'detail': 'OK'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def read_one(request, pk):
    Notification.objects.filter(pk=pk, user=request.user).update(is_read=True)
    return Response({'detail': 'OK'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_count(request):
    n = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({'count': n})
