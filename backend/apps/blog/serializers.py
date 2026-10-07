from rest_framework import serializers

from apps.accounts.serializers import UserMiniSerializer
from .models import BlogPost, BlogComment


class BlogCommentSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)

    class Meta:
        model = BlogComment
        fields = ['id', 'content', 'author', 'created_at']
        read_only_fields = ['author', 'created_at']


class BlogListSerializer(serializers.ModelSerializer):
    """Lightweight payload for cards/lists — no heavy `body`."""
    author = UserMiniSerializer(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = BlogPost
        fields = ['id', 'title', 'slug', 'excerpt', 'cover', 'cover_emoji', 'cover_color',
                  'category', 'author', 'status', 'is_featured', 'read_minutes', 'views',
                  'comment_count', 'published_at', 'created_at']


class BlogDetailSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = BlogPost
        fields = ['id', 'title', 'slug', 'excerpt', 'body', 'cover', 'cover_emoji',
                  'cover_color', 'category', 'author', 'status', 'is_featured',
                  'read_minutes', 'views', 'comment_count', 'published_at', 'created_at', 'updated_at']
        read_only_fields = ['slug', 'author', 'views', 'published_at', 'created_at', 'updated_at']
