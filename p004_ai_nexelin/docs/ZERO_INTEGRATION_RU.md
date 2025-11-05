# 📧 Zero Email Service - Интеграция с Django AI Nexelin

## 🎯 Что это такое?

**Zero** - это open-source email клиент с AI функциями, который:
- Подключается к Gmail через OAuth
- Работает с несколькими email аккаунтами
- Использует AI для автоматизации работы с почтой
- Может быть развёрнут для каждого клиента отдельно

**Django AI Nexelin** - это ваша RAG система, которая:
- Управляет клиентами и их документами
- Предоставляет AI ответы на вопросы
- Теперь может управлять Zero контейнерами для каждого клиента

---

## 🔧 Как интегрировано Zero в Django проект?

### 1. Модели Django

```python
# MASTER/clients/models.py

class ClientZeroConfig(models.Model):
    """Конфигурация Zero для каждого клиента"""
    client = models.OneToOneField(Client, on_delete=models.CASCADE)
    
    # Статус контейнера
    enabled = models.BooleanField(default=False)
    status = models.CharField(max_length=16)  # running, stopped, error
    
    # Docker конфигурация
    container_name = models.CharField(max_length=150)
    container_id = models.CharField(max_length=100)
    host_port = models.PositiveIntegerField()
    
    # Credentials
    google_client_id = models.CharField(max_length=300)
    google_client_secret = models.CharField(max_length=300)
    better_auth_secret = models.CharField(max_length=200)
    
    # База данных для Zero
    db_name = models.CharField(max_length=100)
    db_user = models.CharField(max_length=100)
    db_password = models.CharField(max_length=200)
```

### 2. Docker Manager

```python
# MASTER/clients/docker_manager.py

class ZeroDockerManager:
    """Управляет Docker контейнерами Zero для клиентов"""
    
    def start_zero_container(container_name, env, host_port):
        # Запускает отдельный Zero контейнер для клиента
        
    def stop_zero_container(container_name):
        # Останавливает контейнер
        
    def get_container_status(container_name):
        # Проверяет статус контейнера
```

### 3. Django Admin Интеграция

В админ-панели Django для каждого клиента:
- Секция "Zero Email Service Configuration"
- Кнопки: Start/Stop/Restart Zero Service
- Статус контейнера в реальном времени
- Настройка Google OAuth credentials

### 4. Celery Tasks

```python
# MASTER/clients/tasks.py

@shared_task
def start_zero_container_task(config_id):
    """Асинхронный запуск Zero контейнера"""
    
@shared_task
def check_zero_container_health_task(config_id):
    """Проверка здоровья контейнера"""
```

---

## 🚀 Инструкция по запуску 

### Требования
- Docker и Docker Compose
- Python 3.10+
- Node.js 20+ (для локальной разработки)
- Google OAuth credentials

### Шаг 1: Клонировать проект

```bash
git clone [ваш-репозиторий]
cd p004_ai_nexelin
```

### Шаг 2: Настроить Google OAuth

1. Перейти на https://console.cloud.google.com/
2. Создать новый проект или выбрать существующий
3. Включить **Gmail API**:
   - APIs & Services → Library → Gmail API → Enable
4. Создать **OAuth 2.0 Client ID**:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Name: **Zero Email Service**
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
5. Сохранить **Client ID** и **Client Secret**

### Шаг 3: Создать файл окружения

```bash
# Скопировать пример
cp zero.env.example .env.zero

# Редактировать и вставить ваши credentials
nano .env.zero
```

Заполнить:
```env
GOOGLE_CLIENT_ID=ваш_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ваш_client_secret
BETTER_AUTH_SECRET=$(openssl rand -hex 32)  # Сгенерировать
```

### Шаг 4: Запустить через Docker Compose

```bash
# Запустить базу данных и Redis
docker-compose -f docker-compose.zero.yml up -d zero-db zero-redis zero-upstash

# Подождать 10 секунд пока БД запустится
sleep 10

# Для полноценного Zero (когда будет Docker образ):
# docker-compose -f docker-compose.zero.yml up -d

# Для тестовой версии:
docker-compose -f docker-compose.zero.yml up -d zero-mock
```

