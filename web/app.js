// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Получение данных пользователя из Telegram
const user = tg.initDataUnsafe?.user || {};

// Отображение информации о пользователе
function displayUserInfo() {
    const userInfoDiv = document.getElementById('user-info');
    
    if (user.id) {
        userInfoDiv.innerHTML = `
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Имя:</strong> ${user.first_name || 'Не указано'}</p>
            <p><strong>Фамилия:</strong> ${user.last_name || 'Не указано'}</p>
            <p><strong>Username:</strong> ${user.username ? '@' + user.username : 'Не указано'}</p>
        `;
    } else {
        userInfoDiv.innerHTML = '<p>Информация о пользователе недоступна</p>';
    }
}

// Обработка формы
document.getElementById('app-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const inputData = document.getElementById('input-data').value;
    
    if (inputData.trim()) {
        // Отправка данных обратно в бот
        tg.sendData(JSON.stringify({
            action: 'save_data',
            data: inputData,
            timestamp: new Date().toISOString()
        }));
        
        // Показываем уведомление
        tg.showAlert('Данные отправлены! ✅');
        
        // Очищаем поле ввода
        document.getElementById('input-data').value = '';
    }
});

// Основная кнопка
document.getElementById('main-button').addEventListener('click', function() {
    tg.showAlert('Вы нажали основную кнопку!');
    tg.HapticFeedback.impactOccurred('medium');
});

// Кнопка назад
document.getElementById('back-button').addEventListener('click', function() {
    tg.close();
});

// Установка основной кнопки внизу экрана
tg.MainButton.setText('Отправить данные');
tg.MainButton.show();

tg.MainButton.onClick(function() {
    const inputData = document.getElementById('input-data').value;
    if (inputData.trim()) {
        tg.sendData(JSON.stringify({
            action: 'main_button_click',
            data: inputData
        }));
    }
});

// Обновление текста кнопки при вводе
document.getElementById('input-data').addEventListener('input', function() {
    if (this.value.trim()) {
        tg.MainButton.setText('Отправить: ' + this.value);
    } else {
        tg.MainButton.setText('Отправить данные');
    }
});

// Инициализация при загрузке страницы
displayUserInfo();

// Настройка цветовой схемы Telegram
if (tg.colorScheme === 'dark') {
    document.body.classList.add('dark-theme');
}


