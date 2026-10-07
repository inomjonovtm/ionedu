from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from apps.accounts.permissions import IsTeacher, IsAdmin, IsOwnerOrAdmin
from .models import Resource
from .serializers import ResourceSerializer


class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.select_related('uploaded_by', 'category')
    serializer_class = ResourceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    filterset_fields = ['resource_type', 'grade_level', 'category']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'increment_download'):
            return [permissions.AllowAny()]
        if self.action == 'destroy':
            return [IsAdmin()]
        if self.action in ('update', 'partial_update'):
            # Owner (the teacher who uploaded it) or any admin may edit.
            return [permissions.IsAuthenticated(), IsTeacher(), IsOwnerOrAdmin()]
        return [permissions.IsAuthenticated(), IsTeacher()]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def increment_download(self, request, pk=None):
        res = self.get_object()
        res.download_count += 1
        res.save(update_fields=['download_count'])
        return Response({'count': res.download_count})
