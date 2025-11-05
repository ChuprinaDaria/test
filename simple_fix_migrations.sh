#!/bin/bash
# Скрипт для виправлення конфлікту міграцій Django (ПРОСТИЙ СПОСІБ БЕЗ GIT)
# Використання: bash simple_fix_migrations.sh

set -e  # Зупинитися при помилці

echo "🔧 Починаю виправлення міграцій Django (простий спосіб)..."
echo ""

# Перевірка що ми в правильній директорії
if [ ! -d "MASTER/clients/migrations" ]; then
    echo "❌ Помилка: Не знайдено директорію MASTER/clients/migrations"
    echo "   Переконайтеся що ви в /opt/p004_ai_nexelin"
    exit 1
fi

echo "Крок 1: Перевіряю поточний стан міграцій..."
echo "─────────────────────────────────────────────────"
ls -lah MASTER/clients/migrations/ | grep "\.py$" | tail -15
echo ""

echo "Крок 2: Видаляю кеш Python..."
echo "─────────────────────────────────────────────────"
find MASTER/clients/migrations -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find MASTER/clients/migrations -name "*.pyc" -delete 2>/dev/null || true
echo "✓ Кеш очищено"
echo ""

echo "Крок 3: Видаляю конфліктні файли 0016_add_unique_tag_constraint.py..."
echo "─────────────────────────────────────────────────"
# Видаляємо обидві версії якщо існують
if [ -f "MASTER/clients/migrations/0016_add_unique_tag_constraint.py" ]; then
    rm -f MASTER/clients/migrations/0016_add_unique_tag_constraint.py
    echo "✓ Видалено 0016_add_unique_tag_constraint.py"
fi

if [ -f "MASTER/clients/migrations/0019_add_unique_tag_constraint.py" ]; then
    rm -f MASTER/clients/migrations/0019_add_unique_tag_constraint.py
    echo "✓ Видалено 0019_add_unique_tag_constraint.py (створимо новий)"
fi
echo ""

echo "Крок 4: Перевіряю які міграції є в Docker контейнері..."
echo "─────────────────────────────────────────────────"

# Знаходимо назву контейнера
CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep -E '(nexelin|web|django)' | head -n1)

if [ -z "$CONTAINER_NAME" ]; then
    echo "⚠️  Не знайдено запущений контейнер"
    echo "   Спробуйте запустити: docker-compose up -d"
    exit 1
fi

echo "Використовую контейнер: $CONTAINER_NAME"
echo ""

# Копіюємо всі міграції з контейнера
TEMP_DIR=$(mktemp -d)
echo "Копіюю міграції з контейнера в $TEMP_DIR..."
docker cp "$CONTAINER_NAME:/app/MASTER/clients/migrations/." "$TEMP_DIR/" 2>/dev/null || {
    echo "⚠️  Не вдалося скопіювати з /app, спробуємо /code..."
    docker cp "$CONTAINER_NAME:/code/MASTER/clients/migrations/." "$TEMP_DIR/" 2>/dev/null || {
        echo "❌ Не вдалося скопіювати файли з контейнера"
        rm -rf "$TEMP_DIR"
        exit 1
    }
}

echo "Файли в контейнері:"
ls -lh "$TEMP_DIR"/*.py 2>/dev/null | tail -10
echo ""

echo "Крок 5: Визначаю останню міграцію..."
echo "─────────────────────────────────────────────────"

# Знаходимо найбільший номер міграції в директорії
LAST_MIGRATION=$(ls MASTER/clients/migrations/*.py 2>/dev/null | grep -oP '\d{4}_' | sort -nr | head -n1 | tr -d '_')

if [ -z "$LAST_MIGRATION" ]; then
    LAST_MIGRATION="0015"
fi

echo "Остання міграція: $LAST_MIGRATION"

# Визначаємо номер для нової міграції
NEXT_MIGRATION=$(printf "%04d" $((10#$LAST_MIGRATION + 1)))
echo "Нова міграція буде: $NEXT_MIGRATION"
echo ""

echo "Крок 6: Створюю нову міграцію ${NEXT_MIGRATION}_add_unique_tag_constraint.py..."
echo "─────────────────────────────────────────────────"

# Знаходимо файл dependency (попередня міграція)
PREV_MIGRATION=$(ls MASTER/clients/migrations/*.py 2>/dev/null | grep -oP '\d{4}_[^/]+\.py' | sort | tail -n1 | sed 's/\.py$//')

cat > "MASTER/clients/migrations/${NEXT_MIGRATION}_add_unique_tag_constraint.py" << EOF
# Generated manually for fixing client duplication issue

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '${PREV_MIGRATION}'),
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

echo "✓ Створено ${NEXT_MIGRATION}_add_unique_tag_constraint.py з dependency: $PREV_MIGRATION"
echo ""

# Очищаємо тимчасову директорію
rm -rf "$TEMP_DIR"

echo "Крок 7: Фінальний список міграцій..."
echo "─────────────────────────────────────────────────"
ls -lh MASTER/clients/migrations/*.py | tail -10
echo ""

echo "Крок 8: Перезапускаю Docker контейнер..."
echo "─────────────────────────────────────────────────"

# Спробуємо різні команди для перезапуску
if command -v docker-compose &> /dev/null; then
    docker-compose restart "$CONTAINER_NAME" 2>/dev/null || docker restart "$CONTAINER_NAME"
else
    docker restart "$CONTAINER_NAME"
fi

echo "✓ Контейнер перезапущено"
echo ""

echo "Крок 9: Очікую 5 секунд..."
sleep 5
echo ""

echo "Крок 10: Перевіряю логи (останні 40 рядків)..."
echo "─────────────────────────────────────────────────"
docker logs "$CONTAINER_NAME" 2>&1 | tail -40
echo ""

echo "════════════════════════════════════════════════"
echo "✅ Скрипт виконано!"
echo ""
echo "Якщо міграції пройшли успішно, ви побачите:"
echo "  ✓ PostgreSQL готовий!"
echo "  📦 Запускаю міграції Django..."
echo "  Running migrations:"
echo "    Applying clients.${NEXT_MIGRATION}_add_unique_tag_constraint... OK"
echo ""
echo "Якщо все ще є помилки, перегляньте повні логи:"
echo "  docker logs -f $CONTAINER_NAME"
echo "════════════════════════════════════════════════"
