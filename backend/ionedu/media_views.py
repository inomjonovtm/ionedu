"""
Range-aware media file server (dev only).

Django's default `django.views.static.serve` doesn't reliably handle HTTP Range
requests, so videos can't be seeked in <video> players. This view streams the
requested byte range so HTML5 players (and YouTube-style scrubbers) work.

In production: serve /media/ from nginx / S3 instead — never from Django.
"""
import os
import re
import mimetypes

from django.conf import settings
from django.http import StreamingHttpResponse, Http404
from django.utils.http import http_date


def _safe_media_path(rel_path: str) -> str:
    """Prevent ../ traversal — return absolute path inside MEDIA_ROOT or raise 404."""
    media_root = os.path.abspath(settings.MEDIA_ROOT)
    full = os.path.abspath(os.path.join(media_root, rel_path.lstrip('/\\')))
    if not full.startswith(media_root + os.sep) and full != media_root:
        raise Http404()
    if not os.path.isfile(full):
        raise Http404()
    return full


def _stream(path: str, start: int = 0, length=None, chunk_size: int = 64 * 1024):
    with open(path, 'rb') as f:
        f.seek(start)
        remaining = length
        while True:
            read = chunk_size if remaining is None else min(chunk_size, remaining)
            if remaining is not None and remaining <= 0:
                break
            data = f.read(read)
            if not data:
                break
            if remaining is not None:
                remaining -= len(data)
            yield data


def media_serve(request, path):
    full = _safe_media_path(path)
    size = os.path.getsize(full)
    ctype, _enc = mimetypes.guess_type(full)
    ctype = ctype or 'application/octet-stream'

    range_header = request.META.get('HTTP_RANGE', '')
    m = re.match(r'^\s*bytes=(\d+)-(\d*)\s*$', range_header)
    if m:
        start = int(m.group(1))
        end = int(m.group(2)) if m.group(2) else size - 1
        end = min(end, size - 1)
        if start > end:
            # Invalid range
            resp = StreamingHttpResponse(status=416)
            resp['Content-Range'] = f'bytes */{size}'
            return resp
        length = end - start + 1
        resp = StreamingHttpResponse(_stream(full, start, length), status=206, content_type=ctype)
        resp['Content-Range'] = f'bytes {start}-{end}/{size}'
        resp['Content-Length'] = str(length)
        resp['Accept-Ranges'] = 'bytes'
        resp['Last-Modified'] = http_date(os.path.getmtime(full))
        return resp

    # No range — full body, still streamed and advertise Accept-Ranges so the
    # browser knows it can issue Range requests next time.
    resp = StreamingHttpResponse(_stream(full), content_type=ctype)
    resp['Content-Length'] = str(size)
    resp['Accept-Ranges'] = 'bytes'
    resp['Last-Modified'] = http_date(os.path.getmtime(full))
    return resp
