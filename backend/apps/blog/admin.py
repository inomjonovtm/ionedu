from django.contrib import admin
from .models import BlogPost, BlogComment


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'author', 'status', 'is_featured', 'views', 'published_at')
    list_filter = ('status', 'is_featured', 'category')
    search_fields = ('title', 'excerpt', 'body')
    prepopulated_fields = {'slug': ('title',)}


@admin.register(BlogComment)
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'post', 'short', 'created_at')
    search_fields = ('content',)

    def short(self, obj):
        return obj.content[:60]
    short.short_description = 'Content'
