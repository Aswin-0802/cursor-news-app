<template>
  <div :data-theme="theme">
    <!-- Theme Toggle Bar -->
    <div class="theme-toggle-bar">
      <div class="container d-flex justify-content-end align-items-center py-2">
        <div class="theme-switch">
          <label class="switch">
            <input 
              type="checkbox" 
              :checked="theme === 'dark'"
              @change="toggleTheme"
            >
            <span class="slider round">
              <i class="bi" :class="theme === 'dark' ? 'bi-moon-fill' : 'bi-sun-fill'"></i>
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Main Navigation -->
    <nav class="navbar navbar-expand-lg" :class="theme === 'dark' ? 'navbar-dark bg-dark' : 'navbar-light bg-light'">
      <div class="container">
        <a class="navbar-brand" href="#">
          <i class="bi bi-newspaper"></i> News App
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/">
                <i class="bi bi-house-door"></i> Home
              </router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/bookmarks">
                <i class="bi bi-bookmark"></i> Bookmarks
              </router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/weather">
                <i class="bi bi-cloud-sun"></i> Weather
              </router-link>
            </li>
          </ul>
          <div class="search-container">
            <div class="input-group">
              <span class="input-group-text">
                <i class="bi bi-search"></i>
              </span>
              <input 
                v-model="searchQuery" 
                type="text" 
                class="form-control" 
                placeholder="Search news..."
                @input="onSearch"
              >
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <router-view :search-query="searchQuery"></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      searchQuery: '',
      theme: localStorage.getItem('theme') || 'light',
      searchTimeout: null
    }
  },
  methods: {
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', this.theme)
      document.documentElement.setAttribute('data-theme', this.theme)
    },
    onSearch(event) {
      // Clear previous timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      // Set new timeout to avoid too many updates
      this.searchTimeout = setTimeout(() => {
        this.searchQuery = event.target.value
      }, 300)
    }
  },
  mounted() {
    document.documentElement.setAttribute('data-theme', this.theme)
  }
}
</script>

<style>
:root {
  --card-bg: #ffffff;
  --detail-bg: #f8f9fa;
  --text-color: #212529;
  --body-bg: #f8f9fa;
  --theme-toggle-bg: #e9ecef;
}

[data-theme="dark"] {
  --card-bg: #2c3e50;
  --detail-bg: #34495e;
  --text-color: #ffffff;
  --body-bg: #1a1a1a;
  --theme-toggle-bg: #2c3e50;
}

body {
  background-color: var(--body-bg);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

.theme-toggle-bar {
  background-color: var(--theme-toggle-bg);
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

.slider i {
  color: #fff;
  font-size: 1.2rem;
  z-index: 1;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.card {
  background-color: var(--card-bg);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

.navbar {
  transition: background-color 0.3s;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.navbar-brand i,
.nav-link i {
  margin-right: 0.5rem;
}

.form-control {
  background-color: var(--card-bg);
  color: var(--text-color);
  border-color: var(--detail-bg);
}

.form-control:focus {
  background-color: var(--card-bg);
  color: var(--text-color);
}

.input-group-text {
  background-color: var(--detail-bg);
  border-color: var(--detail-bg);
  color: var(--text-color);
}

.search-container {
  width: 300px;
}

@media (max-width: 768px) {
  .search-container {
    width: 100%;
    margin-top: 10px;
  }
}
</style> 