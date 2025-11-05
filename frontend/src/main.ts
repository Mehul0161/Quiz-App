import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

// Import components
import Landing from './components/Landing.vue'
import Dashboard from './components/Dashboard.vue'
import GameSetup from './components/GameSetup.vue'
import QuizGame from './components/QuizGame.vue'
import Leaderboard from './components/Leaderboard.vue'
import Profile from './components/Profile.vue'
import Result from './components/Result.vue';
import Statistics from './components/Statistics.vue'
import OAuthCallback from './components/auth/OAuthCallback.vue'

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Landing },
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
    },
    { path: '/oauth/callback', component: OAuthCallback }
  ]
})

// Route guard for authentication
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('quiz_token')
  const isGuest = localStorage.getItem('quiz_guest') === 'true'
  if (to.meta.requiresAuth && !token && !isGuest) {
    next('/')
  } else {
    next()
  }
})

// Create app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth state on app startup - axios header will be set by store initialization

app.mount('#app')
