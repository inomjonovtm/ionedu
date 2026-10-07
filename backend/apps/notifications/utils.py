def notify(user, kind, message, link=''):
    from .models import Notification
    if not user or not getattr(user, 'is_authenticated', False):
        return None
    return Notification.objects.create(user=user, kind=kind, message=message, link=link)
