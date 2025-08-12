import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

// Import components
import Home from './components/Home.vue'
import Login from './components/Login.vue'
import GameSetup from './components/GameSetup.vue'
import QuizGame from './components/QuizGame.vue'
import Leaderboard from './components/Leaderboard.vue'
import Profile from './components/Profile.vue'
import Dashboard from './components/Dashboard.vue'

// Router configuration
const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/setup', component: GameSetup },
  { path: '/game', component: QuizGame },
  { path: '/leaderboard', component: Leaderboard },
  { path: '/profile', component: Profile },
  { path: '/dashboard', component: Dashboard }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
