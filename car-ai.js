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

// Функция парсинга текстового описания автомобиля
function parseCarDescription(text) {
    if (!text || text.trim() === '') {
        return null;
    }

    const lowerText = text.toLowerCase().trim();
    
    // Извлечение года (4 цифры)
    const yearMatch = lowerText.match(/\b(19\d{2}|20\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : null;
    
    // Извлечение мощности (число + hp или л.с.)
    const powerMatch = lowerText.match(/(\d+)\s*(?:hp|л\.?с\.?|лс)/i);
    const power = powerMatch ? parseInt(powerMatch[1]) : null;
    
    // Извлечение объема двигателя (число.число или число)
    const engineMatch = lowerText.match(/(\d+\.?\d*)\s*(?:л|л\.)/i);
    const engineVolume = engineMatch ? parseFloat(engineMatch[1]) : null;
    
    // Попытка найти марку и модель
    let brand = null;
    let model = null;
    
    // Список популярных марок
    const brands = ['opel', 'toyota', 'lada', 'bmw', 'mercedes', 'audi', 'volkswagen', 
                    'ford', 'chevrolet', 'nissan', 'honda', 'hyundai', 'kia', 'skoda',
                    'renault', 'peugeot', 'citroen', 'mazda', 'subaru', 'lexus'];
    
    for (const b of brands) {
        if (lowerText.includes(b)) {
            brand = b;
            // Пытаемся найти модель после марки
            const brandIndex = lowerText.indexOf(b);
            const afterBrand = lowerText.substring(brandIndex + b.length).trim();
            const words = afterBrand.split(/\s+/);
            if (words.length > 0) {
                model = words[0];
            }
            break;
        }
    }
    
    // Если не нашли в списке, берем первое слово как марку
    if (!brand) {
        const words = lowerText.split(/\s+/);
        brand = words[0] || null;
        model = words[1] || null;
    }
    
    // Определение типа двигателя по описанию
    let engineType = 'petrol';
    if (lowerText.includes('дизел') || lowerText.includes('diesel') || lowerText.includes('tdi')) {
        engineType = 'diesel';
    } else if (lowerText.includes('гибрид') || lowerText.includes('hybrid')) {
        engineType = 'hybrid';
    } else if (lowerText.includes('электр') || lowerText.includes('electric') || lowerText.includes('ev')) {
        engineType = 'electric';
    }
    
    return {
        brand: brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : null,
        model: model ? model.charAt(0).toUpperCase() + model.slice(1) : null,
        year: year,
        power: power,
        engineVolume: engineVolume,
        engineType: engineType
    };
}

// Функция получения данных из базы данных
function getCarData(parsedData) {
    if (!parsedData) return null;
    
    const brand = parsedData.brand?.toLowerCase();
    const model = parsedData.model?.toLowerCase();
    const year = parsedData.year;
    const power = parsedData.power;
    
    // Попытка найти точное совпадение
    if (brand && model && year && power && carDatabase[brand]?.[model]?.[year]?.[power]) {
        return carDatabase[brand][model][year][power];
    }
    
    // Если точного совпадения нет, используем эвристики
    const currentYear = new Date().getFullYear();
    const age = year ? currentYear - year : 5;
    
    // Расчет примерного пробега (20000 км в год)
    const estimatedMileage = age * 20000;
    
    // Расчет примерной цены (упрощенная формула)
    const basePrice = power ? power * 5000 : 500000;
    const depreciation = basePrice * (age * 0.15); // 15% в год
    const estimatedPrice = Math.max(basePrice - depreciation, 100000);
    
    // Расчет расхода топлива (зависит от мощности и типа двигателя)
    let fuelConsumption = 8.0; // базовый расход
    if (parsedData.engineType === 'diesel') {
        fuelConsumption = 6.5;
    } else if (parsedData.engineType === 'hybrid') {
        fuelConsumption = 5.0;
    } else if (parsedData.engineType === 'electric') {
        fuelConsumption = 0;
    }
    
    if (power) {
        if (power < 100) fuelConsumption -= 1.0;
        else if (power > 200) fuelConsumption += 1.5;
    }
    
    return {
        brand: parsedData.brand,
        model: parsedData.model,
        year: year,
        power: power,
        engineType: parsedData.engineType,
        fuelConsumption: fuelConsumption,
        avgPrice: estimatedPrice,
        avgMileage: estimatedMileage
    };
}

// Экспорт функций
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseCarDescription, getCarData };
}

