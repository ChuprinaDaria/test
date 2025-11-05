from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from MASTER.clients.models import Client
from MASTER.clients.views import get_client_from_request


# Create your views here.


def health(_request):
    return JsonResponse({"module": "accounts", "status": "ok"})


class AuthMeView(APIView):
    """
    API endpoint для отримання профілю поточного користувача або клієнта.
    GET /api/auth/me/
    
    Працює для:
    - Звичайних користувачів (повертає дані User)
    - Клієнтів через JWT токен (username=client_{id}, повертає дані Client)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Перевіряємо чи це клієнт (через helper функцію)
        client = get_client_from_request(request)
        
        if client:
            # Якщо це клієнт, повертаємо дані клієнта
            from MASTER.clients.serializers import ClientSerializer
            serializer = ClientSerializer(client, context={'request': request})
            return Response(serializer.data)
        else:
            # Якщо це звичайний користувач, повертаємо дані користувача
            user = request.user
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_staff': user.is_staff,
            })
