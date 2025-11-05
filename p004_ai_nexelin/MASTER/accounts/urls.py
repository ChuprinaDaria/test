from django.urls import path
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import TokenRefreshView
from . import views


urlpatterns = [
    path('login/', RedirectView.as_view(url='/admin/login/', permanent=False), name='login-redirect'),
    path('health/', views.health, name='accounts-health'),
    path('me/', views.AuthMeView.as_view(), name='auth-me'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]

