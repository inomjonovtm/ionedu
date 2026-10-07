from django.core.files.storage import default_storage
from django.db.models import F
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from apps.accounts.permissions import IsTeacher
from .models import BlogPost
from .serializers import BlogListSerializer, BlogDetailSerializer, BlogCommentSerializer


class BlogViewSet(viewsets.ModelViewSet):
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'excerpt', 'body', 'category']
    filterset_fields = ['category']

    def _is_staff(self):
        u = self.request.user
        return u.is_authenticated and (u.role in ('admin', 'teacher') or u.is_superuser)

    def get_serializer_class(self):
        return BlogListSerializer if self.action == 'list' else BlogDetailSerializer

    def get_queryset(self):
        qs = BlogPost.objects.select_related('author')
        manage = self.request.query_params.get('manage') == '1'
        # The management view (admin/teacher panel) sees drafts too; the public never does.
        if self.action == 'list' and not (manage and self._is_staff()):
            qs = qs.filter(status='published')
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'comments'):
            return [permissions.AllowAny()]   # comments POST checks auth in the handler
        if self.action == 'delete_comment':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsTeacher()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != 'published' and not self._is_staff():
            raise PermissionDenied('Bu maqola hali chop etilmagan')
        # Count a view for published posts (skip staff to keep numbers honest).
        if instance.status == 'published' and not self._is_staff():
            BlogPost.objects.filter(pk=instance.pk).update(views=F('views') + 1)
            instance.views += 1
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.AllowAny])
    def comments(self, request, slug=None):
        post = self.get_object()
        if request.method == 'GET':
            qs = post.comments.select_related('author')
            return Response(BlogCommentSerializer(qs, many=True, context={'request': request}).data)
        if not request.user.is_authenticated:
            return Response({'detail': 'Izoh qoldirish uchun tizimga kiring'}, status=401)
        ser = BlogCommentSerializer(data=request.data, context={'request': request})
        ser.is_valid(raise_exception=True)
        ser.save(author=request.user, post=post)
        return Response(ser.data, status=201)

    @action(detail=True, methods=['delete'], url_path='comments/(?P<comment_id>[0-9]+)',
            permission_classes=[permissions.IsAuthenticated])
    def delete_comment(self, request, slug=None, comment_id=None):
        post = self.get_object()
        try:
            c = post.comments.get(pk=comment_id)
        except post.comments.model.DoesNotExist:
            return Response({'detail': 'Topilmadi'}, status=404)
        u = request.user
        if not (c.author_id == u.pk or u.role == 'admin' or u.is_superuser):
            return Response({'detail': 'Ruxsat yo‘q'}, status=403)
        c.delete()
        return Response(status=204)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsTeacher])
@parser_classes([MultiPartParser, FormParser])
def upload_image(request):
    """Inline image upload for the blog rich-text editor.

    Accepts one or more files under the `image` field and returns their
    absolute URLs so several pictures can be dropped into one article.
    """
    files = request.FILES.getlist('image') or ([request.FILES['image']] if 'image' in request.FILES else [])
    if not files:
        return Response({'detail': 'Rasm topilmadi'}, status=400)
    urls = []
    for f in files:
        if f.size > 12 * 1024 * 1024:
            return Response({'detail': f'{f.name} 12MB dan katta'}, status=400)
        path = default_storage.save(f'blog/inline/{f.name}', f)
        urls.append(request.build_absolute_uri(default_storage.url(path)))
    return Response({'urls': urls, 'url': urls[0]})
