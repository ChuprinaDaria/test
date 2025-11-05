# Виправлення конфлікту міграцій Django

## Проблема

Django виявив конфлікт міграцій:
```
CommandError: Conflicting migrations detected; multiple leaf nodes in the migration graph:
(0016_add_unique_tag_constraint, 0018_merge_20251104_1619 in clients).
```

Це відбулося тому що:
1. На сервері існують файли міграцій `0017` та `0018`, яких немає в git
2. В git є файл `0016_add_unique_tag_constraint.py`, який конфліктує з `0016_alter_client_user.py` на сервері
3. Django не може визначити правильну послідовність міграцій

## Рішення

Створено три допоміжні файли:

### 1. `copy_missing_migrations.sh`
Копіює відсутні файли міграцій з Docker контейнера в git репозиторій.

### 2. `fix_migrations_on_server.sh`
Виправляє конфлікт міграцій на сервері.

### 3. `0019_add_unique_tag_constraint.py`
Нова міграція, яка замінює `0016_add_unique_tag_constraint.py` і залежить від `0018_merge_20251104_1619`.

## Інструкція з виправлення

### Крок 1: Копіюйте відсутні міграції з Docker

На сервері в директорії `/opt/p004_ai_nexelin`:

```bash
bash copy_missing_migrations.sh
```

Цей скрипт скопіює файли:
- `0016_alter_client_user.py`
- `0017_client_embedding_model_clientqrcode_and_more.py`
- `0018_merge_20251104_1619.py`

### Крок 2: Додайте файли в git

```bash
git add MASTER/clients/migrations/
git status
```

Перевірте що додані правильні файли:
- ✅ Має бути: `0016_alter_client_user.py`
- ✅ Має бути: `0017_client_embedding_model_clientqrcode_and_more.py`
- ✅ Має бути: `0018_merge_20251104_1619.py`
- ✅ Має бути: `0019_add_unique_tag_constraint.py`
- ❌ НЕ має бути: `0016_add_unique_tag_constraint.py` (видалено)

### Крок 3: Виправте міграції на сервері

```bash
bash fix_migrations_on_server.sh
```

Цей скрипт:
1. Очистить Python кеш
2. Видалить конфліктний файл `0016_add_unique_tag_constraint.py` з директорії проекту
3. Перезапустить Docker контейнер
4. Покаже логи для перевірки

### Крок 4: Перевірте що все працює

Дивіться логи:
```bash
docker logs -f ai_nexelin_web
```

Якщо міграції пройшли успішно, ви побачите:
```
✓ PostgreSQL готовий!
✓ Розширення 'vector' вже існує
📦 Запускаю міграції Django...
Running migrations:
  Applying clients.0019_add_unique_tag_constraint... OK
```

### Крок 5: Закомітьте зміни в git

```bash
git commit -m "Fix Django migration conflict: add missing migrations and renumber 0016 to 0019"
git push origin claude/fix-django-migration-conflict-011CUpiTaVGiWfeTTorhxi6k
```

## Що робить міграція 0019?

Міграція `0019_add_unique_tag_constraint.py` додає унікальний constraint на поле `tag` моделі `Client`:

```python
migrations.AlterField(
    model_name='client',
    name='tag',
    field=models.CharField(
        unique=True,  # ← Це виправляє дублювання клієнтів
        ...
    ),
)
```

Це виправляє проблему дублювання клієнтів, яка виникала через відсутність унікального обмеження.

## Альтернативний спосіб (якщо скрипти не працюють)

Якщо автоматичні скрипти не працюють, можна виправити вручну:

```bash
# 1. Видаліть кеш
find MASTER/clients/migrations -name "*.pyc" -delete
find MASTER/clients/migrations -type d -name __pycache__ -exec rm -rf {} +

# 2. Скопіюйте файли з Docker
docker cp ai_nexelin_web:/app/MASTER/clients/migrations/0017_client_embedding_model_clientqrcode_and_more.py MASTER/clients/migrations/
docker cp ai_nexelin_web:/app/MASTER/clients/migrations/0018_merge_20251104_1619.py MASTER/clients/migrations/
docker cp ai_nexelin_web:/app/MASTER/clients/migrations/0016_alter_client_user.py MASTER/clients/migrations/

# 3. Видаліть конфліктний файл з директорії проекту
rm -f MASTER/clients/migrations/0016_add_unique_tag_constraint.py

# 4. Перезапустіть контейнер
docker-compose restart ai_nexelin_web

# 5. Перевірте логи
docker logs -f ai_nexelin_web
```

## Troubleshooting

### Помилка: "no such service: ai_nexelin_web"

Використовуйте правильну назву контейнера:
```bash
docker ps  # подивіться назву контейнера
docker restart <назва_контейнера>
```

### Міграції все ще конфліктують

Перевірте що файл `0016_add_unique_tag_constraint.py` дійсно видалений:
```bash
ls -la MASTER/clients/migrations/ | grep 0016
```

Має бути тільки один файл з `0016`: `0016_alter_client_user.py`

### База даних вже має унікальний constraint

Якщо при застосуванні міграції `0019` виникає помилка що constraint вже існує:
```bash
docker exec -it ai_nexelin_web python manage.py migrate clients 0018 --fake
docker exec -it ai_nexelin_web python manage.py migrate clients 0019
```
