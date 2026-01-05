// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Состояние приложения
let currentCarData = null;
let tcoResults = null;
let expensesChart = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log("init...:");

    // Обработчик кнопки распознавания
    const parseBtn = document.getElementById('parse-btn');
    const carInput = document.getElementById('car-input');
    
    parseBtn.addEventListener('click', handleParseCar);
    carInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleParseCar();
        }
    });
    
    // Обработчик кнопки расчета
    document.getElementById('calculate-btn').addEventListener('click', handleCalculate);
    
    // Обработчик кнопки назад
    document.getElementById('back-btn').addEventListener('click', function() {
        showInputSection();
    });

    const likeBtn = document.getElementById('like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            tg.HapticFeedback.impactOccurred('light');
        });
    }
    
    // Настройка Telegram кнопки
    tg.MainButton.hide();
}


async function getCarData(inputText) {
    console.log("🔄 getCarData вызван с текстом:", inputText);
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
        console.log("🔄 getCarData rescponce:", aiData);
        return {
            brand: aiData.brand || "Lada",
            model: aiData.model || "Granta",
            year: aiData.year || 0,
            hp: aiData.hp || 0,
            consumption: aiData.consumption || 0,
            km: aiData.km || 0,
            price: aiData.price || 0,
            engine: aiData.engine || 0,
            region: aiData.region || 0,
            kasko: aiData.kasko || 0,
            ownership: aiData.ownership || 0,
            fuel_price: aiData.fuel_price || 0,
            osago: aiData.osago || 0,
            fees: aiData.fees || 0,
            downtrend: aiData.downtrend || 0,
            service: aiData.service || 0,
            fixes: aiData.fixes || 0
        };

    } catch (error) {
        console.error("Ошибка в getCarData:", error);
        return null;
    }
}


// Обработка распознавания автомобиля
async function handleParseCar() {
    console.log("func: handleParseCar");

    const input = document.getElementById('car-input').value.trim();
    
    if (!input) {
        tg.showAlert('Введите описание автомобиля');
        tg.HapticFeedback.impactOccurred('light');
        return;
    }
    try {
        console.log("func: handleParseCar/ start parse");
        const carData = await getCarData(input);
        console.log("Данные от бэкенда:", carData);
        console.log("func: handleParseCar/ end parse");
        fillCarForm(carData);
    } catch (error) {
        console.error(error);
        tg.showAlert('Ошибка при распознавании.');
        tg.HapticFeedback.notificationOccurred('error');
    }
}

// Заполнение формы данными автомобиля
function fillCarForm(carData) {
    console.log("func: fillCarForm");

    document.getElementById('brand').value = carData.brand;
    document.getElementById('model').value = carData.model;
    document.getElementById('year').value = carData.year;
    document.getElementById('hp').value = carData.hp;
    document.getElementById('engine').value = carData.engine;
    document.getElementById('consumption').value = carData.consumption;
    document.getElementById('km').value = carData.km;
    document.getElementById('annual_km').value = carData.annual_km;
    document.getElementById('ownership').value = carData.ownership;
    document.getElementById('price').value = carData.price;
    document.getElementById('parking').value = carData.parking;
    document.getElementById('region').value = carData.region;
    document.getElementById('fuel_price').value = carData.fuel_price;
    document.getElementById('osago').value = carData.osago;
    document.getElementById('kasko').value = carData.kasko;
    document.getElementById('fees').value = carData.fees;
    document.getElementById('downtrend').value = carData.downtrend;
    document.getElementById('service').value = carData.service;
    document.getElementById('fixes').value = carData.fixes;

    
    document.getElementById('car-details-card').style.display = 'block';

}

