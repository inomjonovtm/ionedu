from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class BlogPost(models.Model):
    STATUS_CHOICES = (('draft', 'Draft'), ('published', 'Published'))
    COVER_COLORS = (
        ('blue', 'blue'), ('green', 'green'), ('amber', 'amber'),
        ('rose', 'rose'), ('teal', 'teal'), ('violet', 'violet'), ('slate', 'slate'),
    )

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    excerpt = models.CharField(max_length=300, blank=True, default='')
    body = models.TextField(blank=True, default='')  # sanitized HTML from the rich-text editor
    cover = models.ImageField(upload_to='blog/', null=True, blank=True)
    cover_emoji = models.CharField(max_length=10, default='📝')
    cover_color = models.CharField(max_length=10, choices=COVER_COLORS, default='green')
    category = models.CharField(max_length=60, blank=True, default='Umumiy')

    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                               null=True, blank=True, related_name='blog_posts')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(default=False)
    read_minutes = models.PositiveSmallIntegerField(default=3)
    views = models.PositiveIntegerField(default=0)

    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_featured', '-published_at', '-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title) or 'post'
            slug = base
            i = 1
            while BlogPost.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                i += 1
                slug = f'{base}-{i}'
            self.slug = slug
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        if self.status == 'draft':
            self.published_at = None
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    @property
    def comment_count(self):
        return self.comments.count()


class BlogComment(models.Model):
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='blog_comments')
    content = models.TextField(max_length=1500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.author} on {self.post_id}'
