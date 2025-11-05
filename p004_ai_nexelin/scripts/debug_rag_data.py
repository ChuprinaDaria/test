#!/usr/bin/env python
"""
Скрипт для діагностики RAG даних клієнта
"""
import os
import sys
import django

# Додаємо шлях до проекту
sys.path.append('/home/dchuprina/p004_ai_nexelin')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'MASTER.settings')
django.setup()  # type: ignore

from MASTER.clients.models import Client, ClientEmbedding, ClientDocument
from MASTER.rag.vector_search import VectorSearchService
from MASTER.processing.embedding_service import EmbeddingService
from MASTER.EmbeddingModel.models import EmbeddingModel
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    # Type hints for better IDE support
    from django.db.models import Model
    from django.db.models.fields import AutoField

def debug_client_rag_data(client_username=None):
    """Діагностує RAG дані для клієнта"""
    
    print("=== RAG Data Diagnostics ===\n")
    
    # Знаходимо клієнта
    if client_username:
        try:
            client = Client.objects.get(user__username=client_username)
        except Client.DoesNotExist:
            print(f"❌ Клієнт з username '{client_username}' не знайдено")
            return
    else:
        # Беремо першого клієнта як приклад
        client = Client.objects.first()
        if not client:
            print("❌ Немає клієнтів в системі")
            return
    
    print(f"🔍 Аналізуємо клієнта: {client.user.username} (ID: {client.id})")  # type: ignore
    print(f"   Компанія: {client.company_name}")
    print(f"   Спеціалізація: {client.specialization}")
    print()
    
    # Перевіряємо документи
    documents = ClientDocument.objects.filter(client=client)
    print(f"📄 Документи клієнта: {documents.count()}")
    for doc in documents:
        print(f"   - {doc.title} (ID: {doc.id}, processed: {doc.is_processed})")  # type: ignore
    print()
    
    # Перевіряємо embeddings
    embeddings = ClientEmbedding.objects.filter(client=client)
    print(f"🧠 Embeddings клієнта: {embeddings.count()}")
    
    if embeddings.exists():
        # Групуємо по документах
        by_document = {}
        standalone = []
        
        for emb in embeddings:
            if emb.document:
                if emb.document.id not in by_document:
                    by_document[emb.document.id] = []
                by_document[emb.document.id].append(emb)
            else:
                standalone.append(emb)
        
        print("   📚 По документах:")
        for doc_id, embs in by_document.items():
            doc = ClientDocument.objects.get(id=doc_id)
            print(f"      - {doc.title}: {len(embs)} chunks")
            for emb in embs[:3]:  # Показуємо перші 3
                print(f"        * {emb.content[:50]}...")
            if len(embs) > 3:
                print(f"        ... та ще {len(embs) - 3} chunks")
        
        if standalone:
            print("   📝 Standalone embeddings:")
            for emb in standalone[:3]:
                print(f"      - {emb.content[:50]}...")
            if len(standalone) > 3:
                print(f"      ... та ще {len(standalone) - 3} chunks")
    else:
        print("   ❌ Немає embeddings для цього клієнта!")
    print()
    
    # Тестуємо пошук
    print("🔍 Тестуємо RAG пошук:")
    test_queries = ["меню", "борщ", "страви", "їжа", "ресторан"]
    
    # Отримуємо модель для embeddings
    embedding_model = None
    if client.specialization:
        embedding_model = client.specialization.get_embedding_model()
    
    if not embedding_model:
        embedding_model = EmbeddingModel.objects.filter(is_default=True, is_active=True).first()
    
    if not embedding_model:
        print("   ❌ Немає активної embedding моделі!")
        return
    
    print(f"   Використовуємо модель: {embedding_model.name}")
    
    vector_search = VectorSearchService()
    
    for query in test_queries:
        print(f"\n   🔎 Запит: '{query}'")
        
        try:
            # Створюємо embedding для запиту
            query_result = EmbeddingService.create_embedding(query, embedding_model)
            query_vector = query_result['vector']
            
            # Шукаємо
            results = vector_search.search(
                query_vector=query_vector,
                client=client
            )
            
            print(f"      Знайдено: {len(results)} результатів")
            
            if results:
                for i, result in enumerate(results[:3]):
                    print(f"      {i+1}. [{result.level}] similarity={result.similarity:.3f}")
                    print(f"         {result.content[:100]}...")
            else:
                print("      ❌ Немає результатів")
                
        except Exception as e:
            print(f"      ❌ Помилка: {e}")
    
    print("\n=== Кінець діагностики ===")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Діагностика RAG даних клієнта')
    parser.add_argument('--client', help='Username клієнта для аналізу')
    
    args = parser.parse_args()
    debug_client_rag_data(args.client)