// Обработка расчета TCO
function handleCalculate() {
    console.log("func: handleCalculate");

    currentCarData = {
        brand: document.getElementById('brand').value.trim(),
        model: document.getElementById('model').value.trim(),
        year: parseInt(document.getElementById('year').value) || 0,
        hp: parseInt(document.getElementById('hp').value) || 0,
        engine: parseFloat(document.getElementById('engine').value) || 0,
        consumption: parseFloat(document.getElementById('consumption').value) || 0,
        km: parseInt(document.getElementById('km').value) || 0,
        annual_km: parseInt(document.getElementById('annual_km').value) || 0,
        ownership: parseInt(document.getElementById('ownership').value) || 0,
        price: parseFloat(document.getElementById('price').value) || 0,
        parking: parseFloat(document.getElementById('parking').value) || 0,
        region: document.getElementById('region').value.trim(),
        fuel_price: parseFloat(document.getElementById('fuel_price').value) || 0,
        osago: parseFloat(document.getElementById('osago').value) || 0,
        kasko: parseFloat(document.getElementById('kasko').value) || 0,
        fees: parseFloat(document.getElementById('fees').value) || 0,
        downtrend: parseFloat(document.getElementById('downtrend').value) || 0,
        service: parseFloat(document.getElementById('service').value) || 0,
        fixes: parseFloat(document.getElementById('fixes').value) || 0
    };

    tcoResults = calculateTCO(currentCarData);
    
    if (tcoResults) {
        displayResults(tcoResults, currentCarData);
        showResultsSection();
    }
}

// Отображение результатов (адаптированная версия)
function displayResults(tcoResult, carData) {
    console.log("func: displayResults");
    
    // Рассчитываем дополнительные показатели из годового TCO
    const annualTCO = tcoResult.annualTCO || tcoResult; // поддержка и числа и объекта
    const monthlyTCO = Math.round(annualTCO / 12);
    const costPerKm = carData.annual_km > 0 ? 
                     Math.round((annualTCO / carData.annual_km) * 100) / 100 : 0;
    const totalTCO = annualTCO * (carData.ownership || 1);
    
    // Создаем структурированный объект результатов
    const results = {
        costPerKm: costPerKm,
        costPerMonth: monthlyTCO,
        costPerYear: annualTCO,
        total: totalTCO,
        // Разбиваем на категории (примерная пропорция)
        breakdown: {
            fuel: Math.round((carData.annual_km / 100) * carData.consumption * carData.fuel_price),
            insurance: Math.round(carData.osago + carData.kasko),
            tax: Math.round(carData.fees),
            maintenance: Math.round(carData.service + carData.fixes),
            depreciation: Math.round(carData.downtrend),
            parking: Math.round(carData.parking),
            }
    };
    
    // Основные показатели
    document.getElementById('cost-per-km').textContent = formatCurrency(results.costPerKm) + '/км';
    document.getElementById('cost-per-month').textContent = formatCurrency(results.costPerMonth) + '/мес';
    document.getElementById('cost-per-year').textContent = formatCurrency(results.costPerYear) + '/год';
    
    // Детализация расходов
    const breakdown = results.breakdown;
    const expensesDetail = document.getElementById('expenses-detail');
    expensesDetail.innerHTML = `
        <div class="expense-item">
            <span class="expense-label">⛽ Топливо:</span>
            <span class="expense-value">${formatCurrency(breakdown.fuel)}</span>
        </div>
        <div class="expense-item">
            <span class="expense-label">🛡️ Страховка:</span>
            <span class="expense-value">${formatCurrency(breakdown.insurance)}</span>
        </div>
        <div class="expense-item">
            <span class="expense-label">📋 Налоги:</span>
            <span class="expense-value">${formatCurrency(breakdown.tax)}</span>
        </div>
        <div class="expense-item">
            <span class="expense-label">🔧 ТО и ремонт:</span>
            <span class="expense-value">${formatCurrency(breakdown.maintenance)}</span>
        </div>
        <div class="expense-item">
            <span class="expense-label">📉 Снижение стоимости:</span>
            <span class="expense-value">${formatCurrency(breakdown.depreciation)}</span>
        </div>
        <div class="expense-item">
            <span class="expense-label">🅿️ Парковка:</span>
            <span class="expense-value">${formatCurrency(breakdown.parking)}</span>
        </div>
        <div class="expense-total">
            <span class="expense-label">💰 Итого в год:</span>
            <span class="expense-value">${formatCurrency(results.costPerYear)}</span>
        </div>
    `;
    
    // График (если функция есть)
    if (typeof drawExpensesChart === 'function') {
        drawExpensesChart(breakdown);
    }
    
    // Сравнение с аналогами (если функция есть)
    if (typeof getAverageTCO === 'function') {
        const avgTCO = getAverageTCO(carData);
        const difference = avgTCO.costPerKm > 0 ? 
            ((results.costPerKm - avgTCO.costPerKm) / avgTCO.costPerKm) * 100 : 0;
        const comparison = document.getElementById('comparison');
        
        let comparisonText = '';
        if (Math.abs(difference) < 5) {
            comparisonText = `Ваш TCO примерно соответствует среднему показателю для автомобилей этого класса.`;
        } else if (difference > 0) {
            comparisonText = `Ваш TCO на ${difference.toFixed(1)}% выше среднего для ${carData.brand} ${carData.model} ${carData.year} в вашем регионе.`;
        } else {
            comparisonText = `Ваш TCO на ${Math.abs(difference).toFixed(1)}% ниже среднего для ${carData.brand} ${carData.model} ${carData.year} в вашем регионе. Отличный результат! 🎉`;
        }
        
        comparison.innerHTML = `
            <div class="comparison-text">${comparisonText}</div>
            <div class="comparison-stats">
                <div class="stat-item">
                    <div class="stat-label">Ваш TCO</div>
                    <div class="stat-value">${formatCurrency(results.costPerKm)}/км</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Средний TCO</div>
                    <div class="stat-value">${formatCurrency(avgTCO.costPerKm)}/км</div>
                </div>
            </div>
        `;




        document.getElementById('vis-brand').textContent = carData.brand || '-';
        document.getElementById('vis-model').textContent = carData.model || '-';
        document.getElementById('vis-year').textContent = carData.year || '-';
        document.getElementById('vis-engine').textContent = carData.engine || '-';
        document.getElementById('vis-hp').textContent = (carData.hp || '-') + ' л.с.';
        document.getElementById('vis-price').textContent = carData.price ? 
            formatCurrency(carData.price) : '-';
        
        // ЗАГОЛОВОК
        document.getElementById('car-title').textContent = 
            `${carData.brand || ''} ${carData.model || ''}`.trim() || 'Автомобиль';
        
        // ФОТОГРАФИЯ
        const carImage = document.getElementById('car-image');
        const placeholder = document.getElementById('car-image-placeholder');
        
        if (carData.brand && carData.model && carData.year) {
            // Формируем имя файла без пробелов
            const imageName = `pic${carData.brand}${carData.model}${carData.year}.jpg`
                .toLowerCase()
                .replace(/\s+/g, '');
            
            // Плейсхолдер с текстом
            carImage.src = `static/picOpelAstra2011.jpg`;
            carImage.alt = `${carData.brand} ${carData.model} ${carData.year}`;
            carImage.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            carImage.style.display = 'none';
            placeholder.style.display = 'flex';
        }
    }
    
    // Дополнительная информация
    const additionalInfo = document.getElementById('additional-info');
    if (additionalInfo) {
        additionalInfo.innerHTML = `
            <div class="info-section">
                <h4>📊 Сводка</h4>
                <p>Годовой пробег: <strong>${carData.annual_km.toLocaleString('ru-RU')} км</strong></p>
                <p>Срок владения: <strong>${carData.ownership} лет</strong></p>
                <p>Общие затраты за весь период: <strong>${formatCurrency(results.total)}</strong></p>
            </div>
        `;
    }
}

