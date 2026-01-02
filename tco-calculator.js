// Модуль для расчета TCO (Total Cost of Ownership)

// Цены по регионам (данные на 2024 год, примерные)
const regionalData = {
    moscow: {
        fuelPrice: {
            petrol: 55,
            diesel: 52,
            hybrid: 55,
            electric: 5.5 // руб/кВт·ч
        },
        insurance: {
            base: 15000,
            multiplier: 1.2
        },
        tax: {
            base: 2000,
            multiplier: 1.0
        },
        parking: {
            base: 3000
        }
    },
    spb: {
        fuelPrice: {
            petrol: 53,
            diesel: 50,
            hybrid: 53,
            electric: 5.2
        },
        insurance: {
            base: 12000,
            multiplier: 1.1
        },
        tax: {
            base: 1800,
            multiplier: 0.9
        },
        parking: {
            base: 2000
        }
    },
    other: {
        fuelPrice: {
            petrol: 50,
            diesel: 48,
            hybrid: 50,
            electric: 4.8
        },
        insurance: {
            base: 10000,
            multiplier: 1.0
        },
        tax: {
            base: 1500,
            multiplier: 0.8
        },
        parking: {
            base: 1000
        }
    }
};

// Расчет TCO
function calculateTCO(carData) {
    if (!carData) return null;
    
    const region = carData.region || 'moscow';
    const regionData = regionalData[region] || regionalData.moscow;
    
    const ownershipYears = carData.ownershipYears || 1;
    const annualMileage = carData.annualMileage || 20000;
    const totalMileage = annualMileage * ownershipYears;
    
    // 1. Расходы на топливо
    let fuelCost = 0;
    if (carData.engineType !== 'electric') {
        const fuelPrice = regionData.fuelPrice[carData.engineType] || regionData.fuelPrice.petrol;
        const fuelConsumption = carData.fuelConsumption || 8.0;
        fuelCost = (totalMileage / 100) * fuelConsumption * fuelPrice;
    } else {
        // Для электромобилей: расход ~20 кВт·ч на 100 км
        const electricityPrice = regionData.fuelPrice.electric;
        fuelCost = (totalMileage / 100) * 20 * electricityPrice;
    }
    
    // 2. Страховка (ОСАГО + КАСКО)
    const insuranceBase = regionData.insurance.base;
    const insuranceMultiplier = regionData.insurance.multiplier;
    const powerMultiplier = carData.power ? Math.min(carData.power / 100, 2.0) : 1.0;
    const insuranceCost = insuranceBase * insuranceMultiplier * powerMultiplier * ownershipYears;
    
    // 3. Транспортный налог
    const taxBase = regionData.tax.base;
    const taxMultiplier = regionData.tax.multiplier;
    const powerTax = carData.power ? Math.max(carData.power - 100, 0) * 5 : 0;
    const taxCost = (taxBase + powerTax) * taxMultiplier * ownershipYears;
    
    // 4. Техническое обслуживание и ремонт
    // Примерно 5-10% от стоимости автомобиля в год
    const purchasePrice = carData.purchasePrice || carData.avgPrice || 500000;
    const maintenanceCost = purchasePrice * 0.07 * ownershipYears;
    
    // 5. Амортизация
    const currentYear = new Date().getFullYear();
    const carAge = carData.year ? currentYear - carData.year : 5;
    const depreciationRate = Math.min(0.15 * ownershipYears, 0.7); // максимум 70% за все время
    const depreciationCost = purchasePrice * depreciationRate;
    
    // 6. Парковка
    const parkingCost = (carData.parkingCost || regionData.parking.base) * 12 * ownershipYears;
    
    // 7. Штрафы и прочее (примерно 5000 руб в год)
    const otherCosts = 5000 * ownershipYears;
    
    // 8. Мойка и косметика (примерно 3000 руб в год)
    const cleaningCost = 3000 * ownershipYears;
    
    // Итого
    const totalCost = fuelCost + insuranceCost + taxCost + maintenanceCost + 
                     depreciationCost + parkingCost + otherCosts + cleaningCost;
    
    // Расчет на разные периоды
    const costPerKm = totalCost / totalMileage;
    const costPerMonth = totalCost / (ownershipYears * 12);
    const costPerYear = totalCost / ownershipYears;
    
    return {
        total: totalCost,
        costPerKm: costPerKm,
        costPerMonth: costPerMonth,
        costPerYear: costPerYear,
        breakdown: {
            fuel: fuelCost,
            insurance: insuranceCost,
            tax: taxCost,
            maintenance: maintenanceCost,
            depreciation: depreciationCost,
            parking: parkingCost,
            other: otherCosts + cleaningCost
        },
        totalMileage: totalMileage,
        ownershipYears: ownershipYears
    };
}

// Получение среднего TCO для сравнения
function getAverageTCO(carData) {
    // Упрощенная формула для среднего TCO
    const purchasePrice = carData.purchasePrice || carData.avgPrice || 500000;
    const annualMileage = carData.annualMileage || 20000;
    const ownershipYears = carData.ownershipYears || 1;
    
    // Средний TCO примерно 1.5-2 руб/км для обычных автомобилей
    const avgCostPerKm = 1.8;
    const totalMileage = annualMileage * ownershipYears;
    const avgTotalCost = avgCostPerKm * totalMileage;
    
    return {
        costPerKm: avgCostPerKm,
        costPerYear: avgTotalCost / ownershipYears,
        total: avgTotalCost
    };
}

// Экспорт функций
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateTCO, getAverageTCO };
}

