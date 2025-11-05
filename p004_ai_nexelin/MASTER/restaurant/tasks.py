from __future__ import annotations

from celery import shared_task
from typing import List

from MASTER.restaurant.models import MenuItem, MenuItemEmbedding
from MASTER.EmbeddingModel.models import EmbeddingModel
from MASTER.processing.embedding_service import EmbeddingService


@shared_task(bind=True, max_retries=3)
def process_menu_item_embedding(self, menu_item_id: int):
    """Create or update embedding for a MenuItem asynchronously."""
    try:
        item = MenuItem.objects.select_related('client', 'category').get(id=menu_item_id)
        client = item.client
        # Пріоритет: client.embedding_model > specialization.get_embedding_model() > default
        embedding_model = getattr(client, 'embedding_model', None)
        if not embedding_model and client and client.specialization:
            embedding_model = client.specialization.get_embedding_model()
        if not embedding_model:
            embedding_model = EmbeddingModel.objects.filter(is_default=True, is_active=True).first()
        if not embedding_model:
            embedding_model = EmbeddingModel.objects.filter(is_active=True).first()
        if not embedding_model:
            return {'status': 'skipped', 'reason': 'no_embedding_model'}

        parts: List[str] = []
        parts.append(item.name or "")
        parts.append(item.description or "")
        if item.ingredients:
            parts.append(item.ingredients)
        if item.wine_pairing:
            parts.append(item.wine_pairing)
        if item.allergens:
            parts.append(", ".join(item.allergens))
        if item.dietary_labels:
            parts.append(", ".join(item.dietary_labels))
        if item.category and item.category.name:
            parts.append(item.category.name)
        content = "\n".join([p for p in parts if p])
        if not content.strip():
            return {'status': 'skipped', 'reason': 'empty_content'}

        result = EmbeddingService.create_embedding(content, embedding_model)
        vector = result.get('vector') or []

        mie, _ = MenuItemEmbedding.objects.get_or_create(
            menu_item=item,
            embedding_model=embedding_model,
            language='uk',
            defaults={'content': content}
        )
        mie.content = content
        mie.vector = vector
        mie.save()

        return {'status': 'ok', 'menu_item_id': int(menu_item_id)}

    except Exception as e:  # noqa: BLE001
        raise self.retry(exc=e, countdown=30)