// Вспомогательная функция форматирования валюты
function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Рисование графика расходов
function drawExpensesChart(breakdown) {
    const ctx = document.getElementById('expenses-chart').getContext('2d');
    
    // Уничтожаем предыдущий график, если есть
    if (expensesChart) {
        expensesChart.destroy();
    }
    
    const labels = ['Топливо', 'Страховка', 'Налоги', 'ТО и ремонт', 'Снижение стоимости', 'Парковка'];
    const values = [
        breakdown.fuel,
        breakdown.insurance,
        breakdown.tax,
        breakdown.maintenance,
        breakdown.depreciation,
        breakdown.parking
    ];
    
    expensesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40',
                    '#FF6384'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return context.label + ': ' + formatCurrency(value) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Показать секцию ввода
function showInputSection() {
    document.getElementById('input-section').style.display = 'block';
    document.getElementById('results-section').style.display = 'none';
    tg.MainButton.hide();
}

// Показать секцию результатов
function showResultsSection() {
    document.getElementById('input-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
    tg.MainButton.setText('Новый расчет');
    tg.MainButton.show();
    
    tg.MainButton.onClick(function() {
        showInputSection();
        tg.MainButton.hide();
    });
}

// Форматирование валюты
function formatCurrency(value) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Настройка цветовой схемы Telegram
if (tg.colorScheme === 'dark') {
    document.body.classList.add('dark-theme');
}
