// storage.js
class CarStorage {
    constructor() {
        this.userId = 'user_' + (Math.random().toString(36).substr(2, 9));
        this.STORAGE_KEY = 'user_cars_v1';
        this.isTelegram = this.checkTelegramEnvironment();
    }

    // Проверяем, запущены ли в Telegram
    checkTelegramEnvironment() {
        return !!(window.Telegram && window.Telegram.WebApp && 
                 window.Telegram.WebApp.initDataUnsafe);
    }

    // Универсальный метод получения данных - ФИКС ВОТ ЗДЕСЬ
    async getItem(key) {
        if (this.isTelegram && window.Telegram.WebApp.CloudStorage) {
            try {
                const result = await window.Telegram.WebApp.CloudStorage.getItem(key);
                
                // Telegram может вернуть объект или строку
                if (typeof result === 'object' && result !== null) {
                    // Если это объект {key: value}, берем значение
                    if (result[key]) {
                        return result[key];
                    }
                    // Или если это просто объект, преобразуем в строку
                    return JSON.stringify(result);
                }
                
                return result; // это строка или undefined
                
            } catch (error) {
                console.warn("Telegram CloudStorage error, fallback to localStorage:", error);
                return localStorage.getItem(key);
            }
        } else {
            // Fallback для браузера или старого Telegram
            return localStorage.getItem(key);
        }
    }

    // Универсальный метод сохранения данных
    async setItem(key, value) {
        if (this.isTelegram && window.Telegram.WebApp.CloudStorage) {
            try {
                await window.Telegram.WebApp.CloudStorage.setItem(key, value);
                // Дублируем в localStorage для надежности
                localStorage.setItem(key, value);
            } catch (error) {
                console.warn("Telegram CloudStorage error, fallback to localStorage:", error);
                localStorage.setItem(key, value);
            }
        } else {
            localStorage.setItem(key, value);
        }
    }

    // ========== ОСНОВНЫЕ МЕТОДЫ (ИСПРАВЛЕННЫЕ) ==========

    // Получить все данные - ФИКС ПАРСИНГА
    async getAllData() {
        try {
            const stored = await this.getItem(this.STORAGE_KEY);
            
            console.log("📦 Raw storage data:", stored, "Type:", typeof stored);
            
            // Если ничего нет
            if (!stored || stored === 'undefined' || stored === 'null') {
                return this.getDefaultData();
            }
            
            // Если это уже объект (Telegram вернул объект)
            if (typeof stored === 'object') {
                console.log("📦 Telegram returned object, using as is");
                return stored.likedCars ? stored : this.getDefaultData();
            }
            
            // Пытаемся распарсить строку
            try {
                const parsed = JSON.parse(stored);
                return parsed.likedCars ? parsed : this.getDefaultData();
            } catch (parseError) {
                console.error("❌ JSON parse error:", parseError, "Data:", stored);
                
                // Пробуем очистить строку
                const cleaned = this.tryFixJson(stored);
                if (cleaned) {
                    return cleaned;
                }
                
                return this.getDefaultData();
            }
            
        } catch (error) {
            console.error("❌ Ошибка в getAllData:", error);
            return this.getDefaultData();
        }
    }

    // Дефолтные данные
    getDefaultData() {
        return {
            userId: this.userId,
            likedCars: [],
            settings: {},
            createdAt: new Date().toISOString()
        };
    }

