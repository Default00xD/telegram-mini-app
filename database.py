import sqlite3
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class Database:
    def __init__(self, db_name: str = "telegram_app.db"):
        """Инициализация подключения к базе данных"""
        self.db_name = db_name
        self.conn = None
    
    def get_connection(self):
        """Получить соединение с базой данных"""
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_name, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row
        return self.conn
    
    def init_db(self):
        """Инициализация таблиц базы данных"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Таблица пользователей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Таблица данных приложения (пример)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS app_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        ''')
        
        conn.commit()
        logger.info("База данных инициализирована")
    
    def add_user(self, user_id: int, username: Optional[str], 
                 first_name: Optional[str], last_name: Optional[str]):
        """Добавить или обновить пользователя"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO users (user_id, username, first_name, last_name, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ''', (user_id, username, first_name, last_name))
        
        conn.commit()
        logger.info(f"Пользователь {user_id} добавлен/обновлен")
    
    def get_user(self, user_id: int) -> Optional[dict]:
        """Получить данные пользователя"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        return None
    
    def save_data(self, user_id: int, data: str):
        """Сохранить данные от пользователя"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO app_data (user_id, data)
            VALUES (?, ?)
        ''', (user_id, data))
        
        conn.commit()
        logger.info(f"Данные сохранены для пользователя {user_id}")
    
    def get_user_data(self, user_id: int) -> list:
        """Получить все данные пользователя"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM app_data WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]
    
    def close(self):
        """Закрыть соединение с базой данных"""
        if self.conn:
            self.conn.close()
            self.conn = None


