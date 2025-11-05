# 🚀 ШВИДКЕ ВИПРАВЛЕННЯ КОНФЛІКТУ МІГРАЦІЙ

## Проблема
```
error: The following untracked working tree files would be overwritten by merge:
    MASTER/clients/migrations/0019_add_unique_tag_constraint.py
```

## Рішення (БЕЗ GIT)

На сервері `/opt/p004_ai_nexelin` виконайте:

### Спосіб 1: Автоматичний (РЕКОМЕНДОВАНО)

```bash
# Просто запустіть цей скрипт:
bash simple_fix_migrations.sh
```

Скрипт автоматично:
- Видалить конфліктні файли
- Створить правильну міграцію з правильним номером
- Перезапустить контейнер
- Покаже логи

### Спосіб 2: Ручний (якщо скрипт не працює)

```bash
# 1. Видаліть конфліктні файли
rm -f MASTER/clients/migrations/0016_add_unique_tag_constraint.py
rm -f MASTER/clients/migrations/0019_add_unique_tag_constraint.py

# 2. Очистіть кеш
find MASTER/clients/migrations -name "*.pyc" -delete
find MASTER/clients/migrations -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

# 3. Подивіться яка остання міграція
ls -lh MASTER/clients/migrations/*.py | tail -5

# Якщо остання міграція 0015, створіть 0016:
# Якщо остання міграція 0018, створіть 0019:
# І т.д.

# 4. Створіть новий файл міграції (припустимо остання була 0018)
cat > MASTER/clients/migrations/0019_add_unique_tag_constraint.py << 'EOF'
# Generated manually for fixing client duplication issue

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0018_merge_20251104_1619'),  # ← Змініть на останню міграцію
    ]

    operations = [
        migrations.AlterField(
            model_name='client',
            name='tag',
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text='Unique client token/tag for bootstrap authentication and portal access',
                max_length=255,
                null=True,
                unique=True
            ),
        ),
    ]
EOF

# 5. Знайдіть назву контейнера
docker ps

# 6. Перезапустіть контейнер (замініть CONTAINER_NAME на реальну назву)
docker restart CONTAINER_NAME

# 7. Перевірте логи
docker logs -f CONTAINER_NAME
```

## Що міняти в dependencies?

Відкрийте файл:
```bash
cat MASTER/clients/migrations/0015_change_user_to_charfield.py
```

Подивіться останній рядок - це буде типу `0015_change_user_to_charfield` або інший номер.

В новій міграції вставте цей номер в `dependencies`:
```python
dependencies = [
    ('clients', '0015_change_user_to_charfield'),  # ← тут останній номер
]
```

## Якщо потрібно скопіювати файли з контейнера

Якщо на сервері немає міграцій 0017, 0018 (а вони є тільки в Docker):

```bash
# Знайдіть контейнер
CONTAINER=$(docker ps --format '{{.Names}}' | grep -E '(nexelin|web|django)' | head -n1)

# Скопіюйте всі міграції з контейнера
docker cp $CONTAINER:/app/MASTER/clients/migrations/. /tmp/migrations/

# Подивіться що там є
ls -lh /tmp/migrations/*.py | tail -10

# Скопіюйте потрібні файли (0017, 0018)
cp /tmp/migrations/0017*.py MASTER/clients/migrations/ 2>/dev/null || true
cp /tmp/migrations/0018*.py MASTER/clients/migrations/ 2>/dev/null || true
cp /tmp/migrations/0016_alter*.py MASTER/clients/migrations/ 2>/dev/null || true

# Очистіть тимчасову папку
rm -rf /tmp/migrations/
```

## Перевірка успіху

Після перезапуску контейнера дивіться логи:

✅ **УСПІХ** - ви побачите:
```
✓ PostgreSQL готовий!
📦 Запускаю міграції Django...
Running migrations:
  Applying clients.0019_add_unique_tag_constraint... OK
🚀 Запуск Gunicorn...
```

❌ **ПОМИЛКА** - якщо бачите:
```
CommandError: Conflicting migrations detected
```

Тоді запустіть:
```bash
# В контейнері створіть merge міграцію
docker exec -it CONTAINER_NAME python manage.py makemigrations --merge --noinput

# Перезапустіть
docker restart CONTAINER_NAME
```

## Важливо!

❗ Не робіть `git pull` поки не видалите локальний файл `0019_add_unique_tag_constraint.py`

❗ Якщо ви НЕ маєте доступ до репозиторію `ChuprinaDaria/test`, просто використайте `simple_fix_migrations.sh` - він працює БЕЗ git!
