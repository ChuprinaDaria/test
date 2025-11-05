# Порівняння API викликів: React Frontend vs Django Backend

## 📋 Список API викликів з React (nextlen)

### 🔐 Auth API (`/api/auth/`)
| Метод | URL | Статус | Django Endpoint |
|-------|-----|--------|----------------|
| POST | `/auth/register/` | ⚠️ **НЕ ЗНАЙДЕНО** | Потрібно створити |
| POST | `/auth/login/` | ⚠️ **НЕ ЗНАЙДЕНО** | Потрібно створити |
| POST | `/auth/logout/` | ⚠️ **НЕ ЗНАЙДЕНО** | Потрібно створити |
| GET | `/auth/me/` | ⚠️ **НЕ ЗНАЙДЕНО** | Потрібно створити |
| POST | `/auth/refresh/` | ⚠️ **НЕ ЗНАЙДЕНО** | Можливо через Simple JWT |

### 🔑 RAG Auth (`/api/rag/`)
| Метод | URL | Статус | Django Endpoint |
|-------|-----|--------|----------------|
| POST | `/rag/auth/token-by-client-token/` | ✅ **Є** | `/api/rag/auth/token-by-client-token/` |
| POST | `/rag/bootstrap/<branch>/<spec>/<token>/` | ✅ **Є** | `/api/rag/bootstrap/<branch>/<spec>/<token>/` |

### 📄 RAG API (`/api/rag/`)
| Метод | URL | Статус | Django Endpoint |
|-------|-----|--------|----------------|
| POST | `/rag/upload/` | ✅ **Є** | `/api/rag/upload/` |
| POST | `/rag/chat/` | ✅ **Є** | `/api/rag/chat/` |
| GET | `/rag/embedding-models/` | ✅ **Є** | `/api/rag/embedding-models/` |
| GET | `/rag/ai-models/` | ✅ **Є** | `/api/rag/ai-models/` |
| POST | `/rag/client/embedding-model/` | ✅ **Є** | `/api/rag/client/embedding-model/` |
| POST | `/rag/client/reindex/` | ✅ **Є** | `/api/rag/client/reindex/` |
| POST | `/rag/client/index-new/` | ✅ **Є** | `/api/rag/client/index-new/` |

### 🍽️ Restaurant API (`/api/restaurant/`)
| Метод | URL | Статус | Django Endpoint |
|-------|-----|--------|----------------|
| POST | `/restaurant/tts/` | ✅ **Є** | `/api/restaurant/tts/` |
| POST | `/restaurant/stt/` | ✅ **Є** | `/api/restaurant/stt/` |

### 👤 Client API (`/api/clients/`)
| Метод | URL | Статус | Django Endpoint |
|-------|-----|--------|----------------|
| GET | `/clients/me/` | ✅ **Є** | `/api/clients/me/` |
| PATCH | `/clients/me/` | ✅ **Є** | `/api/clients/me/` |
| POST | `/clients/logo/` | ✅ **Є** | `/api/clients/logo/` |
| GET | `/clients/{id}/stats/` | ✅ **Є** | `/api/clients/{id}/stats/` |
| GET | `/clients/documents/` | ✅ **Є** | `/api/clients/documents/` (ViewSet) |
| POST | `/clients/documents/` | ✅ **Є** | `/api/clients/documents/` (ViewSet) |
| GET | `/clients/knowledge-blocks/` | ✅ **Є** | `/api/clients/knowledge-blocks/` (ViewSet) |
| POST | `/clients/knowledge-blocks/` | ✅ **Є** | `/api/clients/knowledge-blocks/` (ViewSet) |
| PATCH | `/clients/knowledge-blocks/{id}/` | ✅ **Є** | `/api/clients/knowledge-blocks/{id}/` (ViewSet) |
| DELETE | `/clients/knowledge-blocks/{id}/` | ✅ **Є** | `/api/clients/knowledge-blocks/{id}/` (ViewSet) |
| POST | `/clients/knowledge-blocks/{id}/documents/` | ✅ **Є** | `/api/clients/knowledge-blocks/{id}/documents/` |