    // Попытка починить сломанный JSON
    tryFixJson(brokenJson) {
        try {
            // Убираем лишние кавычки
            let fixed = brokenJson
                .replace(/^"{/, '{')
                .replace(/}"$/, '}')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
            
            return JSON.parse(fixed);
        } catch (error) {
            console.warn("Не удалось починить JSON");
            return null;
        }
    }

    // Сохранить все данные
    async saveAllData(data) {
        try {
            // Всегда сохраняем как строку JSON
            const jsonString = JSON.stringify(data);
            
            console.log("💾 Saving data, size:", jsonString.length, "chars");
            
            // Проверяем размер
            if (jsonString.length > 4000) {
                console.warn("⚠️ Данные почти достигли лимита!", jsonString.length);
                data.likedCars = data.likedCars.slice(-20);
            }
            
            await this.setItem(this.STORAGE_KEY, jsonString);
            console.log("✅ Data saved successfully");
            return true;
            
        } catch (error) {
            console.error("❌ Ошибка сохранения:", error);
            return false;
        }
    }

    // Сохранить лайкнутую машину
    async saveLikedCar(carData) {
        console.log("💾 Saving liked car:", carData);
        
        try {
            const allData = await this.getAllData();
            const carId = this.generateCarId(carData);
            
            console.log("📋 Current liked cars:", allData.likedCars.length);
            
            const existingIndex = allData.likedCars.findIndex(car => car.id === carId);
            
            if (existingIndex >= 0) {
                // Обновляем существующую
                allData.likedCars[existingIndex] = {
                    ...allData.likedCars[existingIndex],
                    ...carData,
                    updatedAt: new Date().toISOString()
                };
                console.log("✏️ Updated existing car:", carId);
            } else {
                // Добавляем новую
                allData.likedCars.push({
                    id: carId,
                    ...carData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                console.log("➕ Added new car:", carId);
            }
            
            const saved = await this.saveAllData(allData);
            return { success: saved, carId };
            
        } catch (error) {
            console.error("❌ Ошибка сохранения:", error);
            return { success: false, error: error.message };
        }
    }

    // Получить все лайкнутые машины
    async getLikedCars() {
        try {
            const data = await this.getAllData();
            console.log("📚 Retrieved liked cars:", data.likedCars.length);
            
            return data.likedCars.sort((a, b) => 
                new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
            );
        } catch (error) {
            console.error("❌ Ошибка чтения:", error);
            return [];
        }
    }

    // Удалить лайк
    async removeLikedCar(carId) {
        try {
            const data = await this.getAllData();
            const before = data.likedCars.length;
            data.likedCars = data.likedCars.filter(car => car.id !== carId);
            const after = data.likedCars.length;
            
            if (before !== after) {
                await this.saveAllData(data);
                console.log("🗑️ Removed car:", carId);
            }
            
            return { success: true, removed: before !== after };
        } catch (error) {
            console.error("❌ Ошибка удаления:", error);
            return { success: false, error };
        }
    }

    // Проверить, лайкнута ли машина
    async isCarLiked(carData) {
        try {
            const carId = this.generateCarId(carData);
            const data = await this.getAllData();
            const isLiked = data.likedCars.some(car => car.id === carId);
            console.log("🔍 Check if car is liked:", carId, "->", isLiked);
            return isLiked;
        } catch (error) {
            console.error("❌ Ошибка проверки лайка:", error);
            return false;
        }
    }

    // Генерация ID машины
    generateCarId(carData) {
        if (!carData || !carData.brand || !carData.model || !carData.year) {
            return 'unknown-' + Date.now();
        }
        return `${carData.brand.toLowerCase()}-${carData.model.toLowerCase()}-${carData.year}`
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    // Очистить все данные
    async clearAllData() {
        try {
            await this.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.STORAGE_KEY);
            console.log("🧹 All data cleared");
            return { success: true };
        } catch (error) {
            console.error("❌ Ошибка очистки:", error);
            return { success: false };
        }
    }

    // Статистика хранилища
    async getStorageStats() {
        try {
            const data = await this.getAllData();
            const jsonString = JSON.stringify(data);
            
            return {
                totalCars: data.likedCars.length,
                storageUsed: jsonString.length,
                storageLimit: 4096,
                usagePercent: Math.round((jsonString.length / 4096) * 100),
                environment: this.isTelegram ? 'Telegram' : 'Browser',
                userId: this.userId,
                hasTelegramStorage: !!(window.Telegram?.WebApp?.CloudStorage)
            };
        } catch (error) {
            return {
                totalCars: 0,
                environment: 'Error',
                error: error.message
            };
        }
    }
}

// Создаем экземпляр только если его еще нет
if (typeof window.carStorage === 'undefined') {
    window.carStorage = new CarStorage();
    console.log("🚀 CarStorage initialized");
    
    // Тестовая функция для проверки
    window.testStorage = async function() {
        console.log("🧪 Testing storage...");
        const stats = await carStorage.getStorageStats();
        console.log("📊 Storage stats:", stats);
        
        // Добавляем тестовую машину
        const testCar = {
            brand: "Test",
            model: "Car",
            year: 2024,
            price: 1000000
        };
        
        const saveResult = await carStorage.saveLikedCar(testCar);
        console.log("💾 Save test result:", saveResult);
        
        const cars = await carStorage.getLikedCars();
        console.log("📚 Cars in storage:", cars);
        
        return { stats, saveResult, cars };
    };
}