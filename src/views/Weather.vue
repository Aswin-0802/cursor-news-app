<template>
  <div class="weather-container">
    <div class="search-bar mb-4">
      <div class="input-group">
        <input 
          v-model="city" 
          type="text" 
          class="form-control"
          placeholder="Search for location"
          @keyup="searchCities"
          @keyup.enter="getWeather"
        >
        <button class="btn btn-primary" @click="getWeather">
          <i class="bi bi-search"></i>
        </button>
        <button class="btn btn-secondary" @click="getCurrentLocation" title="Use current location">
          <i class="bi bi-geo-alt"></i>
        </button>
      </div>
      <!-- City Suggestions -->
      <div class="suggestions-container" v-if="suggestions.length > 0">
        <div class="suggestions-list">
          <div 
            v-for="suggestion in suggestions" 
            :key="suggestion.name"
            class="suggestion-item"
            @click="selectCity(suggestion)"
          >
            <i class="bi bi-geo-alt"></i>
            {{ suggestion.name }}, {{ suggestion.country }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-else-if="weather" class="weather-content">
      <!-- Current Weather -->
      <div class="current-weather-card">
        <div class="location-info">
          <h2>{{ weather.name }}, {{ weather.sys.country }}</h2>
          <p class="weather-description">{{ weather.weather[0].description }}</p>
        </div>
        
        <div class="current-temp">
          <div class="temp-icon">
            <img :src="`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`" :alt="weather.weather[0].description">
            <span class="temp-value">{{ Math.round(weather.main.temp) }}°C</span>
          </div>
          <div class="feels-like">
            Feels like {{ Math.round(weather.main.feels_like) }}°C
          </div>
        </div>

        <div class="weather-details-grid">
          <div class="detail-box">
            <i class="bi bi-wind"></i>
            <div class="detail-info">
              <span class="detail-value">{{ Math.round(weather.wind.speed) }} km/h</span>
              <span class="detail-label">Wind</span>
            </div>
          </div>
          <div class="detail-box">
            <i class="bi bi-droplet"></i>
            <div class="detail-info">
              <span class="detail-value">{{ weather.main.humidity }}%</span>
              <span class="detail-label">Humidity</span>
            </div>
          </div>
          <div class="detail-box">
            <i class="bi bi-thermometer-half"></i>
            <div class="detail-info">
              <span class="detail-value">{{ weather.main.pressure }} mb</span>
              <span class="detail-label">Pressure</span>
            </div>
          </div>
          <div class="detail-box">
            <i class="bi bi-eye"></i>
            <div class="detail-info">
              <span class="detail-value">{{ (weather.visibility / 1000).toFixed(1) }} km</span>
              <span class="detail-label">Visibility</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Hourly Forecast -->
      <div class="forecast-section">
        <h3>Hourly Forecast</h3>
        <div class="hourly-forecast" v-if="forecast">
          <div v-for="(item, index) in forecast.list.slice(0, 8)" :key="index" class="forecast-item">
            <div class="time">{{ formatTime(item.dt) }}</div>
            <img :src="`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`" :alt="item.weather[0].description">
            <div class="temp">{{ Math.round(item.main.temp) }}°</div>
            <div class="precipitation" v-if="item.pop > 0">
              <i class="bi bi-droplet-fill"></i>
              {{ Math.round(item.pop * 100) }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

// Common city list for suggestions
const commonCities = [
  { name: 'Chennai', country: 'IN' },
  { name: 'Coimbatore', country: 'IN' },
  { name: 'Chicago', country: 'US' },
  { name: 'Cape Town', country: 'ZA' },
  { name: 'Cairo', country: 'EG' },
  { name: 'Canberra', country: 'AU' },
  { name: 'Copenhagen', country: 'DK' },
  { name: 'Calgary', country: 'CA' },
  { name: 'Colombo', country: 'LK' },
  { name: 'Casablanca', country: 'MA' }
]

export default {
  name: 'Weather',
  data() {
    return {
      city: '',
      weather: null,
      forecast: null,
      loading: false,
      error: null,
      apiKey: '4d8fb5b93d4af21d66a2948710284366',
      suggestions: []
    }
  },
  methods: {
    searchCities() {
      if (this.city.length > 0) {
        this.suggestions = commonCities.filter(city => 
          city.name.toLowerCase().startsWith(this.city.toLowerCase())
        ).slice(0, 5)
      } else {
        this.suggestions = []
      }
    },
    selectCity(city) {
      this.city = city.name
      this.suggestions = []
      this.getWeather()
    },
    async getCurrentLocation() {
      this.loading = true
      this.error = null

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject)
        })

        const { latitude, longitude } = position.coords
        const [weatherResponse, forecastResponse] = await Promise.all([
          axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${this.apiKey}`),
          axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${this.apiKey}`)
        ])

        this.weather = weatherResponse.data
        this.forecast = forecastResponse.data
        this.city = this.weather.name
        this.error = null
      } catch (error) {
        if (error.code === 1) {
          this.error = 'Location access denied. Please enable location access or search manually.'
        } else if (error.code === 2) {
          this.error = 'Unable to get your location. Please try searching manually.'
        } else if (error.response) {
          this.error = `Error: ${error.response.data.message || 'Unable to fetch weather data'}`
        } else {
          this.error = 'Unable to get weather data for your location.'
        }
        console.error('Location or Weather API error:', error)
      } finally {
        this.loading = false
      }
    },
    async getWeather() {
      if (!this.city) {
        this.error = 'Please enter a city name'
        return
      }
      
      this.loading = true
      this.error = null
      
      try {
        const [weatherResponse, forecastResponse] = await Promise.all([
          axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${this.city}&units=metric&appid=${this.apiKey}`),
          axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${this.city}&units=metric&appid=${this.apiKey}`)
        ])
        
        if (weatherResponse.data.cod === '404' || forecastResponse.data.cod === '404') {
          throw new Error('City not found')
        }
        
        this.weather = weatherResponse.data
        this.forecast = forecastResponse.data
        this.error = null
      } catch (error) {
        if (error.response) {
          // API error response
          if (error.response.status === 404) {
            this.error = 'City not found. Please check the spelling and try again.'
          } else if (error.response.status === 401) {
            this.error = 'API key is invalid. Please check your configuration.'
          } else {
            this.error = `Error: ${error.response.data.message || 'Unable to fetch weather data'}`
          }
        } else if (error.request) {
          // Network error
          this.error = 'Network error. Please check your internet connection.'
        } else {
          this.error = error.message || 'Unable to fetch weather data. Please try again.'
        }
        console.error('Weather API error:', error)
      } finally {
        this.loading = false
      }
    },
    formatTime(timestamp) {
      const date = new Date(timestamp * 1000)
      return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
    }
  },
  async mounted() {
    // Get weather for current location when component mounts
    await this.getCurrentLocation()
  }
}
</script>