### 🔧 Embedding Model API (`/api/embedding-model/`)
| Метод | URL | Статус | Django Endpoint |
|-------|-----|--------|----------------|
| GET | `/embedding-model/models/` | ✅ **Є** | `/api/embedding-model/models/` |
| POST | `/embedding-model/select/` | ✅ **Є** | `/api/embedding-model/select/` |
| POST | `/embedding-model/reindex/` | ✅ **Є** | `/api/embedding-model/reindex/` |

### 🚫 Legacy Agent API (НЕ ВИКОРИСТОВУЮТЬСЯ)
| Метод | URL | Статус | Примітка |
|-------|-----|--------|----------|
| GET | `/agent/files/` | ⚠️ **НЕ ЗНАЙДЕНО** | Legacy, не використовується |
| DELETE | `/agent/files/{id}/` | ⚠️ **НЕ ЗНАЙДЕНО** | Legacy, не використовується |
| GET | `/agent/prompt/` | ⚠️ **НЕ ЗНАЙДЕНО** | Legacy, не використовується |
| PUT | `/agent/prompt/` | ⚠️ **НЕ ЗНАЙДЕНО** | Legacy, не використовується |
| POST | `/agent/train/` | ⚠️ **НЕ ЗНАЙДЕНО** | Legacy, не використовується |
| GET | `/agent/train/status/` | ⚠️ **НЕ ЗНАЙДЕНО** | Legacy, не використовується |
| GET | `/agent/history/` | ⚠️ **НЕ ЗНАЙДЕНО** | Legacy, не використовується |
| GET | `/agent/history/{id}/` | ⚠️ **НЕ ЗНАЙДЕНО** | Legacy, не використовується |

---

## ⚠️ ПРОБЛЕМИ ТА РЕКОМЕНДАЦІЇ

### 1. **Auth API відсутній**
Фронтенд викликає `/auth/register/`, `/auth/login/`, `/auth/logout/`, `/auth/me/`, `/auth/refresh/`, але ці ендпоінти не знайдені в Django.

**Рішення:**
- Створити auth endpoints або використовувати Django REST Framework Simple JWT
- Можливо, auth працює через `/api/rag/auth/token-by-client-token/` для клієнтів

### 2. **Legacy Agent API**
Фронтенд має `agentAPI` з legacy методами, які не використовуються в коді.

**Рекомендація:**
- Видалити або приховати legacy методи з `agentAPI` у фронтенді
- Або створити ці ендпоінти, якщо вони потрібні

### 3. **Всі інші API співпадають ✅**

---

## 📝 Детальна інформація про Django Endpoints

### `/api/rag/` (prefix)
- `query/` - RAGQueryView
- `upload/` - DocumentUploadView
- `docs/` - APIDocsView
- `chat/` - PublicRAGChatView
- `auth/token-by-client-token/` - TokenByClientTokenView
- `bootstrap/<branch_slug>/<specialization_slug>/<client_token>/` - BootstrapProvisionView
- `provision-link/` - ProvisionLinkView
- `client/features/overview/` - ClientFeaturesOverviewView
- `ai-models/` - AIModelsListView
- `embedding-models/` - EmbeddingModelsListView
- `client/embedding-model/` - ClientEmbeddingModelSetView
- `client/index-new/` - ClientIndexNewDocumentsView
- `client/reindex/` - ClientReindexDocumentsView
- `embedding-models/<int:model_id>/reindex/` - EmbeddingModelReindexView

### `/api/clients/` (prefix)
- `me/` - ClientMeView (GET, PATCH)
- `logo/` - ClientLogoUploadView (POST)
- `<int:client_id>/stats/` - client_stats (GET)
- `documents/` - ClientDocumentViewSet (CRUD через ViewSet)
- `knowledge-blocks/` - KnowledgeBlockViewSet (CRUD через ViewSet)
- `knowledge-blocks/<int:block_id>/documents/` - KnowledgeBlockDocumentsView (POST)
- ViewSet routes: `clients/`, `api-keys/`

### `/api/restaurant/` (prefix)
- `chat/` - RestaurantChatViewSet.chat
- `tts/` - tts_demo
- `stt/` - stt_demo
- ViewSet routes: `categories/`, `menus/`, `menu-items/`, `tables/`

### `/api/embedding-model/` (prefix)
- `models/` - get_models
- `select/` - select_model
- `reindex/` - reindex_client_documents

