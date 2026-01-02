from gigachat import GigaChat
import json
import os
from dotenv import load_dotenv
load_dotenv()  # загружает переменные из .env


giga = GigaChat(credentials=os.getenv("GIGACHAT_CREDENTIALS"),
    model='GigaChat-2',
    verify_ssl_certs=False)


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

        Если данные неизвестны — поставь None. Данные могут идти не по порядку, сам определи что к чему больше относится.
        Отвечай ТОЛЬКО JSON, без пояснений.

        Текст: {user_input}
                """

    try:
        response = giga.chat(prompt)
        content = response.choices[0].message.content.strip()

        # Очищаем от ```json, если есть
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]

        return json.loads(content)

    except Exception as e:
        print(f"Ошибка GigaChat: {e}")
        return None