### Шаг 5: Запустить Django сервер

```bash
# Установить зависимости
pip install -r requirements.txt

# Миграции
python manage.py migrate

# Создать суперпользователя
python manage.py createsuperuser

# Запустить сервер
python manage.py runserver 0.0.0.0:8001
```

### Шаг 6: Настроить Zero для клиента

1. Открыть Django Admin: http://localhost:8001/admin/
2. Перейти в **Clients**
3. Создать или выбрать клиента
4. В секции **Zero Email Service Configuration** заполнить:
   - ✅ Enabled
   - Image: `zero-production:latest` (или использовать mock)
   - Google Client ID и Secret
   - Database настройки
5. Сохранить
6. Выбрать клиента → Action → **"🚀 Start Zero Service"**

### Шаг 7: Открыть Zero

```bash
# Проверить что контейнер запущен
docker ps | grep zero

# Открыть в браузере
open http://localhost:3000
```

### Шаг 8: Подключить Gmail

1. В Zero нажать **"Sign in with Google"**
2. Выбрать Gmail аккаунт
3. Разрешить доступ к Gmail
4. Zero начнёт синхронизацию писем

---

## 📋 Команды для управления

### Проверить статус
```bash
# Все контейнеры
docker ps

# Логи Zero
docker logs zero_client_1

# Django логи
python manage.py runserver
```

### Остановить
```bash
# Zero контейнеры
docker-compose -f docker-compose.zero.yml down

# Django
Ctrl+C в терминале
```

### Очистить данные
```bash
# Удалить volumes (осторожно!)
docker-compose -f docker-compose.zero.yml down -v
```

---

## 🏗️ Архитектура системы

```
┌─────────────────────────────────────────────────────────┐
│                   Django AI Nexelin                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   Clients    │───▶│ ClientZeroConfig │               │
│  └──────────────┘    └──────────────┘                  │
│         │                    │                          │
│         ▼                    ▼                          │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │ Docker Manager│───▶│ Celery Tasks │                  │
│  └──────────────┘    └──────────────┘                  │
│                              │                          │
└──────────────────────────────┼──────────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │ Docker Containers │
                    ├──────────────────┤
                    │ zero_client_1     │◀─── Port 3001
                    │ zero_client_2     │◀─── Port 3002  
                    │ zero_client_3     │◀─── Port 3003
                    └──────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │   Gmail API      │
                    └──────────────────┘
```

---

## 🔒 Безопасность

1. **Изоляция клиентов**: Каждый клиент получает отдельный контейнер
2. **Секреты**: Хранятся зашифрованными в БД Django
3. **OAuth**: Используется официальный Google OAuth flow
4. **Порты**: Автоматическое назначение уникальных портов
5. **БД**: Отдельная база данных для каждого Zero инстанса

---

## ❓ FAQ

### Q: Почему Zero не запускается?
**A:** Проверьте:
- Docker daemon запущен
- Порты не заняты (3000, 8787, 5434)
- Google credentials правильные
- В .env.zero все поля заполнены

### Q: Как добавить нового клиента?
**A:** 
1. Django Admin → Clients → Add
2. Заполнить Zero config
3. Start Zero Service

### Q: Можно ли использовать без Google?
**A:** Пока нет, Zero работает только с Gmail через OAuth

### Q: Как обновить Zero?
**A:** 
```bash
docker pull ghcr.io/mail-0/zero:latest
docker-compose -f docker-compose.zero.yml restart
```

---

## 📞 Контакты и ссылки

- **Zero GitHub**: https://github.com/Mail-0/Zero
- **Django проект**: Ваш репозиторий
- **Google Cloud Console**: https://console.cloud.google.com/
- **Gmail API Docs**: https://developers.google.com/gmail/api

---

## 🎉 Результат

После успешной настройки у вас будет:
1. **Django система** управления клиентами на http://localhost:8001
2. **Zero email клиент** для каждого клиента на отдельном порту
3. **Интеграция с Gmail** через OAuth
4. **AI функции** для автоматизации email

Каждый клиент получает свой изолированный Zero instance с собственной БД и настройками!

---

*Последнее обновление: Октябрь 2025*
