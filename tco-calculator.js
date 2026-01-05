function calculateTCO(carData) {
    console.log("func: calculateTCO");
    const {
        annual_km = 0,           // годовой пробег (км)
        ownership = 0,           // срок владения (лет)
        fuel_price = 0,          // цена топлива (руб/л)
        consumption = 0,         // расход топлива (л/100км)
        osago = 0,               // стоимость ОСАГО в год
        kasko = 0,               // стоимость КАСКО в год
        service = 0,             // затраты на ТО в год
        fixes = 0,               // затраты на ремонты в год
        downtrend = 0,           // потеря стоимости в год (%)
        price = 0,               // первоначальная стоимость авто
        fees = 0,                // налоги и сборы в год
        parking = 0              // парковка в год
    } = currentCarData;
    let tco = 0;
    tco = annual_km / 100 * consumption * fuel_price + osago + kasko + service + fixes + downtrend + fees + parking
    console.log("func: tco = ", tco);
    console.log("func: tco data = ", currentCarData);

    return tco;
    
}

// Получение среднего TCO для сравнения
function getAverageTCO(carData) {
   return 1;
}

// Экспорт функций
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateTCO, getAverageTCO };
}

