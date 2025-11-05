# Client Portal (React + Vite)

Клієнтський кабінет за шляхом `/:branch/:specialization/:token/admin`.

- Авторизація: bootstrap + JWT
- API: тільки через бек `/api/...`
- Темна тема з CSS змінними з ТЗ
- Мови: ru, en, de, fr

## Env

- VITE_API_BASE_URL (наприклад, http://localhost:8000)

## Розробка

- npm install
- npm run dev

## Продакшн (Docker)

- Dockerfile виконує build та віддачу статики через nginx
