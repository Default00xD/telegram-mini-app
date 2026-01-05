// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional


// Initialize Firebase


class CarStorage {
    constructor() {
        this.userId = this.getOrCreateUserId();
        this.STORAGE_KEY = 'user_cars_v1';
        this.firebaseInitialized = false;
        this.isTelegram = !!(window.Telegram && window.Telegram.WebApp);
        
        // Конфигурация Firebase (ЗАМЕНИТЕ НА СВОЮ!)
        this.firebaseConfig = {
            apiKey: "AIzaSyDwbPDXG5_PPHho1jNbjMe7IZqlOwEDhTA",
            authDomain: "mr-lab6.firebaseapp.com",
            databaseURL: "https://mr-lab6-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "mr-lab6",
            storageBucket: "mr-lab6.firebasestorage.app",
            messagingSenderId: "544827431054",
            appId: "1:544827431054:web:4458511ad7ffeca890d1df",
            measurementId: "G-Z82RPL01PN"
        };
        this.initFirebase();
    }

    // Генерация/получение UserID
    getOrCreateUserId() {
        let userId = localStorage.getItem('car_storage_user_id');
        
        if (!userId) {
            // Если в Telegram - используем Telegram ID
            if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
                userId = 'tg_' + window.Telegram.WebApp.initDataUnsafe.user.id;
            } else {
                // Генерируем случайный ID
                userId = 'user_' + Math.random().toString(36).substr(2, 9);
            }
            localStorage.setItem('car_storage_user_id', userId);
        }
        