<style scoped>
.weather-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-bar {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
}

.suggestions-container {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  margin-top: 5px;
}

.suggestions-list {
  background: var(--card-bg);
  border: 1px solid var(--detail-bg);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: var(--detail-bg);
}

.suggestion-item i {
  color: var(--primary);
  font-size: 1rem;
}

/* Dark theme improvements */
[data-theme="dark"] .current-weather-card,
[data-theme="dark"] .forecast-section {
  background: #1e2938;
  border: 1px solid #34495e;
}

[data-theme="dark"] .detail-box {
  background: #2c3e50;
  border: 1px solid #34495e;
}

[data-theme="dark"] .forecast-item {
  background: #2c3e50;
  border: 1px solid #34495e;
}

[data-theme="dark"] .weather-description {
  color: #8795a5;
}

[data-theme="dark"] .feels-like {
  color: #8795a5;
}

[data-theme="dark"] .detail-label {
  color: #8795a5;
}

[data-theme="dark"] .suggestions-list {
  background: #1e2938;
  border: 1px solid #34495e;
}

[data-theme="dark"] .suggestion-item:hover {
  background: #2c3e50;
}

/* Existing styles remain the same */
.weather-content {
  display: grid;
  gap: 2rem;
}

.current-weather-card {
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.location-info h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.temp-value {
  font-size: 4rem;
  font-weight: 600;
  background: linear-gradient(45deg, var(--primary), #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.detail-box {
  backdrop-filter: blur(10px);
  border-radius: 12px;
  transition: transform 0.2s;
}

.detail-box:hover {
  transform: translateY(-2px);
}

.forecast-item {
  transition: transform 0.2s;
}

.forecast-item:hover {
  transform: translateY(-2px);
}

.weather-description {
  margin: 0.5rem 0;
  color: var(--text-muted);
  text-transform: capitalize;
}

.current-temp {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.temp-icon {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.feels-like {
  color: var(--text-muted);
  margin-top: 0.5rem;
}

.weather-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.detail-box i {
  font-size: 1.5rem;
  color: var(--primary);
}

.detail-info {
  display: flex;
  flex-direction: column;
}

.forecast-section {
  background: var(--card-bg);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.forecast-section h3 {
  margin-bottom: 1.5rem;
}

.hourly-forecast {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
}

.forecast-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--detail-bg);
  border-radius: 10px;
  text-align: center;
}

.forecast-item .time {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.forecast-item .temp {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0.5rem 0;
}

.forecast-item .precipitation {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.precipitation i {
  color: #0d6efd;
}

:root {
  --text-muted: #6c757d;
  --primary: #0d6efd;
}

[data-theme="dark"] {
  --text-muted: #adb5bd;
}
</style> 