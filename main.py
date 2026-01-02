# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gigachat import GigaChat
import json
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# Инициализация GigaChat
credentials = os.getenv("GIGACHAT_CREDENTIALS")
if not credentials:
    raise ValueError("❌ Переменная GIGACHAT_CREDENTIALS не задана!")

giga = GigaChat(
    credentials=credentials,
    model="GigaChat-2",  
    verify_ssl_certs=False
)

# ✅ Обязательно: создаём приложение FastAPI
app = FastAPI(
    title="TCO Car Parser",
    description="API для извлечения данных об автомобиле из текста"
)

# CORS — разрешаем запросы с вашего GitHub Pages
# ЗАМЕНИТЕ НА ВАШ URL: https://ваш-логин.github.io/название-репозитория
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://default00xd.github.io/telegram-mini-app/"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модель для входящих данных
class CarParseRequest(BaseModel):
    text: str

# Модель для ответа (опционально, можно убрать)
class CarParseResponse(BaseModel):
    brand: str | None = None
    model: str | None = None
    year: int | None = None
    engine: str | None = None
    km: int | None = None
    region: str | None = None
    hp: int | None = None
    consumption: float | None = None
    price: int | None = None
    kasko: int | None = None

# Эндпоинт для парсинга
@app.post("/parse-car", response_model=CarParseResponse)
async def parse_car(request: CarParseRequest):
    try:
        # Используем вашу функцию
        result = extract_car_data(request.text)
        if result is None:
            raise HTTPException(status_code=400, detail="Не удалось распознать автомобиль")
        return result
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Некорректный JSON от GigaChat")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сервера: {str(e)}")

# Ваша существующая функция (без изменений)
def extract_car_data(user_input: str) -> dict | None:
    prompt = f"""
        Ты — помощник по извлечению структурированных данных из текста.
        Извлеки из следующего текста информацию об автомобиле в формате JSON с полями:
        - brand (марка, например: Toyota)
        - model (модель, например: Camry)
        - year (год выпуска, число четырехзначное)
        - engine (Если указан объём двигателя, и марка/модель позволяют однозначно определить индекс двигателя, используй индекс двигателя)
        - km (пробег в км, число округленное до целых)
        - region (регион эксплуатации, например: Ульяновск)
        - hp (лошадиные силы, число)
        - consumption (расход топлива, литры)
        - price (цена покупки, рубли)
        - kasko (если есть каско, то высчитай примерную цену каско на этот авто и заполни это поле)

        Если данные неизвестны — поставь null. Данные могут идти не по порядку, сам определи что к чему больше относится.
        Отвечай ТОЛЬКО JSON, без пояснений.

        Текст: {user_input}
    """

    try:
        response = giga.chat(prompt)
        content = response.choices[0].message.content.strip()

        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]

        # Заменяем None → null, чтобы JSON был валидным
        content = content.replace("None", "null")
        return json.loads(content)

    except Exception as e:
        print(f"Ошибка GigaChat: {e}")
        return None

# Блок для локального запуска (опционален)
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)