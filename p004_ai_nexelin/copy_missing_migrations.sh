#!/bin/bash
# Скрипт для копіювання відсутніх файлів міграцій з Docker контейнера

echo "📦 Копіюю відсутні файли міграцій з Docker контейнера..."
echo ""

# Перевірка що контейнер запущений
if ! docker ps | grep -q ai_nexelin_web; then
    echo "❌ Контейнер ai_nexelin_web не запущений"
    exit 1
fi

# Створюємо тимчасову директорію
TEMP_DIR=$(mktemp -d)
echo "Використовую тимчасову директорію: $TEMP_DIR"

# Копіюємо всі міграції з контейнера
echo "Копіюю всі міграції з контейнера..."
docker cp ai_nexelin_web:/app/MASTER/clients/migrations/. "$TEMP_DIR/"

echo ""
echo "Файли в контейнері:"
ls -lh "$TEMP_DIR"/*.py 2>/dev/null | tail -15

echo ""
echo "Копіюю відсутні файли в git репозиторій..."

# Копіюємо тільки файли 0017 та 0018 якщо вони існують
if [ -f "$TEMP_DIR/0017_client_embedding_model_clientqrcode_and_more.py" ]; then
    cp "$TEMP_DIR/0017_client_embedding_model_clientqrcode_and_more.py" MASTER/clients/migrations/
    echo "✓ Скопійовано 0017_client_embedding_model_clientqrcode_and_more.py"
else
    echo "⚠️  0017 не знайдено в контейнері"
fi

if [ -f "$TEMP_DIR/0018_merge_20251104_1619.py" ]; then
    cp "$TEMP_DIR/0018_merge_20251104_1619.py" MASTER/clients/migrations/
    echo "✓ Скопійовано 0018_merge_20251104_1619.py"
else
    echo "⚠️  0018 не знайдено в контейнері"
fi

# Також копіюємо 0016_alter_client_user.py якщо він є
if [ -f "$TEMP_DIR/0016_alter_client_user.py" ]; then
    cp "$TEMP_DIR/0016_alter_client_user.py" MASTER/clients/migrations/
    echo "✓ Скопійовано 0016_alter_client_user.py"
else
    echo "⚠️  0016_alter_client_user.py не знайдено в контейнері"
fi

# Очищаємо тимчасову директорію
rm -rf "$TEMP_DIR"

echo ""
echo "Поточні файли міграцій в git:"
ls -lh MASTER/clients/migrations/*.py | tail -15

echo ""
echo "✅ Готово! Тепер запустіть: bash fix_migrations_on_server.sh"
