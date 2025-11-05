# 🚀 Запуск Zero Email Service з реальним Gmail

Цей документ описує як запустити Zero email service для роботи з реальними Gmail акаунтами.

## 📋 Що таке Zero?

[Zero](https://github.com/Mail-0/Zero) - це open-source email сервіс, який дозволяє управляти email через API. Він використовує Google OAuth для доступу до Gmail.

---

## 🎯 Покрокова інструкція

### Крок 1: Отримати Google OAuth Credentials

Для роботи з Gmail потрібні Google API credentials:

#### 1.1. Створити проєкт у Google Cloud Console

1. Перейдіть на [Google Cloud Console](https://console.cloud.google.com/)
2. Створіть новий проєкт або виберіть існуючий
3. Назва проєкту: наприклад, "AI Nexelin Zero"

#### 1.2. Увімкнути Gmail API

1. В меню ліворуч виберіть **"APIs & Services" → "Library"**
2. Знайдіть **"Gmail API"**
3. Натисніть **"Enable"**

#### 1.3. Створити OAuth 2.0 Client ID

1. Перейдіть до **"APIs & Services" → "Credentials"**
2. Натисніть **"Create Credentials" → "OAuth client ID"**
3. Якщо потрібно, налаштуйте OAuth consent screen:
   - User Type: **External**
   - App name: **AI Nexelin Zero**
   - User support email: ваш email
   - Developer contact: ваш email
   - Scopes: додайте `.../auth/gmail.readonly`, `.../auth/gmail.modify`, `.../auth/gmail.compose`
   - Test users: додайте email користувачів, які тестуватимуть додаток

4. Створіть OAuth client:
   - Application type: **Web application**
   - Name: **Zero Web Client**
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     http://localhost:[YOUR_PORT]/api/auth/callback/google
     ```
     (замініть [YOUR_PORT] на порт який буде призначений контейнеру)

5. Збережіть:
   - **Client ID** (схоже на `123456-abcdef.apps.googleusercontent.com`)
   - **Client Secret** (схоже на `GOCSPX-...`)

---

### Крок 2: Підготувати PostgreSQL БД для Zero

Кожен Zero контейнер потребує окрему базу даних.

#### 2.1. Створити БД через Docker

```bash
# Підключитися до PostgreSQL контейнера
docker exec -it <postgres_container_name> psql -U postgres

# Створити БД для Zero (наприклад для клієнта 1)
CREATE DATABASE zero_client_1;
CREATE USER zero_client_1 WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE zero_client_1 TO zero_client_1;

# Дати права на schema public
\c zero_client_1
GRANT ALL ON SCHEMA public TO zero_client_1;
```

Або через Django:

```python
# python manage.py shell
from django.db import connection
cursor = connection.cursor()
cursor.execute("CREATE DATABASE zero_client_1")
```

---

### Крок 3: Отримати або побудувати Zero Docker Image

#### Варіант А: Використати готовий image (рекомендовано)

```bash
# Спробувати pull офіційний staging image
docker pull ghcr.io/mail-0/zero:staging
```

Якщо image недоступний публічно, переходьте до варіанту Б.

#### Варіант Б: Побудувати image локально

```bash
# 1. Клонувати Zero репозиторій
cd /tmp
git clone https://github.com/Mail-0/Zero.git
cd Zero
git checkout staging  # або main

# 2. Побудувати image
docker build -t zero-production:latest .

# 3. Перевірити що image створений
docker images | grep zero
```

**Важливо:** Перевірте що в Zero репозиторії є `Dockerfile`. Якщо немає, використайте docker-compose.yml або документацію з репозиторію.

---

### Крок 4: Налаштувати Zero Config через Django Admin

#### 4.1. Відкрити Django Admin

```bash
# Запустити Django сервер якщо не запущений
python manage.py runserver 0.0.0.0:8001
```

Відкрийте: http://localhost:8001/admin/

#### 4.2. Знайти або створити клієнта

1. Перейдіть до **"Clients"**
2. Виберіть існуючого клієнта або створіть нового
3. Розгорніть секцію **"Zero Email Service Configuration"** (inline в формі клієнта)

#### 4.3. Заповнити Zero Config

**Основні налаштування:**

- ✅ **Enabled**: Так (чекбокс)
- **Status**: Disabled (змініться автоматично при запуску)
- **Image**: `zero-production:latest` або `ghcr.io/mail-0/zero:staging`
- **Repo URL**: `https://github.com/Mail-0/Zero` (опційно)
- **Repo Branch**: `staging` (опційно)

**Networking:**

- **Subdomain**: `client1` (опційно, для reverse proxy)
- **Domain**: `yourdomain.com` (опційно)
- **Host Port**: залиште пустим для auto-assign або вкажіть, наприклад, `3001`

**Database Configuration:**

- **DB Name**: `zero_client_1`
- **DB User**: `zero_client_1`
- **DB Password**: `secure_password_here`
- **DB Host**: `postgres` (якщо Zero в тій же Docker network) або `host.docker.internal`
- **DB Port**: `5432`

**Secrets (ОБОВ'ЯЗКОВО для Gmail):**

- **Better Auth Secret**: автогенерується, або `python -c "import secrets; print(secrets.token_hex(32))"`
- **Google Client ID**: з Кроку 1.3 (наприклад, `123456...apps.googleusercontent.com`)
- **Google Client Secret**: з Кроку 1.3 (наприклад, `GOCSPX-...`)
- **Autumn Secret Key**: `python -c "import secrets; print(secrets.token_urlsafe(32))"` (для шифрування)

**Опційно (Twilio для SMS):**

- **Twilio Account SID**: якщо потрібні SMS
- **Twilio Auth Token**: якщо потрібні SMS
- **Twilio Phone Number**: якщо потрібні SMS

**Sync Settings:**

- **Thread Sync Max Count**: `500` (за замовчуванням)
- **Thread Sync Loop**: Так (для постійної синхронізації)
- **Drop Agent Tables**: Ні (увімкнути тільки для чистого перезапуску)

Натисніть **Save**.

---

### Крок 5: Запустити Zero Container

#### 5.1. Через Django Admin (рекомендовано)

1. Перейдіть до **"Clients"** в admin
2. Виберіть клієнта (чекбокс)
3. В меню "Action" виберіть **"🚀 Start Zero Service"**
4. Натисніть **"Go"**

Контейнер запуститься асинхронно через Celery. Перезавантажте сторінку через 5-10 секунд щоб побачити оновлений статус.

#### 5.2. Або через тестовий скрипт

```bash
python scripts/test_zero_integration.py
```

#### 5.3. Або вручну через Django shell

```python
python manage.py shell

from MASTER.clients.models import Client, ClientZeroConfig
from MASTER.clients.tasks import start_zero_container_task

# Знайти клієнта
client = Client.objects.first()
config = client.zero_config

# Запустити контейнер
start_zero_container_task.delay(config.pk)
```

---

### Крок 6: Перевірити що Zero запустився

#### 6.1. Перевірити статус у Admin

Відкрийте список клієнтів. У колонці **"Zero Status"** має бути:
- 🟢 **Running** ✓

#### 6.2. Перевірити Docker контейнер

```bash
# Показати всі контейнери
docker ps | grep zero

# Має бути щось подібне:
# abc123  zero-production:latest  "..."  Up 2 minutes  0.0.0.0:32768->3000/tcp  zero_client_1
```

#### 6.3. Перевірити логи

```bash
# Подивитися логи Zero
docker logs zero_client_1

# Або з tail
docker logs -f zero_client_1
```

#### 6.4. Перевірити API endpoint

```bash
# Знайти порт (наприклад 32768)
docker ps | grep zero_client_1

# Протестувати health endpoint
curl http://localhost:32768/health

# Має повернути:
# {"status":"healthy","uptime":123.45}
```

---

### Крок 7: Підключити Gmail акаунт до Zero

#### 7.1. Відкрити Zero web interface

```bash
# Якщо host_port = 32768 (перевірте через docker ps)
open http://localhost:32768
```

#### 7.2. Авторизуватися через Google

1. На головній сторінці Zero натисніть **"Sign in with Google"**
2. Виберіть Gmail акаунт
3. Підтвердіть доступ до Gmail (scopes)
4. Ви будете перенаправлені назад до Zero

#### 7.3. Перевірити що email синхронізуються

Zero має автоматично почати синхронізацію ваших Gmail листів в свою БД.

Перевірити можна:
```bash
# Підключитися до БД Zero
docker exec -it <postgres_container> psql -U zero_client_1 -d zero_client_1

# Перевірити таблиці
\dt

# Перевірити emails
SELECT COUNT(*) FROM emails;  # або інша таблиця згідно Zero schema
```

---

### Крок 8: Тестування з реальним email

#### 8.1. Відправити email через Zero API

```bash
# Endpoint для відправки (перевірте документацію Zero)
curl -X POST http://localhost:32768/api/emails/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ZERO_AUTH_TOKEN" \
  -d '{
    "to": "test@example.com",
    "subject": "Test from Zero",
    "body": "Hello from Zero Email Service!"
  }'
```

#### 8.2. Читати emails через Zero API

```bash
# Отримати список emails
curl http://localhost:32768/api/emails \
  -H "Authorization: Bearer YOUR_ZERO_AUTH_TOKEN"
```

**Примітка:** Дізнайтеся точні API endpoints з [документації Zero](https://github.com/Mail-0/Zero) або з їхнього API reference.

---

## 🔧 Налагодження проблем

### Проблема: Container не запускається

```bash
# Перевірити логи
docker logs zero_client_1

# Перевірити що image існує
docker images | grep zero

# Перевірити статус в БД
python manage.py shell
from MASTER.clients.models import ClientZeroConfig
config = ClientZeroConfig.objects.first()
print(config.status, config.last_error)
```

### Проблема: Google OAuth не працює

1. Перевірте що redirect URI співпадає з вашим портом
2. Перевірте що додали email до test users (якщо app не published)
3. Перевірте логи Zero: `docker logs zero_client_1`
4. Перевірте що `GOOGLE_CLIENT_ID` і `GOOGLE_CLIENT_SECRET` правильні

### Проблема: Не підключається до БД

```bash
# Перевірити з контейнера Zero
docker exec -it zero_client_1 env | grep DATABASE_URL

# Має бути: postgresql://user:password@host:5432/dbname

# Перевірити з'єднання з хост-машини
docker exec -it postgres_container psql -U zero_client_1 -d zero_client_1
```

Якщо Zero не може підключитися до postgres через `host.docker.internal`, спробуйте:
- Використати IP адресу хост-машини
- Або додати Zero контейнер в ту саму Docker network що і postgres

```bash
# Знайти network
docker network ls

# Приєднати контейнер до network (якщо потрібно)
docker network connect p004_ai_nexelin_default zero_client_1
```

### Проблема: Port вже зайнятий

```bash
# Перевірити який процес використовує порт
sudo lsof -i :3001  # або ваш порт

# Вказати інший порт в ClientZeroConfig або вбити процес
```

---

## 📊 Моніторинг Zero

### Через Django Admin

1. Відкрийте **Clients**
2. Дивіться колонку **"Zero Status"**
3. Використовуйте actions:
   - **Check Zero Health** - перевірити статус
   - **Restart Zero Service** - перезапустити
   - **Stop Zero Service** - зупинити

### Через Celery tasks

```python
from MASTER.clients.tasks import check_zero_container_health_task

# Для config_id = 1
check_zero_container_health_task.delay(1)
```

### Через Docker CLI

```bash
# Статус
docker stats zero_client_1

# Логи live
docker logs -f zero_client_1

# Інспектувати
docker inspect zero_client_1
```

---

## 🎉 Готово!

Тепер ви маєте повністю функціональний Zero email service підключений до Gmail!

### Наступні кроки:

1. **Інтеграція з вашим RAG**: Додайте логіку для обробки emails через вашу AI систему
2. **Webhooks**: Налаштуйте webhooks щоб Zero повідомляв вас про нові листи
3. **Автоматизація**: Створіть правила для автоматичної відповіді на emails через RAG
4. **Моніторинг**: Налаштуйте алерти якщо Zero контейнер падає
5. **Backup**: Регулярно бекапіть БД Zero

---

## 📚 Корисні посилання

- [Zero GitHub](https://github.com/Mail-0/Zero)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Docs](https://developers.google.com/gmail/api/guides)
- [Docker Networking](https://docs.docker.com/network/)

---

## 🆘 Потрібна допомога?

Якщо виникли проблеми:

1. Перевірте логи: `docker logs zero_client_1`
2. Перевірте статус в admin
3. Запустіть health check: action в admin або через `check_zero_container_health_task`
4. Перевірте що всі secrets заповнені правильно
5. Перевірте документацію Zero на GitHub

**Happy emailing! 🚀📧**

