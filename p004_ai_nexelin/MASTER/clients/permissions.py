from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and (user.is_superuser or getattr(user, 'is_staff_user', False)))


class IsClientOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or getattr(user, 'is_staff_user', False):
            return True
        # Client can access own objects
        owner = getattr(obj, 'user', None) or getattr(getattr(obj, 'client', None), 'user', None)
        return owner == user

