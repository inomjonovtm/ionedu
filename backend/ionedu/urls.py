from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings

from .media_views import media_serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.courses.urls')),
    path('api/', include('apps.tests.urls')),
    path('api/resources/', include('apps.resources.urls')),
    path('api/certificates/', include('apps.certificates.urls')),
    path('api/ratings/', include('apps.ratings.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/community/', include('apps.community.urls')),
    path('api/blog/', include('apps.blog.urls')),
    path('api/', include('apps.accounts.misc_urls')),
]

# Range-aware media serve (videos can be seeked). Works in dev and as a
# fallback in production — put Nginx/CDN in front of /media/ when possible.
media_url = settings.MEDIA_URL.lstrip('/').rstrip('/')
urlpatterns += [
    re_path(rf'^{media_url}/(?P<path>.*)$', media_serve, name='media-serve'),
]
