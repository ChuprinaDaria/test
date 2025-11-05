from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'restaurant'

router = DefaultRouter()
router.register(r'categories', views.MenuCategoryViewSet, basename='category')
router.register(r'menus', views.MenuViewSet, basename='menu')
router.register(r'menu-items', views.MenuItemViewSet, basename='menu-item')
router.register(r'tables', views.RestaurantTableViewSet, basename='table')

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', views.RestaurantChatViewSet.as_view({'post': 'chat'}), name='chat'),
    path('tts/', views.tts_demo, name='tts-demo'),
    path('stt/', views.stt_demo, name='stt-demo'),
    path('<str:client_slug>/table/<str:token>/', views.public_table_access, name='public-table'),
]

# Public API endpoints (access with API key)
public_patterns = [
    path('<str:client_slug>/menu/', views.MenuItemViewSet.as_view({'get': 'list'}), name='public-menu'),
    path('<str:client_slug>/menu/<int:pk>/', views.MenuItemViewSet.as_view({'get': 'retrieve'}), name='public-menu-item'),
    path('<str:client_slug>/menu/search/', views.MenuItemViewSet.as_view({'post': 'search'}), name='public-menu-search'),
    path('<str:client_slug>/chat/', views.RestaurantChatViewSet.as_view({'post': 'chat'}), name='public-chat'),
]
