from django.contrib import admin
from .models import Post, PostComment


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'short', 'is_official', 'is_pinned', 'created_at')
    list_filter = ('is_official', 'is_pinned', 'created_at')
    search_fields = ('content', 'author__full_name', 'author__email')

    def short(self, obj):
        return obj.content[:60]
    short.short_description = 'Content'


@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'post', 'short', 'created_at')
    search_fields = ('content',)

    def short(self, obj):
        return obj.content[:60]
    short.short_description = 'Content'
