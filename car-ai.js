// Модуль для ИИ-парсинга описания автомобиля и получения данных

// База данных автомобилей (упрощенная версия, в реальности можно использовать API)
const carDatabase = {
    'opel': {
        'astra': {
            'j': {
                '2011': {
                    '1.6': {
                        '115': {
                            brand: 'Opel',
                            model: 'Astra J',
                            year: 2011,
                            power: 115,
                            engineType: 'petrol',
                            fuelConsumption: 7.5,
                            avgPrice: 450000,
                            avgMileage: 220000
                        }
                    }
                }
            }
        }
    },
    'toyota': {
        'camry': {
            '2020': {
                '2.5': {
                    '181': {
                        brand: 'Toyota',
                        model: 'Camry',
                        year: 2020,
                        power: 181,
                        engineType: 'petrol',
                        fuelConsumption: 8.2,
                        avgPrice: 2500000,
                        avgMileage: 60000
                    }
                }
            }
        }
    },
    'lada': {
        'granta': {
            '2020': {
                '1.6': {
                    '90': {
                        brand: 'Lada',
                        model: 'Granta',
                        year: 2020,
                        power: 90,
                        engineType: 'petrol',
                        fuelConsumption: 7.8,
                        avgPrice: 600000,
                        avgMileage: 80000
                    }
                }
            }
        }
    }
};


// В app.js
function getCarData(inputText) {
    try {
        const response = fetch('https://default00xd.github.io/telegram-mini-app/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: inputText })
        });

        if (!response.ok) {
            throw new Error('Не удалось распознать автомобиль');
        }

        const aiData = response.json(); // данные от extract_car_data()

        // Преобразуем в формат, который ожидает fillCarForm
        return {
            brand: aiData.brand || null,
            model: aiData.model || null,
            year: aiData.year || null,
            hp: aiData.hp || null,              // hp → power
            consumption: aiData.consumption || null, // consuption → fuelConsumption
            km: aiData.km || null,         // km → avgMileage
            price: aiData.price || null,         // price → avgPrice
            engine: aiData.engine || null,
            region: aiData.region || null,
            kasko: aiData.kasko || null,
        };

    } catch (error) {
        console.error("Ошибка в getCarData:", error);
        // Возвращаем пустой объект, как при неудаче
        return {
            brand: null,
            model: null,
            year: null,
            power: null,
            consumption: null,
            km: null,
            price: null
        };
    }
}