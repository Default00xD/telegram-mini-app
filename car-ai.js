async function getCarData(inputText) {
    try {
        // 🔧 ЗАМЕНИТЕ URL на ваш
        const BACKEND_URL = 'https://telegram-mini-app-production-cf7a.up.railway.app';
        
        const response = await fetch(`${BACKEND_URL}/parse-car`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: inputText })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Ошибка сервера: ${response.status}`);
        }

        const aiData = await response.json();

        return {
            brand: aiData.brand || null,
            model: aiData.model || null,
            year: aiData.year || null,
            hp: aiData.hp || null,
            consumption: aiData.consumption || null,
            km: aiData.km || null,
            price: aiData.price || null,
            engine: aiData.engine || null,
            region: aiData.region || null,
            kasko: aiData.kasko || null,
        };

    } catch (error) {
        console.error("Ошибка в getCarData:", error);
        return null;
    }
}