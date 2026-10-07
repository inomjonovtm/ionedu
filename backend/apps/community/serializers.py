from rest_framework import serializers

from apps.accounts.serializers import UserMiniSerializer
from .models import Post, PostComment


class PostCommentSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)

    class Meta:
        model = PostComment
        fields = ['id', 'content', 'author', 'created_at']
        read_only_fields = ['author', 'created_at']


class PostSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    liked = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'content', 'image', 'link', 'is_official', 'is_pinned',
                  'author', 'like_count', 'comment_count', 'liked', 'can_delete', 'created_at']
        read_only_fields = ['author', 'is_official', 'is_pinned', 'created_at']

    def _user(self):
        request = self.context.get('request')
        return request.user if request else None

    def get_liked(self, obj):
        u = self._user()
        if not u or not u.is_authenticated:
            return False
        return obj.likes.filter(pk=u.pk).exists()

    def get_can_delete(self, obj):
        u = self._user()
        if not u or not u.is_authenticated:
            return False
        return obj.author_id == u.pk or u.role == 'admin' or u.is_superuser
