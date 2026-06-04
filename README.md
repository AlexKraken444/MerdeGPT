# MerdeGPT

Шуточный сайт «нейросети нового поколения» на Next.js. На главной — лендинг
с плюсами и отзывами, по кнопке «Попробовать MerdeGPT» открывается клон
ChatGPT, а отвечает на вопросы не ИИ, а ты сам через страницу `/admin`.

## Что внутри

- `app/page.tsx` — лендинг (плюсы, отзывы, CTA, дисклеймер в футере).
- `app/chat/page.tsx` — ChatGPT-подобный интерфейс. Каждому посетителю
  выдаётся свой `chatId` в `localStorage`, страница опрашивает сервер
  каждые 2 секунды и подтягивает новые сообщения.
- `app/admin/page.tsx` — твоя админка. Защищена паролем
  (`ADMIN_PASSWORD`), показывает очередь вопросов и форму ответа.
  Ответ улетает в тот же чат, где был задан вопрос.
- `app/api/...` — серверные роуты (ask / messages / login / questions /
  answer).
- `lib/storage.ts` — обёртка над Upstash Redis.

## Локальный запуск

```bash
npm install
cp .env.example .env.local   # заполни UPSTASH_* и ADMIN_PASSWORD
npm run dev
```

Открой:
- http://localhost:3000 — лендинг
- http://localhost:3000/chat — чат
- http://localhost:3000/admin — админка

## Deploy на Vercel

1. Запушь репозиторий в GitHub (он уже есть:
   https://github.com/AlexKraken444/MerdeGPT).
2. На vercel.com → **Add New → Project** → выбери репозиторий.
3. После создания проекта открой вкладку **Storage** → **Create
   Database** → **Upstash → Redis**. Подключи к проекту — переменные
   `UPSTASH_REDIS_REST_URL` и `UPSTASH_REDIS_REST_TOKEN` (и/или
   `KV_REST_API_*`) попадут в env автоматически.
4. В **Settings → Environment Variables** добавь `ADMIN_PASSWORD` —
   придумай любой пароль.
5. Нажми **Redeploy** (или просто запушь коммит). Готово.

## Как пользоваться

1. Шлёшь кому-то ссылку, он открывает `/chat` и пишет вопрос.
2. Ты заходишь на `/admin`, вводишь пароль, видишь его вопрос в очереди.
3. Пишешь ответ — он мгновенно приходит человеку в чат.

Срок жизни истории чата — 7 дней (TTL в Redis). Этого хватает с запасом.

## Структура хранения

- `merde:chat:{chatId}` — JSON-массив `{role, content, timestamp}`.
- `merde:pending` — список JSON-строк ожидающих вопросов
  `{chatId, content, timestamp}`. После ответа запись удаляется через
  `LREM`.

## Дисклеймер

Сайт — это шутка. На лендинге и в чате есть пометка:
«Данный сайт является шуточным. Ваши вопросы могут быть показаны в моём
видео :)»
