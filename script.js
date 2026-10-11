// Konfigurasi ES6 (const & let)
const API_KEY = 'f33203fc755a6cb5c5d4c78878c31bc4'; 
let currentUnit = 'metric'; // 'metric' = Celsius, 'imperial' = Fahrenheit
let lastSearchedCity = '';

// Elemen DOM
const elements = {
    input: document.getElementById('city-input'),
    btn: document.getElementById('search-btn'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error-message'),
    result: document.getElementById('weather-result'),
    historyContainer: document.getElementById('history-container'),
    unitC: document.getElementById('unit-c'),
    unitF: document.getElementById('unit-f')
};

// Fitur Bonus: LocalStorage untuk Riwayat Pencarian
const loadHistory = () => {
    const history = JSON.parse(localStorage.getItem('weatherHistory')) || [];
    elements.historyContainer.innerHTML = '';
    
    // Minimal 1 array method: map (Membuat elemen dari array history)
    history.slice(0, 5).map(city => {
        const chip = document.createElement('div');
        chip.className = 'history-chip';
        chip.textContent = city;
        chip.onclick = () => fetchWeatherData(city);
        elements.historyContainer.appendChild(chip);
    });
};

const saveHistory = (city) => {
    let history = JSON.parse(localStorage.getItem('weatherHistory')) || [];
    if (!history.includes(city)) {
        history.unshift(city); // Tambah ke awal
        localStorage.setItem('weatherHistory', JSON.stringify(history.slice(0, 5))); // Simpan max 5
        loadHistory();
    }
};

// Async/Await & Fetch API untuk cuaca saat ini & Forecast 5 Hari
const fetchWeatherData = async (city) => {
    if (!city) return;
    lastSearchedCity = city;

    // Reset UI
    elements.error.classList.add('hidden');
    elements.result.classList.add('hidden');
    elements.loading.classList.remove('hidden'); // Loading state saat fetch data

    try {
        // Fetch Current Weather
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${currentUnit}&lang=id`;
        const weatherRes = await fetch(weatherUrl);

        // Error Handling: 404 dan Network/Lainnya
        if (!weatherRes.ok) {
            if (weatherRes.status === 404) throw new Error(`Kota "${city}" tidak ditemukan (404).`);
            throw new Error('Terjadi kesalahan jaringan atau server.');
        }

        const weatherData = await weatherRes.json();
        
        // Fetch 5-Day Forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${currentUnit}&lang=id`;
        const forecastRes = await fetch(forecastUrl);
        const forecastData = await forecastRes.json();

        // Render Data
        renderWeather(weatherData);
        renderForecast(forecastData);
        saveHistory(weatherData.name); // Simpan nama kota aslinya

        elements.loading.classList.add('hidden');
        elements.result.classList.remove('hidden');

    } catch (error) {
        elements.loading.classList.add('hidden');
        elements.error.classList.remove('hidden');
        // Template literals (ES6)
        elements.error.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${error.message}`;
    }
};

// Arrow function & DOM Manipulation
const renderWeather = (data) => {
    const symbol = currentUnit === 'metric' ? '°C' : '°F';
    const speed = currentUnit === 'metric' ? 'm/s' : 'mph';

    document.getElementById('city-name').textContent = data.name;
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}${symbol}`;
    document.getElementById('description').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('wind').textContent = `${data.wind.speed} ${speed}`;
    
    // Set Icon
    const iconCode = data.weather[0].icon;
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
};

// Fitur Bonus & Array Methods (Filter & Map)
const renderForecast = (data) => {
    const forecastContainer = document.getElementById('forecast-container');
    const symbol = currentUnit === 'metric' ? '°C' : '°F';

    // Array Filter: OpenWeather map mengembalikan data per 3 jam (40 data).
    // Kita filter hanya mengambil data pada jam 12:00 siang setiap harinya.
    const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    // Array Map & Template Literals: Membentuk HTML string
    const forecastHTML = dailyData.map(day => {
        const date = new Date(day.dt * 1000).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
        const temp = Math.round(day.main.temp);
        const icon = day.weather[0].icon;
        
        return `
            <div class="forecast-card">
                <p><strong>${date}</strong></p>
                <img src="https://openweathermap.org/img/wn/${icon}.png" alt="icon">
                <p>${temp}${symbol}</p>
            </div>
        `;
    }).join('');

    forecastContainer.innerHTML = forecastHTML;
};

// Event Listeners
elements.btn.addEventListener('click', () => fetchWeatherData(elements.input.value));
elements.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchWeatherData(elements.input.value);
});

// Fitur Bonus: Toggle C / F
const toggleUnit = (unit) => {
    if (currentUnit === unit) return;
    currentUnit = unit;
    
    if (unit === 'metric') {
        elements.unitC.classList.add('active');
        elements.unitF.classList.remove('active');
    } else {
        elements.unitF.classList.add('active');
        elements.unitC.classList.remove('active');
    }

    if (lastSearchedCity) fetchWeatherData(lastSearchedCity); // Refresh data dgn unit baru
};

elements.unitC.addEventListener('click', () => toggleUnit('metric'));
elements.unitF.addEventListener('click', () => toggleUnit('imperial'));

// Init load
loadHistory();