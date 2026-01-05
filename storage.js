// storage.js - создайте новый файл
class CarStorage {
    constructor() {
        this.userId = window.Telegram.WebApp.initDataUnsafe?.user?.id;
        this.STORAGE_KEY = 'user_cars_v1';
    }

    // Сохранить лайкнутую машину
    async saveLikedCar(carData) {
        try {
            // 1. Получаем текущие данные
            const allData = await this.getAllData();
            
            // 2. Создаём ID машины
            const carId = this.generateCarId(carData);
            
            // 3. Проверяем, есть ли уже
            const existingIndex = allData.likedCars.findIndex(car => car.id === carId);
            
            if (existingIndex >= 0) {
                // Обновляем существующую
                allData.likedCars[existingIndex] = {
                    ...allData.likedCars[existingIndex],
                    ...carData,
                    updatedAt: new Date().toISOString()
                };
            } else {
                // Добавляем новую
                allData.likedCars.push({
                    id: carId,
                    ...carData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            
            // 4. Сохраняем обратно
            await this.saveAllData(allData);
            
            return { success: true, carId };
            
        } catch (error) {
            console.error("Ошибка сохранения:", error);
            return { success: false, error };
        }
    }

    // Получить все лайкнутые машины
    async getLikedCars() {
        try {
            const data = await this.getAllData();
            return data.likedCars.sort((a, b) => 
                new Date(b.updatedAt) - new Date(a.updatedAt)
            );
        } catch (error) {
            console.error("Ошибка чтения:", error);
            return [];
        }
    }

    // Удалить лайк
    async removeLikedCar(carId) {
        try {
            const data = await this.getAllData();
            data.likedCars = data.likedCars.filter(car => car.id !== carId);
            await this.saveAllData(data);
            return { success: true };
        } catch (error) {
            console.error("Ошибка удаления:", error);
            return { success: false, error };
        }
    }

    // Проверить, лайкнута ли машина
    async isCarLiked(carData) {
        const carId = this.generateCarId(carData);
        const data = await this.getAllData();
        return data.likedCars.some(car => car.id === carId);
    }

    // ========== СЛУЖЕБНЫЕ МЕТОДЫ ==========
    
    async getAllData() {
        try {
            const stored = await tg.CloudStorage.getItem(this.STORAGE_KEY);
            
            if (!stored) {
                // Первый запуск - создаём структуру
                return {
                    userId: this.userId,
                    likedCars: [],
                    settings: {},
                    createdAt: new Date().toISOString()
                };
            }
            
            return JSON.parse(stored);
        } catch (error) {
            console.error("Ошибка парсинга данных:", error);
            return { likedCars: [], settings: {} };
        }
    }

    async saveAllData(data) {
        try {
            const jsonString = JSON.stringify(data);
            
            // Проверяем размер (лимит 4096 символов)
            if (jsonString.length > 4000) {
                console.warn("⚠️ Данные почти достигли лимита!", jsonString.length);
                // Удаляем старые записи
                data.likedCars = data.likedCars.slice(-20); // оставляем последние 20
            }
            
            await tg.CloudStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error("Ошибка сохранения:", error);
            return false;
        }
    }

    generateCarId(carData) {
        // Создаём уникальный ID: "toyota-camry-2015"
        return `${carData.brand?.toLowerCase()}-${carData.model?.toLowerCase()}-${carData.year}`
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    // Статистика хранилища
    async getStorageStats() {
        const data = await this.getAllData();
        const jsonString = JSON.stringify(data);
        
        return {
            totalCars: data.likedCars.length,
            storageUsed: jsonString.length,
            storageLimit: 4096,
            usagePercent: Math.round((jsonString.length / 4096) * 100),
            userId: this.userId
        };
    }
}

// Экспортируем глобальный экземпляр
const carStorage = new CarStorage();