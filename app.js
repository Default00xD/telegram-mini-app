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
    
    // Настройка Telegram кнопки
    tg.MainButton.hide();
}

// Обработка распознавания автомобиля
async function handleParseCar() {
    const input = document.getElementById('car-input').value.trim();
    
    if (!input) {
        tg.showAlert('Введите описание автомобиля');
        tg.HapticFeedback.impactOccurred('light');
        return;
    }
    
    tg.HapticFeedback.impactOccurred('medium');
    tg.showPopup({
        title: 'Распознавание...',
        message: 'Анализирую описание автомобиля',
        buttons: [{ type: 'close' }]
    });
    
    try {
        const carData = await getCarData(input);
        
        if (carData) {
            fillCarForm(carData);
            tg.showAlert('Автомобиль распознан! ✅');
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            tg.showAlert('Не удалось распознать. Заполните поля вручную.');
            tg.HapticFeedback.notificationOccurred('error');
        }
    } catch (error) {
        console.error(error);
        tg.showAlert('Ошибка при распознавании.');
        tg.HapticFeedback.notificationOccurred('error');
    }
}

// Заполнение формы данными автомобиля
function fillCarForm(carData) {
    document.getElementById('brand').value = carData.brand || '';
    document.getElementById('model').value = carData.model || '';
    document.getElementById('year').value = carData.year || new Date().getFullYear();
    document.getElementById('hp').value = carData.hp || '';
    document.getElementById('engine').value = carData.engine || '';
    document.getElementById('consumption').value = carData.consumption?.toFixed(1) || '10.0';
    
    // Расчет пробега
    const currentYear = new Date().getFullYear();
    const carAge = carData.year ? currentYear - carData.year : 0;
    const estimatedMileage = carAge * 20000;
    document.getElementById('km').value = carData.km || estimatedMileage;
    
    document.getElementById('annual-mileage').value = 20000;
    document.getElementById('ownership-years').value = 1;
    document.getElementById('price').value = carData.price || '';
    document.getElementById('parking-cost').value = 0;
    
    // Показываем карточку с деталями
    document.getElementById('car-details-card').style.display = 'block';
    
    // Сохраняем данные
    currentCarData = {
        ...carData,
        region: document.getElementById('region').value,
        ownershipYears: parseInt(document.getElementById('ownership-years').value),
        annualMileage: parseInt(document.getElementById('annual-mileage').value)
    };
}

// Обработка расчета TCO
function handleCalculate() {
    // Собираем данные из формы
    const carData = {
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        year: parseInt(document.getElementById('year').value),
        power: parseInt(document.getElementById('power').value),
        engineType: document.getElementById('engine-type').value,
        fuelConsumption: parseFloat(document.getElementById('fuel-consumption').value),
        mileage: parseInt(document.getElementById('mileage').value),
        annualMileage: parseInt(document.getElementById('annual-mileage').value),
        region: document.getElementById('region').value,
        ownershipYears: parseInt(document.getElementById('ownership-years').value),
        purchasePrice: parseInt(document.getElementById('purchase-price').value),
        parkingCost: parseInt(document.getElementById('parking-cost').value)
    };
    
    // Валидация
    if (!carData.brand || !carData.model || !carData.year) {
        tg.showAlert('Заполните основные данные об автомобиле');
        return;
    }
    
    if (!carData.purchasePrice || carData.purchasePrice <= 0) {
        tg.showAlert('Укажите цену покупки');
        return;
    }
    
    tg.HapticFeedback.impactOccurred('medium');
    
    // Расчет TCO
    currentCarData = carData;
    tcoResults = calculateTCO(carData);
    
    if (tcoResults) {
        displayResults(tcoResults, carData);
        showResultsSection();
    }
}

// Отображение результатов
function displayResults(results, carData) {
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
            <span class="expense-label">📉 Амортизация:</span>
            <span class="expense-value">${formatCurrency(breakdown.depreciation)}</span>
        </div>
        <div class="expense-item">
            <span class="expense-label">🅿️ Парковка:</span>
            <span class="expense-value">${formatCurrency(breakdown.parking)}</span>
        </div>
        <div class="expense-item">
            <span class="expense-label">📌 Прочее:</span>
            <span class="expense-value">${formatCurrency(breakdown.other)}</span>
        </div>
        <div class="expense-total">
            <span class="expense-label">💰 Итого:</span>
            <span class="expense-value">${formatCurrency(results.total)}</span>
        </div>
    `;
    
    // График
    drawExpensesChart(breakdown);
    
    // Сравнение с аналогами
    const avgTCO = getAverageTCO(carData);
    const difference = ((results.costPerKm - avgTCO.costPerKm) / avgTCO.costPerKm) * 100;
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
}

// Рисование графика расходов
function drawExpensesChart(breakdown) {
    const ctx = document.getElementById('expenses-chart').getContext('2d');
    
    // Уничтожаем предыдущий график, если есть
    if (expensesChart) {
        expensesChart.destroy();
    }
    
    const labels = ['Топливо', 'Страховка', 'Налоги', 'ТО', 'Амортизация', 'Парковка', 'Прочее'];
    const values = [
        breakdown.fuel,
        breakdown.insurance,
        breakdown.tax,
        breakdown.maintenance,
        breakdown.depreciation,
        breakdown.parking,
        breakdown.other
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
