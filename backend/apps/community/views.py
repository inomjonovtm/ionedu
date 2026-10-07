from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from apps.accounts.permissions import IsOwnerOrAdmin
from .models import Post
from .serializers import PostSerializer, PostCommentSerializer


def _truthy(v):
    return str(v).lower() in ('1', 'true', 'on', 'yes')


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['content', 'author__full_name']

    def get_queryset(self):
        # like_count / comment_count come from model properties (the serializer
        # reads them directly); prefetch keeps the per-post counts cheap.
        qs = (Post.objects.select_related('author')
              .prefetch_related('likes', 'comments'))
        params = self.request.query_params

        flt = params.get('filter')
        if flt == 'official':
            qs = qs.filter(is_official=True)
        elif flt == 'mine' and self.request.user.is_authenticated:
            qs = qs.filter(author=self.request.user)

        if params.get('sort') == 'popular':
            # `pop` is annotation-only (no clashing model property) so ordering
            # by it is safe.
            from django.db.models import Count
            qs = qs.annotate(pop=Count('likes', distinct=True)).order_by('-is_pinned', '-pop', '-created_at')
        return qs

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'comments'):
            return [permissions.AllowAny()]
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        u = self.request.user
        is_admin = u.role == 'admin' or u.is_superuser
        # "IonEdu nomidan" (official) posts are reserved for admins.
        is_official = is_admin and _truthy(self.request.data.get('is_official', ''))
        is_pinned = is_admin and _truthy(self.request.data.get('is_pinned', ''))
        serializer.save(author=u, is_official=is_official, is_pinned=is_pinned)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        u = request.user
        if post.likes.filter(pk=u.pk).exists():
            post.likes.remove(u)
            liked = False
        else:
            post.likes.add(u)
            liked = True
        return Response({'liked': liked, 'like_count': post.likes.count()})

    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        post = self.get_object()
        if request.method == 'GET':
            qs = post.comments.select_related('author')
            data = PostCommentSerializer(qs, many=True, context={'request': request}).data
            return Response(data)
        if not request.user.is_authenticated:
            return Response({'detail': 'Tizimga kiring'}, status=401)
        ser = PostCommentSerializer(data=request.data, context={'request': request})
        ser.is_valid(raise_exception=True)
        ser.save(author=request.user, post=post)
        return Response(ser.data, status=201)
