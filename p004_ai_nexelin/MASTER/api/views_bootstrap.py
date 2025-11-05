"""
Bootstrap API views for client provisioning.
"""
from django.shortcuts import get_object_or_404
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from MASTER.branches.models import Branch
from MASTER.specializations.models import Specialization
from MASTER.clients.models import Client, ClientAPIKey


class BootstrapProvisionView(APIView):
    """
    Create and provision a new client from branch, specialization, and client_token.
    
    This endpoint is responsible for:
    1. Creating branch if not exists
    2. Creating specialization if not exists
    3. Creating client if not exists
    4. Binding client_token to an API key for RAG
    
    URL: /api/rag/bootstrap/<branch_slug>/<specialization_slug>/<client_token>/
    Method: POST (idempotent)
    Response: {branch: {...}, specialization: {...}, client: {...}, api_key: {...}}
    """
    

    def get(self, request, branch_slug, specialization_slug, client_token):
        """
        Allow GET requests - redirect to POST logic.
        """
        return self.post(request, branch_slug, specialization_slug, client_token)
    
    def post(self, request, branch_slug, specialization_slug, client_token):
        # Валідація параметрів
        if not branch_slug or not specialization_slug or not client_token:
            return Response({
                'error': 'Invalid parameters. Required: branch_slug, specialization_slug, client_token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 1) Отримуємо або створюємо гілку
        branch, branch_created = Branch.objects.get_or_create(
            slug=branch_slug,
            defaults={
                'name': branch_slug.capitalize(),
                'description': f'Auto-created branch for {branch_slug}'
            }
        )
        
        # 2) Отримуємо або створюємо спеціалізацію
        specialization, spec_created = Specialization.objects.get_or_create(
            slug=specialization_slug,
            branch=branch,
            defaults={
                'name': specialization_slug.capitalize(),
                'description': f'Auto-created specialization for {specialization_slug}'
            }
        )
        
        # 3) Отримуємо або створюємо клієнта
        # Спочатку перевіряємо, чи існує користувач
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        username = f'client_{client_token}'
        user, user_created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': f'{username}@example.com',
                'is_active': True
            }
        )
        
        if user_created:
            # Встановлюємо випадковий пароль
            import uuid
            password = uuid.uuid4().hex
            user.set_password(password)
            user.save()
        
        # Створюємо або оновлюємо клієнта
        # Використовуємо tag як унікальний ідентифікатор
        client, client_created = Client.objects.get_or_create(
            tag=client_token,
            defaults={
                'user': username,
                'specialization': specialization,
                'description': f'Auto-created client via bootstrap',
                'features': {'bootstrap_token': client_token}
            }
        )
        
        # Якщо клієнт вже існує, оновлюємо його поля
        if not client_created:
            client.specialization = specialization
            if not client.features:
                client.features = {'bootstrap_token': client_token}
            elif 'bootstrap_token' not in client.features:
                client.features['bootstrap_token'] = client_token
            client.save()
        
        # Додаємо tag до відповіді
        client_tag = client.tag
        
        # 4) Прив'язуємо client_token до API key
        api_key_obj, _ = ClientAPIKey.objects.get_or_create(
            key=client_token,
            defaults={
                'client': client,
                'name': f'bootstrap:{client_token}',
                'is_active': True
            }
        )
        
        return Response({
            'branch': {
                'id': branch.id,
                'name': branch.name,
                'slug': branch.slug
            },
            'specialization': {
                'id': specialization.id,
                'name': specialization.name,
                'slug': specialization.slug,
                'branch_id': branch.id
            },
            'client': {
                'id': client.id,
                'user': client.user,  # CharField
                'tag': client.tag,
                'user_id': getattr(user, 'id', None),
                'username': getattr(user, 'username', ''),
                'email': getattr(user, 'email', ''),
                'specialization_id': specialization.id
            },
            'api_key': {
                'key': api_key_obj.key,
                'name': api_key_obj.name,
                'is_active': api_key_obj.is_active
            }
        }, status=status.HTTP_200_OK if not (branch_created or spec_created or client_created) else status.HTTP_201_CREATED)