        return userId;
    }

    // Инициализация Firebase
    async initFirebase() {
        try {
            // Проверяем, не инициализирован ли Firebase уже
            if (typeof firebase === 'undefined') {
                console.warn("Firebase not loaded");
                return false;
            }
            
            // Инициализируем Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
            }
            
            this.db = firebase.firestore();
            this.firebaseInitialized = true;
            
            console.log("🔥 Firebase initialized successfully");
            return true;
        } catch (error) {
            console.error("❌ Firebase init error:", error);
            this.firebaseInitialized = false;
            return false;
        }
    }

    // ========== FIRESTORE МЕТОДЫ ==========

    // Получить данные пользователя из Firestore
    async getFromFirestore() {
        if (!this.firebaseInitialized || !this.db) {
            return null;
        }

        try {
            const docRef = this.db.collection('users').doc(this.userId);
            const doc = await docRef.get();
            
            if (doc.exists) {
                console.log("🔥 Firestore data found:", doc.data());
                return doc.data();
            } else {
                console.log("🔥 No data in Firestore, returning null");
                return null;
            }
        } catch (error) {
            console.error("❌ Firestore get error:", error);
            return null;
        }
    }

    // Сохранить данные в Firestore
    async saveToFirestore(data) {
        if (!this.firebaseInitialized || !this.db) {
            return false;
        }

        try {
            const docRef = this.db.collection('users').doc(this.userId);
            await docRef.set({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: this.userId,
                lastSync: new Date().toISOString()
            }, { merge: true });
            
            console.log("🔥 Data saved to Firestore");
            return true;
        } catch (error) {
            console.error("❌ Firestore save error:", error);
            return false;
        }
    }

    // Удалить данные из Firestore
    async deleteFromFirestore() {
        if (!this.firebaseInitialized || !this.db) {
            return false;
        }

        try {
            const docRef = this.db.collection('users').doc(this.userId);
            await docRef.delete();
            console.log("🔥 Data deleted from Firestore");
            return true;
        } catch (error) {
            console.error("❌ Firestore delete error:", error);
            return false;
        }
    }

    // ========== ГИБРИДНЫЕ МЕТОДЫ (Firestore + localStorage) ==========

    // Получить все данные (приоритет у Firestore)
    async getAllData() {
        try {
            // 1. Пытаемся получить из Firestore
            if (this.firebaseInitialized) {
                const firestoreData = await this.getFromFirestore();
                if (firestoreData) {
                    console.log("📦 Using Firestore data");
                    return this.normalizeData(firestoreData);
                }
            }
            
            // 2. Fallback: localStorage
            const localData = localStorage.getItem(this.STORAGE_KEY);
            console.log("📦 Fallback to localStorage:", localData);
            
            if (localData && localData !== 'undefined' && localData !== 'null') {
                try {
                    const parsed = JSON.parse(localData);
                    return this.normalizeData(parsed);
                } catch (e) {
                    console.warn("❌ LocalStorage parse error:", e);
                }
            }
            
            // 3. Возвращаем дефолтные данные
            return this.getDefaultData();
            
        } catch (error) {
            console.error("❌ Error in getAllData:", error);
            return this.getDefaultData();
        }
    }

    // Нормализация данных
    normalizeData(data) {
        return {
            userId: data.userId || this.userId,
            likedCars: Array.isArray(data.likedCars) ? data.likedCars : [],
            settings: data.settings || {},
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
        };
    }

    // Дефолтные данные
    getDefaultData() {
        return {
            userId: this.userId,
            likedCars: [],
            settings: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    // Сохранить все данные (в оба хранилища)
    async saveAllData(data) {
        try {
            // Нормализуем данные
            const normalizedData = this.normalizeData(data);
            const jsonString = JSON.stringify(normalizedData);
            
            console.log("💾 Saving data, size:", jsonString.length, "chars");
            
            // 1. Сохраняем в localStorage
            localStorage.setItem(this.STORAGE_KEY, jsonString);
            
            // 2. Пытаемся сохранить в Firestore
            if (this.firebaseInitialized) {
                const firestoreSuccess = await this.saveToFirestore(normalizedData);
                console.log("Firestore save:", firestoreSuccess ? "✅" : "❌");
            }
            
            // 3. Если в Telegram - сохраняем и туда (для совместимости)
            if (this.isTelegram && window.Telegram.WebApp.CloudStorage) {
                try {
                    await window.Telegram.WebApp.CloudStorage.setItem(this.STORAGE_KEY, jsonString);
                } catch (tgError) {
                    console.warn("Telegram CloudStorage error:", tgError);
                }
            }
            
            console.log("✅ Data saved successfully");
            return true;
            
        } catch (error) {
            console.error("❌ Ошибка сохранения:", error);
            return false;
        }
    }

    // ========== ОСНОВНЫЕ МЕТОДЫ ==========

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
            
            // Сортируем по дате обновления (сначала новые)
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
            // Удаляем из всех хранилищ
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem('car_storage_user_id');
            
            if (this.firebaseInitialized) {
                await this.deleteFromFirestore();
            }
            
            if (this.isTelegram && window.Telegram.WebApp.CloudStorage) {
                try {
                    await window.Telegram.WebApp.CloudStorage.removeItem(this.STORAGE_KEY);
                } catch (tgError) {
                    console.warn("Telegram remove error:", tgError);
                }
            }
            
            // Генерируем новый user ID
            this.userId = this.getOrCreateUserId();
            
            console.log("🧹 All data cleared");
            return { success: true };
        } catch (error) {
            console.error("❌ Ошибка очистки:", error);
            return { success: false, error };
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
                storageLimit: 'unlimited', // Firestore имеет большие лимиты
                environment: this.isTelegram ? 'Telegram' : 'Browser',
                userId: this.userId,
                firebaseAvailable: this.firebaseInitialized,
                firestoreEnabled: true,
                syncStatus: this.firebaseInitialized ? 'active' : 'local-only'
            };
        } catch (error) {
            return {
                totalCars: 0,
                environment: 'Error',
                error: error.message
            };
        }
    }

    // Синхронизация данных
    async syncData() {
        try {
            console.log("🔄 Starting data sync...");
            
            // Получаем локальные данные
            const localData = localStorage.getItem(this.STORAGE_KEY);
            const localParsed = localData ? JSON.parse(localData) : null;
            
            // Получаем данные из Firestore
            const firestoreData = await this.getFromFirestore();
            
            if (!firestoreData && localParsed) {
                // Если в Firestore нет данных, но есть локально - сохраняем в Firestore
                console.log("⬆️ Uploading local data to Firestore");
                await this.saveToFirestore(localParsed);
                return { action: 'uploaded', success: true };
            } else if (firestoreData && localParsed) {
                // Сравниваем даты обновления
                const firestoreDate = new Date(firestoreData.updatedAt || 0);
                const localDate = new Date(localParsed.updatedAt || 0);
                
                if (firestoreDate > localDate) {
                    // Firestore новее - загружаем оттуда
                    console.log("⬇️ Downloading from Firestore (newer)");
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(firestoreData));
                    return { action: 'downloaded', success: true };
                } else if (localDate > firestoreDate) {
                    // Локальные данные новее - сохраняем в Firestore
                    console.log("⬆️ Uploading to Firestore (local newer)");
                    await this.saveToFirestore(localParsed);
                    return { action: 'uploaded', success: true };
                } else {
                    // Данные одинаковые
                    console.log("✅ Data already in sync");
                    return { action: 'already-synced', success: true };
                }
            }
            
            return { action: 'no-action', success: true };
            
        } catch (error) {
            console.error("❌ Sync error:", error);
            return { success: false, error: error.message };
        }
    }
}

// Создаем экземпляр только если его еще нет
if (typeof window.carStorage === 'undefined') {
    window.carStorage = new CarStorage();
    console.log("🚀 CarStorage with Firebase initialized");
    
    // Тестовая функция
    window.testStorage = async function() {
        console.log("🧪 Testing storage...");
        const stats = await carStorage.getStorageStats();
        console.log("📊 Storage stats:", stats);
        
        // Тест синхронизации
        const syncResult = await carStorage.syncData();
        console.log("🔄 Sync result:", syncResult);
        
        // Добавляем тестовую машину
        const testCar = {
            brand: "Test",
            model: "Car",
            year: 2024,
            price: 1000000,
            color: "red"
        };
        
        const saveResult = await carStorage.saveLikedCar(testCar);
        console.log("💾 Save test result:", saveResult);
        
        const cars = await carStorage.getLikedCars();
        console.log("📚 Cars in storage:", cars);
        
        return { stats, syncResult, saveResult, cars };
    };
}