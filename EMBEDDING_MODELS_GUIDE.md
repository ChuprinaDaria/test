# 🧠 Керівництво по роботі з Embedding моделями

## Загальна інформація

Система зберігає **окремі вектори для кожної embedding моделі**. Це означає що при зміні моделі старі вектори не видаляються, а зберігаються в базі даних.

## ✨ Ключові особливості

### 1. **Збереження векторів для кожної моделі**
- Кожен ClientEmbedding має поле `embedding_model_id`
- При зміні моделі створюються НОВІ вектори, старі залишаються
- При поверненні до старої моделі використовуються ІСНУЮЧІ вектори

### 2. **Логіка зміни моделі**

#### Коли користувач обирає нову модель:
```
1. Користувач обирає нову модель через API: POST /api/rag/client/embedding-model/
2. Система зберігає нову модель в client.embedding_model
3. Система повертає reindex_required: true
4. Користувач може запустити індексацію: POST /api/rag/client/index-new/
   або реіндексацію: POST /api/rag/client/reindex/
```

#### Коли користувач повертається до старої моделі:
```
1. Користувач обирає стару модель через API
2. Система зберігає модель в client.embedding_model
3. Система перевіряє чи є вже embeddings для цієї моделі
4. Якщо є - reindex_required: false (можна одразу користуватися!)
5. Якщо немає - reindex_required: true (треба індексувати)
```

### 3. **Пошук по векторах**

При пошуку система використовує ТІЛЬКИ вектори поточної моделі:

```python
# В VectorSearchService._search_client_level
embedding_model = client.embedding_model
queryset = ClientEmbedding.objects.filter(
    client=client,
    embedding_model=embedding_model  # ← Фільтр по поточній моделі!
)
```

Це гарантує що:
- Не змішуються вектори різних моделей
- При поверненні до старої моделі одразу використовуються її вектори
- Кожна модель працює в ізольованому просторі

## 📊 API Endpoints

### 1. Отримати список embedding моделей
```http
GET /api/rag/embedding-models/
```

**Відповідь:**
```json
{
  "models": [
    {
      "id": 1,
      "name": "text-embedding-3-small",
      "slug": "openai-text-embedding-3-small",
      "provider": "openai",
      "dimensions": 1536,
      "cost_per_1k_tokens": 0.00002,
      "is_selected": true
    }
  ],
  "selected_model_id": 1,
  "default_model_id": 1
}
```

### 2. Встановити embedding модель
```http
POST /api/rag/client/embedding-model/
Content-Type: application/json

{
  "model_id": 2,
  "model_type": "embedding"
}
```

**Відповідь:**
```json
{
  "success": true,
  "model": {
    "id": 2,
    "name": "text-embedding-3-large",
    "dimensions": 3072
  },
  "model_type": "embedding",
  "reindex_required": true,
  "message": "Embedding model updated. Please reindex your documents."
}
```

### 3. Індексувати НОВІ документи
```http
POST /api/rag/client/index-new/
```

Цей endpoint індексує тільки документи з `is_processed=False`. Не видаляє існуючі embeddings.

### 4. Реіндексувати ВСІ документи
```http
POST /api/rag/client/reindex/
```

Цей endpoint:
1. Видаляє ВСІ embeddings для ПОТОЧНОЇ моделі
2. Помічає всі документи як `is_processed=False`
3. Запускає повторну індексацію

**ВАЖЛИВО:** Embeddings інших моделей НЕ видаляються!

### 5. Отримати статистику embeddings
```http
GET /api/clients/embeddings-stats/
```

**Відповідь:**
```json
{
  "current_model": {
    "id": 1,
    "name": "text-embedding-3-small",
    "slug": "openai-text-embedding-3-small",
    "provider": "openai",
    "dimensions": 1536
  },
  "total_embeddings": 1250,
  "embeddings_by_model": [
    {
      "embedding_model__id": 1,
      "embedding_model__name": "text-embedding-3-small",
      "embedding_model__provider": "openai",
      "count": 850
    },
    {
      "embedding_model__id": 2,
      "embedding_model__name": "text-embedding-3-large",
      "embedding_model__provider": "openai",
      "count": 400
    }
  ],
  "unprocessed_documents": 5,
  "has_multiple_models": true
}
```

## 🔄 Сценарії використання

### Сценарій 1: Перша індексація
```
1. Клієнт обирає модель A
2. Завантажує 10 документів
3. Запускає POST /api/rag/client/index-new/
4. Створюється 100 embeddings для моделі A
```

