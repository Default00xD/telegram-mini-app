import os
import json
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from database import Database

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Инициализация базы данных
db = Database()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик команды /start"""
    user = update.effective_user
    
    # Регистрируем пользователя в базе данных
    db.add_user(user.id, user.username, user.first_name, user.last_name)
    
    # Создаем кнопку для открытия Mini App
    keyboard = [
        [InlineKeyboardButton(
            "🚀 Открыть приложение",
            web_app=WebAppInfo(url="")
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"Привет, {user.first_name}! 👋\n\n"
        "Добро пожаловать в мини-приложение!\n"
        "Нажмите кнопку ниже, чтобы открыть приложение.",
        reply_markup=reply_markup
    )

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик нажатий на кнопки"""
    query = update.callback_query
    await query.answer()

async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик данных из Web App"""
    data = update.effective_message.web_app_data.data
    user_id = update.effective_user.id
    
    # Обработка данных от веб-приложения
    logger.info(f"Получены данные от пользователя {user_id}: {data}")
    
    try:
        # Парсим JSON данные
        parsed_data = json.loads(data)
        action = parsed_data.get('action', 'unknown')
        
        if action == 'save_data' or action == 'main_button_click':
            # Сохраняем данные в БД
            db.save_data(user_id, data)
            await update.message.reply_text("Данные сохранены! ✅")
        else:
            await update.message.reply_text("Данные получены! ✅")
    except json.JSONDecodeError:
        # Если данные не JSON, сохраняем как есть
        db.save_data(user_id, data)
        await update.message.reply_text("Данные получены! ✅")

def main() -> None:
    """Запуск бота"""
    # Получаем токен из переменной окружения
    token = os.getenv('BOT_TOKEN')
    if not token:
        logger.error("BOT_TOKEN не установлен! Установите переменную окружения BOT_TOKEN")
        return
    
    # Создаем приложение
    application = Application.builder().token(token).build()
    
    # Регистрируем обработчики
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_handler))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))
    
    # Инициализируем базу данных
    db.init_db()
    
    # Запускаем бота
    logger.info("Бот запущен...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()

