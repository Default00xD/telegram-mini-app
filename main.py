# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gigachat import GigaChat
import json
import os
from dotenv import load_dotenv

load_dotenv()
print(".py init...")
app = FastAPI()

# CORS — ЗАМЕНИТЕ НА ВАШ URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Глобальная переменная (будет инициализирована при первом запросе)
_giga_client = None
SYSTEM_PROMPT = """ОТВЕЧАЙ ТОЛЬКО JSON, БЕЗ ПОЯСНЕНИЙ, БЕЗ КОММЕНТАРИЕВ, ТОЛЬКО JSON.
            Ты — помощник по извлечению структурированных данных из текста.
            Извлеки из следующего текста информацию об автомобиле в формате JSON с полями:
            - brand (марка, например: Toyota)
            - model (модель, например: Camry)
            - year (год выпуска, число четырехзначное. если нет данных - 2026)
            - ownership (срок владения. если нет данных укажи возраст машины с момента года выпуска. ТОЛЬКО ЧИСЛО)
            - hp (лошадиные силы. если нет данных - мощность самого популярного двигателя конкретно этой модели машины)
            - engine (индекс двигателя. определяется по марке, моделе, мощности и обьему двигателя, найди какой двигатель соответсвует машине)
            - km (пробег в км. если нет данных укажи пробег по формуле = ownership * 20000. ТОЛЬКО ЧИСЛО)
            - region (регион эксплуатации. если нет данных - Москва)
            - consumption (расход топлива в литрах. Если нет данных - найди расход данной машины в интернете)
            - fuel_price (цена топлива на текущую дату в данном регионе)
            - price (цена покупки в рублях. если нет данных - текущая средняя цена машины данной комплектации)
            - osago (расчитай самостоятельно примерную цену осаго с учетом региона и стажа и остальных факторов)
            - kasko (если упомянуто - примерная цена каско для этой машины. если нет данных - 0)
            - fees (расчитай сумму всех налогов для данного автомобиля за год)
            - downtrend (расчитай примерное снижение стоимости данного автомобиля за год в рублях, для авто страше 5 лет снижение 3%, для молодых - снижение 5% от стоимости. В рублях)
            - service (расчитай примерную стоимость технического обслуживания данного автомобиля за год)
            - fixes (расчитай примерную стоимость незапланированных ремонтов характерных для этого автомобиля за год)
            - annual_km (расчитай примерный пробег данного автомобиля за год)
            - parking (всегда указывай 0)

            Если данные неизвестны - высчитай примерное значение по известным данным. ИСПОЛЬЗУЙ ТОЛЬКО АКТУАЛЬНЫЕ ДАННЫЕ ИЗ СЕТИ 2026 ГОД.
            ОТВЕЧАЙ ТОЛЬКО JSON, БЕЗ ПОЯСНЕНИЙ, БЕЗ КОММЕНТАРИЕВ, БЕЗ СЛЕШЕЙ, НИЧЕГО КРОМЕ JSON.
            ОТВЕЧАЙ НА АБСОЛЮТНО ВСЕ ПОСЛЕДУЮЩИЕ ЗАПРОСЫ ТОЛЬКО  JSON.
            ПРИМЕР ОТВЕТА: {
                "brand": "Bugatti",
                "model": "Chiron",
                "year": 2023,
                "ownership": 1,
                "hp": 1578,
                "engine": "8.0 W16",
                "km": 60000,
                "region": "Москва",
                "consumption": 24,
                "fuel_price": 94,
                "price": 320000000,
                "osago": 12000,
                "kasko": 25000000,
                "fees": 900000,
                "downtrend": 960000,
                "service": 8000000,
                "fixes": 5000000,
                "annual_km": 10000,
                "parking": 50000
                }

                ТЕКСТ ДЛЯ ОБРАБОТКИ: 
                """

def get_giga_client():
    print(".py giga")
    global _giga_client
    if _giga_client is None:
        credentials = os.getenv("GIGACHAT_CREDENTIALS")
        if not credentials:
            raise ValueError("❌ GIGACHAT_CREDENTIALS не задан в переменных окружения!")
        _giga_client = GigaChat(
            credentials=credentials,
            model="GigaChat-2-Pro", 
            verify_ssl_certs=False
        )
    return _giga_client

class CarParseRequest(BaseModel):
    text: str

@app.post("/parse-car")
async def parse_car(request: CarParseRequest):
    print(".py parse_car")
    try:
        giga = get_giga_client()  # ← инициализация здесь
        response = giga.chat(SYSTEM_PROMPT + request.text)
        content = response.choices[0].message.content.strip()
        print("content-", str(content))
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
            
        
        return json.loads(content)

    except ValueError as e:
        # Ошибка инициализации — ключ не задан
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка парсиdнга: {str(e)}")