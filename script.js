/**
 * Modern Clock & Weather App
 * Built for Skoop Digital Signage
 */

const clockElement = document.getElementById('clock');
const ampmElement = document.getElementById('ampm');
const dateElement = document.getElementById('date');
const weatherContainer = document.getElementById('weather-content');
const weatherLoading = document.getElementById('weather-loading');
const weatherError = document.getElementById('weather-error');

const tempElement = document.getElementById('temp');
const conditionElement = document.getElementById('condition');
const locationElement = document.getElementById('location');
const iconElement = document.getElementById('weather-icon');

// UI Controls
const toggleFormatBtn = document.getElementById('toggle-format');
const toggleSizeBtn = document.getElementById('toggle-size');
const container = document.querySelector('.container');

// App State
let is24Hour = localStorage.getItem('is24Hour') !== 'false'; // Default to true
let isExpanded = localStorage.getItem('isExpanded') === 'true'; // Default to false

/**
 * Clock Logic
 */
function updateClock() {
    const now = new Date();

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    if (!is24Hour) {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        ampmElement.textContent = ampm;
        ampmElement.classList.remove('hidden');
    } else {
        ampmElement.classList.add('hidden');
    }

    const hoursStr = String(hours).padStart(2, '0');
    clockElement.textContent = `${hoursStr}:${minutes}:${seconds}`;

    // Date format: Day, Month Day, Year
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString(undefined, options);
}

/**
 * UI Controls Logic
 */
function initControls() {
    // Set initial state from localStorage
    updateFormatUI();
    if (isExpanded) container.classList.add('expanded');

    toggleFormatBtn.addEventListener('click', () => {
        is24Hour = !is24Hour;
        localStorage.setItem('is24Hour', is24Hour);
        updateFormatUI();
        updateClock();
    });

    toggleSizeBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        localStorage.setItem('isExpanded', isExpanded);
        container.classList.toggle('expanded');
    });
}

function updateFormatUI() {
    toggleFormatBtn.textContent = is24Hour ? '24H' : '12H';
}

// Initial call and set interval
initControls();
updateClock();
setInterval(updateClock, 1000);

/**
 * Weather Logic (Open-Meteo + IP Geolocation)
 */
async function initWeather() {
    try {
        // Set location to Lahore, Pakistan as requested
        const latitude = 31.5204;
        const longitude = 74.3587;
        const city = "Lahore";
        const country_name = "Pakistan";

        locationElement.textContent = `${city}, ${country_name}`;

        // Fetch weather data for the specified coordinates
        await fetchWeather(latitude, longitude);

    } catch (error) {
        console.error('Weather init error:', error);
        showError();
    }
}

async function fetchWeather(lat, lon) {
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
        const response = await fetch(weatherUrl, { cache: 'no-store' });

        if (!response.ok) throw new Error('Weather API error');

        const data = await response.json();
        const current = data.current_weather;

        updateWeatherUI(current.temperature, current.weathercode);

    } catch (error) {
        console.error('Fetch weather error:', error);
        showError();
    }
}

function updateWeatherUI(temp, code) {
    tempElement.textContent = `${Math.round(temp)}°C`;

    const weatherInfo = mapWeatherCode(code);
    conditionElement.textContent = weatherInfo.label;
    iconElement.textContent = weatherInfo.icon;

    weatherLoading.classList.add('hidden');
    weatherError.classList.add('hidden');
    weatherContainer.classList.remove('hidden');
}

function showError() {
    weatherLoading.classList.add('hidden');
    weatherContainer.classList.add('hidden');
    weatherError.classList.remove('hidden');
}

/**
 * WMO Weather interpretation codes (WW)
 * https://open-meteo.com/en/docs
 */
function mapWeatherCode(code) {
    const mapping = {
        0: { label: 'Clear Sky', icon: '☀️' },
        1: { label: 'Mainly Clear', icon: '🌤️' },
        2: { label: 'Partly Cloudy', icon: '⛅' },
        3: { label: 'Overcast', icon: '☁️' },
        45: { label: 'Foggy', icon: '🌫️' },
        48: { label: 'Depositing Rime Fog', icon: '🌫️' },
        51: { label: 'Light Drizzle', icon: '🌦️' },
        53: { label: 'Moderate Drizzle', icon: '🌦️' },
        55: { label: 'Dense Drizzle', icon: '🌦️' },
        61: { label: 'Slight Rain', icon: '🌧️' },
        63: { label: 'Moderate Rain', icon: '🌧️' },
        65: { label: 'Heavy Rain', icon: '🌧️' },
        71: { label: 'Slight Snow', icon: '❄️' },
        73: { label: 'Moderate Snow', icon: '❄️' },
        75: { label: 'Heavy Snow', icon: '❄️' },
        77: { label: 'Snow Grains', icon: '❄️' },
        80: { label: 'Slight Rain Showers', icon: '🌦️' },
        81: { label: 'Moderate Rain Showers', icon: '🌦️' },
        82: { label: 'Violent Rain Showers', icon: '🌧️' },
        85: { label: 'Slight Snow Showers', icon: '🌨️' },
        86: { label: 'Heavy Snow Showers', icon: '🌨️' },
        95: { label: 'Thunderstorm', icon: '⛈️' },
        96: { label: 'Thunderstorm with Hail', icon: '⛈️' },
        99: { label: 'Thunderstorm with Heavy Hail', icon: '⛈️' }
    };

    return mapping[code] || { label: 'Unknown', icon: '❓' };
}

// Start weather detection
initWeather();

// Refresh weather every 30 minutes
setInterval(initWeather, 30 * 60 * 1000);
