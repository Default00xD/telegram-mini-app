# Telegram Mini App

Мини-приложение для Telegram с базой данных SQLite.

## Структура проекта

```
.
├── bot.py              # Основной файл бота
├── database.py         # Модуль работы с базой данных
├── web/                # Веб-интерфейс Mini App
│   ├── index.html     # HTML страница
│   ├── style.css      # Стили
│   └── app.js         # JavaScript логика
├── requirements.txt    # Зависимости Python
└── README.md          # Документация
```

## Установка

1. Установите зависимости:
```bash
pip install -r requirements.txt
```

2. Создайте бота через [@BotFather](https://t.me/BotFather) в Telegram и получите токен

3. Установите переменную окружения с токеном:
```bash
# Windows PowerShell
$env:BOT_TOKEN="ваш_токен_бота"

# Windows CMD
set BOT_TOKEN=ваш_токен_бота

# Linux/Mac
export BOT_TOKEN="ваш_токен_бота"
```

4. Настройте Web App URL в BotFather:
   - Откройте [@BotFather](https://t.me/BotFather)
   - Выберите вашего бота
   - Используйте команду `/newapp` или `/setmenubutton`
   - Укажите URL вашего веб-приложения (должен быть HTTPS)

## Запуск

```bash
python bot.py
```

## Развертывание веб-приложения

Веб-приложение должно быть доступно по HTTPS. Вы можете:

1. Использовать GitHub Pages
2. Развернуть на VPS с nginx
3. Использовать сервисы типа Vercel, Netlify
4. Использовать ngrok для тестирования (не для продакшена)

## Функции

- ✅ Регистрация пользователей в базе данных
- ✅ Веб-интерфейс с интеграцией Telegram Web App API
- ✅ Отправка данных из веб-приложения в бот
- ✅ SQLite база данных для хранения данных

## База данных

База данных SQLite создается автоматически при первом запуске. Содержит таблицы:
- `users` - информация о пользователях
- `app_data` - данные от пользователей

## Разработка

Для локальной разработки веб-приложения используйте локальный сервер:
```bash
cd web
python -m http.server 8000
```

Затем используйте ngrok для создания HTTPS туннеля:
```bash
ngrok http 8000
```


