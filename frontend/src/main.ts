import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Import components
import Home from './components/Home.vue'
import Login from './components/Login.vue'
import Dashboard from './components/Dashboard.vue'
import GameSetup from './components/GameSetup.vue'
import QuizGame from './components/QuizGame.vue'
import Leaderboard from './components/Leaderboard.vue'
import Profile from './components/Profile.vue'
import Result from './components/Result.vue';
import Statistics from './components/Statistics.vue'

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { 
      path: '/dashboard', 
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    { 
      path: '/setup', 
      component: GameSetup,
      meta: { requiresAuth: true }
    },
    { 
      path: '/game', 
      component: QuizGame,
      meta: { requiresAuth: true }
    },
    { path: '/leaderboard', component: Leaderboard },
    { 
      path: '/profile', 
      component: Profile,
      meta: { requiresAuth: true }
    },
    {
      path: '/result',
      component: Result,
      meta: { requiresAuth: true }
    },
    {
      path: '/statistics',
      component: Statistics,
      meta: { requiresAuth: true }
    }
  ]
})

// Route guard for authentication
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('quiz_token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else if (to.path === '/' && token) {
    // Redirect logged-in users from home page to dashboard
    next('/dashboard')
  } else {
    next()
  }
})

// Create app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
