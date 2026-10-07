from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('teacher', 'admin'))


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'admin' or request.user.is_superuser))


class IsOwnerOrAdmin(BasePermission):
    """Object-level: object must have `teacher`, `student`, `uploaded_by`, or `user` attr matching request.user."""

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin' or request.user.is_superuser:
            return True
        for attr in ('teacher', 'student', 'uploaded_by', 'user', 'owner'):
            if hasattr(obj, attr) and getattr(obj, attr) == request.user:
                return True
        return False


class ReadOnlyOrOwnerOrAdmin(IsOwnerOrAdmin):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return super().has_object_permission(request, view, obj)
