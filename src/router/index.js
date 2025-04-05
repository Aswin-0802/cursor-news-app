import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Bookmarks from '../views/Bookmarks.vue'
import Weather from '../views/Weather.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/bookmarks',
    name: 'Bookmarks',
    component: Bookmarks
  },
  {
    path: '/weather',
    name: 'Weather',
    component: Weather
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router 