### Сценарій 2: Зміна моделі з реіндексацією
```
1. Клієнт змінює модель на B
2. API повертає reindex_required: true
3. Клієнт запускає POST /api/rag/client/reindex/
4. Видаляються embeddings моделі B (якщо були)
5. Створюється 100 нових embeddings для моделі B
6. Embeddings моделі A залишаються в БД!
```

### Сценарій 3: Повернення до старої моделі
```
1. Клієнт повертається до моделі A
2. API повертає reindex_required: false (вектори вже є!)
3. Система одразу використовує 100 існуючих embeddings моделі A
4. Не треба повторно індексувати!
```

### Сценарій 4: Додавання нових документів
```
1. Клієнт додає 5 нових документів
2. Запускає POST /api/rag/client/index-new/
3. Створюється 50 нових embeddings для ПОТОЧНОЇ моделі
4. Старі embeddings не чіпаються
```

## 💾 База даних

### Таблиця: `clients_clientembedding`
```sql
CREATE TABLE clients_clientembedding (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients_client(id),
    document_id INTEGER REFERENCES clients_clientdocument(id),
    embedding_model_id INTEGER REFERENCES embeddingmodel_embeddingmodel(id), -- ← Ключ!
    vector VECTOR(3072),
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMP
);

-- Індекси для швидкого пошуку
CREATE INDEX idx_client_embedding_client ON clients_clientembedding(client_id);
CREATE INDEX idx_client_embedding_model ON clients_clientembedding(embedding_model_id);
```

### Приклад даних:
```sql
-- Клієнт спочатку використав модель 1
INSERT INTO clients_clientembedding (client_id, embedding_model_id, content)
VALUES (100, 1, 'Document chunk 1'), (100, 1, 'Document chunk 2');

-- Потім змінив на модель 2 і реіндексував
INSERT INTO clients_clientembedding (client_id, embedding_model_id, content)
VALUES (100, 2, 'Document chunk 1'), (100, 2, 'Document chunk 2');

-- Повернувся до моделі 1 - старі вектори використовуються!
SELECT * FROM clients_clientembedding
WHERE client_id = 100 AND embedding_model_id = 1;
-- ← Повертає існуючі вектори, не треба індексувати знову!
```

## 🎯 Custom System Prompt

Кожен клієнт може мати свій власний system prompt для AI відповідей.

### Де зберігається:
```python
# Модель Client
class Client(models.Model):
    custom_system_prompt = models.TextField(blank=True)
```

### Як використовується:
```python
# В LLMClient._get_client_custom_prompt
custom_prompt = getattr(client, 'custom_system_prompt', None)
if isinstance(custom_prompt, str) and custom_prompt:
    return custom_prompt  # ← Використовується для генерації відповіді
```

### API для оновлення:
```http
PATCH /api/clients/me/
Content-Type: application/json

{
  "custom_system_prompt": "You are a helpful restaurant AI assistant. Always be polite and suggest menu items."
}
```

## 🔍 Перевірка коректності

### 1. Перевірити чи зберігаються вектори кожної моделі:
```sql
SELECT
    embedding_model_id,
    COUNT(*) as embeddings_count
FROM clients_clientembedding
WHERE client_id = <client_id>
GROUP BY embedding_model_id;
```

### 2. Перевірити чи використовується поточна модель:
```python
from MASTER.clients.models import Client
client = Client.objects.get(id=100)
print(f"Current model: {client.embedding_model.name}")
```

### 3. Перевірити чи використовується custom prompt:
```python
from MASTER.rag.llm_client import LLMClient
llm = LLMClient()
prompt = llm._get_client_custom_prompt(client)
print(f"Custom prompt: {prompt}")
```

## ⚠️ Важливі зауваження

1. **Не видаляйте старі embeddings вручну** - система сама керує ними
2. **При зміні моделі завжди перевіряйте reindex_required** - якщо false, можна одразу користуватися
3. **Реіндексація видаляє тільки embeddings поточної моделі** - інші моделі не чіпаються
4. **Vector dimensions фіксовані на 3072** - менші вектори доповнюються нулями
5. **Custom prompt має найвищий пріоритет** - перевизначає промпти specialization та branch

## 📚 Додаткові ресурси

- API документація: `/api/rag/docs/`
- Приклади використання: `API_ENDPOINTS.md`
- Проблеми та питання: `API_ISSUES.md`
