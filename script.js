/**
 * Modern Clock & Weather App
 * Built for Skoop Digital Signage
 *
 * Optimized for older browsers and devices.
 */

(function() {
    // DOM Elements
    var clockElement = document.getElementById('clock');
    var ampmElement = document.getElementById('ampm');
    var dateElement = document.getElementById('date');
    var weatherContainer = document.getElementById('weather-content');
    var weatherLoading = document.getElementById('weather-loading');
    var weatherError = document.getElementById('weather-error');
    var forecastSection = document.getElementById('forecast-section');
    var forecastGrid = document.getElementById('forecast-grid');
    var prayerSection = document.getElementById('prayer-section');
    var prayerGrid = document.getElementById('prayer-grid');

    var tempElement = document.getElementById('temp');
    var conditionElement = document.getElementById('condition');
    var locationElement = document.getElementById('location');
    var iconElement = document.getElementById('weather-icon');

    // UI Controls
    var toggleFormatBtn = document.getElementById('toggle-format');
    var toggleForecastBtn = document.getElementById('toggle-forecast');
    var togglePrayerBtn = document.getElementById('toggle-prayer');
    var toggleSizeBtn = document.getElementById('toggle-size');
    var container = document.querySelector('.container');

    // App State
    var is24Hour = true;
    var isExpanded = true;
    var isForecastVisible = true;
    var isPrayerVisible = true;

    try {
        if (window.localStorage) {
            is24Hour = localStorage.getItem('is24Hour') !== 'false';
            isExpanded = localStorage.getItem('isExpanded') === 'true';
            isForecastVisible = localStorage.getItem('isForecastVisible') !== 'false';
            isPrayerVisible = localStorage.getItem('isPrayerVisible') !== 'false';
        }
    } catch (e) {
        console.warn('LocalStorage not available');
    }

    /**
     * Text content helper for IE8 support
     */
    function setText(el, text) {
        if (!el) return;
        if (typeof el.textContent !== 'undefined') {
            el.textContent = text;
        } else {
            el.innerText = text;
        }
    }

    /**
     * Class manipulation helpers for IE9 support
     */
    function addClass(el, cls) {
        if (!el) return;
        if (el.classList) {
            el.classList.add(cls);
        } else {
            var curr = el.className;
            if (curr.indexOf(cls) === -1) {
                el.className = curr ? curr + ' ' + cls : cls;
            }
        }
    }

    function removeClass(el, cls) {
        if (!el) return;
        if (el.classList) {
            el.classList.remove(cls);
        } else {
            el.className = el.className.replace(new RegExp('(^|\\b)' + cls.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    /**
     * Polyfill for padStart (ES2017)
     */
    function padLeft(str, len, char) {
        str = String(str);
        char = char || '0';
        while (str.length < len) {
            str = char + str;
        }
        return str;
    }

    /**
     * Clock Logic
     */
    function updateClock() {
        var now = new Date();

        var hours = now.getHours();
        var minutes = padLeft(now.getMinutes(), 2);
        var seconds = padLeft(now.getSeconds(), 2);

        updateTheme(hours);

        if (!is24Hour) {
            var ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            setText(ampmElement, ampm);
            removeClass(ampmElement, 'hidden');
        } else {
            addClass(ampmElement, 'hidden');
        }

        var hoursStr = padLeft(hours, 2);
        setText(clockElement, hoursStr + ':' + minutes + ':' + seconds);

        // Date format: Day, Month Day, Year
        try {
            var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            setText(dateElement, now.toLocaleDateString(undefined, options));
        } catch (e) {
            // Fallback for very old browsers
            setText(dateElement, now.toDateString());
        }
    }

    function updateTheme(hours) {
        var body = document.body;
        removeClass(body, 'theme-morning');
        removeClass(body, 'theme-afternoon');
        removeClass(body, 'theme-evening');
        removeClass(body, 'theme-night');

        if (hours >= 5 && hours < 12) {
            addClass(body, 'theme-morning');
        } else if (hours >= 12 && hours < 17) {
            addClass(body, 'theme-afternoon');
        } else if (hours >= 17 && hours < 21) {
            addClass(body, 'theme-evening');
        } else {
            addClass(body, 'theme-night');
        }
    }

    /**
     * UI Controls Logic
     */
    function initControls() {
        // Set initial state from localStorage
        updateFormatUI();
        if (isExpanded) {
            addClass(container, 'expanded');
        }
        updateForecastVisibility();
        updatePrayerVisibility();

        toggleFormatBtn.addEventListener('click', function() {
            is24Hour = !is24Hour;
            try {
                if (window.localStorage) localStorage.setItem('is24Hour', is24Hour);
            } catch (e) {}
            updateFormatUI();
            updateClock();
            // Re-render prayer times to match format
            initPrayerTimes();
        });

        toggleForecastBtn.addEventListener('click', function() {
            isForecastVisible = !isForecastVisible;
            try {
                if (window.localStorage) localStorage.setItem('isForecastVisible', isForecastVisible);
            } catch (e) {}
            updateForecastVisibility();
        });

        togglePrayerBtn.addEventListener('click', function() {
            isPrayerVisible = !isPrayerVisible;
            try {
                if (window.localStorage) localStorage.setItem('isPrayerVisible', isPrayerVisible);
            } catch (e) {}
            updatePrayerVisibility();
        });

        toggleSizeBtn.addEventListener('click', function() {
            isExpanded = !isExpanded;
            try {
                if (window.localStorage) localStorage.setItem('isExpanded', isExpanded);
            } catch (e) {}
            if (isExpanded) {
                addClass(container, 'expanded');
            } else {
                removeClass(container, 'expanded');
            }
        });
    }

    function updateFormatUI() {
        setText(toggleFormatBtn, is24Hour ? '24H' : '12H');
    }

    function updateForecastVisibility() {
        if (isForecastVisible) {
            removeClass(forecastSection, 'hidden');
            addClass(toggleForecastBtn, 'active');
        } else {
            addClass(forecastSection, 'hidden');
            removeClass(toggleForecastBtn, 'active');
        }
    }

    function updatePrayerVisibility() {
        if (isPrayerVisible) {
            removeClass(prayerSection, 'hidden');
            addClass(togglePrayerBtn, 'active');
        } else {
            addClass(prayerSection, 'hidden');
            removeClass(togglePrayerBtn, 'active');
        }
    }

    /**
     * XMLHttpRequest Wrapper for Weather API
     */
    function getJson(url, callback) {
        var xhr;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            try {
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) {
                    return callback(new Error('XHR not supported'));
                }
            }
        }

        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        callback(null, data);
                    } catch (e) {
                        callback(new Error('Invalid JSON response'));
                    }
                } else {
                    callback(new Error('HTTP Error: ' + xhr.status));
                }
            }
        };
        xhr.onerror = function() {
            callback(new Error('Network error'));
        };
        xhr.send();
    }

    /**
     * Prayer Times Logic (Aladhan)
     */
    function initPrayerTimes() {
        var city = "Lahore";
        var country = "Pakistan";
        var method = 1; // University of Islamic Sciences, Karachi
        var url = 'https://api.aladhan.com/v1/timingsByCity?city=' + city + '&country=' + country + '&method=' + method;

        getJson(url, function(err, data) {
            if (err) {
                console.error('Fetch prayer times error:', err);
                return;
            }

            if (data && data.data && data.data.timings) {
                updatePrayerUI(data.data.timings);
            }
        });
    }

    function updatePrayerUI(timings) {
        var prayers = [
            { id: 'Fajr', name: 'Fajr' },
            { id: 'Dhuhr', name: 'Dhuhr' },
            { id: 'Asr', name: 'Asr' },
            { id: 'Maghrib', name: 'Maghrib' },
            { id: 'Isha', name: 'Isha' }
        ];

        var html = '';
        var now = new Date();
        var currentTime = now.getHours() * 60 + now.getMinutes();
        var nextPrayerIndex = -1;

        for (var i = 0; i < prayers.length; i++) {
            var prayer = prayers[i];
            var timeStr = timings[prayer.id];
            var timeParts = timeStr.split(':');
            var pMinutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);

            // Format time based on preference
            var displayTime = timeStr;
            if (!is24Hour) {
                var h = parseInt(timeParts[0]);
                var m = timeParts[1];
                var ampm = h >= 12 ? 'PM' : 'AM';
                h = h % 12;
                h = h ? h : 12;
                displayTime = h + ':' + m + ' ' + ampm;
            }

            // Determine if this is the next prayer
            var activeClass = '';
            if (nextPrayerIndex === -1 && pMinutes > currentTime) {
                nextPrayerIndex = i;
                activeClass = ' active';
            }

            html += '<div class="prayer-item' + activeClass + '">';
            html += '  <div class="prayer-name">' + prayer.name + '</div>';
            html += '  <div class="prayer-time">' + displayTime + '</div>';
            html += '</div>';
        }

        // If no prayer is next today, Fajr tomorrow is next (but we just mark none active for now or could mark Fajr)
        prayerGrid.innerHTML = html;
    }

    /**
     * Weather Logic (Open-Meteo)
     */
    function initWeather() {
        // Set location to Lahore, Pakistan as requested
        var latitude = 31.5204;
        var longitude = 74.3587;
        var city = "Lahore";
        var country_name = "Pakistan";

        setText(locationElement, city + ", " + country_name);

        // Fetch weather data for the specified coordinates
        fetchWeather(latitude, longitude);
    }

    function fetchWeather(lat, lon) {
        var weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto';

        getJson(weatherUrl, function(err, data) {
            if (err) {
                console.error('Fetch weather error:', err);
                showError();
                return;
            }

            if (data && data.current_weather) {
                var current = data.current_weather;
                updateWeatherUI(current.temperature, current.weathercode);

                if (data.daily) {
                    updateForecastUI(data.daily);
                }
            } else {
                showError();
            }
        });
    }

    function updateWeatherUI(temp, code) {
        setText(tempElement, Math.round(temp) + '°C');

        var weatherInfo = mapWeatherCode(code);
        setText(conditionElement, weatherInfo.label);
        setText(iconElement, weatherInfo.icon);

        addClass(weatherLoading, 'hidden');
        addClass(weatherError, 'hidden');
        removeClass(weatherContainer, 'hidden');
    }

    function updateForecastUI(daily) {
        if (!daily || !daily.time) return;

        var html = '';
        var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Show 4 days starting from tomorrow (index 1 to 4)
        for (var i = 1; i <= 4; i++) {
            if (!daily.time[i]) break;

            var date = new Date(daily.time[i]);
            var dayName = dayNames[date.getDay()];
            var maxTemp = Math.round(daily.temperature_2m_max[i]);
            var minTemp = Math.round(daily.temperature_2m_min[i]);
            var code = daily.weathercode[i];
            var weatherInfo = mapWeatherCode(code);

            html += '<div class="forecast-item">';
            html += '  <div class="forecast-day">' + dayName + '</div>';
            html += '  <div class="forecast-icon">' + weatherInfo.icon + '</div>';
            html += '  <div class="forecast-temp">' + maxTemp + '°</div>';
            html += '  <div class="forecast-temp-min">' + minTemp + '°</div>';
            html += '</div>';
        }

        forecastGrid.innerHTML = html;
    }

    function showError() {
        addClass(weatherLoading, 'hidden');
        addClass(weatherContainer, 'hidden');
        removeClass(weatherError, 'hidden');
    }

    /**
     * WMO Weather interpretation codes (WW)
     */
    function mapWeatherCode(code) {
        var mapping = {
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

    // Expose initWeather to window for the retry button
    window.initWeather = initWeather;

    // Start everything
    initControls();
    updateClock();
    setInterval(updateClock, 1000);
    initWeather();
    initPrayerTimes();

    // Refresh weather every 30 minutes
    setInterval(initWeather, 30 * 60 * 1000);
    // Refresh prayer times every 6 hours
    setInterval(initPrayerTimes, 6 * 60 * 60 * 1000);
})();
