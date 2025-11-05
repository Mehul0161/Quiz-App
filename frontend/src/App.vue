<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from './stores/appStore'
import { formatCurrency } from './utils/constants'
import { Coins, Home, BarChart3, Trophy, User, Lock, Menu } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const onSignIn = () => {
  router.push({ path: '/', query: { auth: '1' } })
}

const userDisplayName = computed(() => {
  if (appStore.isGuest) return 'Guest'
  return appStore.currentUser?.username || 'Guest'
})

const userInitial = computed(() => {
  if (appStore.isGuest) return 'G'
  return appStore.currentUser?.username?.charAt(0).toUpperCase() || 'U'
})

const userEarnings = computed(() => {
  if (appStore.isGuest) {
    const history = localStorage.getItem('quiz_guest_history')
    if (!history) return 0
    const games = JSON.parse(history)
    return games.reduce((sum: number, g: any) => sum + (g.score || 0), 0)
  }
  return appStore.currentUser?.totalEarnings || 0
})

const isActiveRoute = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path === path || route.path.startsWith(path + '/')
}

// Fetch categories and prize structure on mount
onMounted(() => {
  appStore.fetchCategories()
  appStore.fetchPrizeStructure()
})
</script>

<template>
  <div class="bg-neutral-950 text-white min-h-screen">
    <header v-if="route.path !== '/game'" class="sticky top-0 z-50 bg-neutral-900 border-b border-neutral-800 shadow-lg">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <router-link to="/" class="flex items-center gap-2 group">
              <div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Coins :size="24" class="text-white" />
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-xl text-white leading-tight">
                  QuizMillionaire
                </span>
                <span class="text-[10px] text-neutral-400 -mt-0.5 hidden sm:block">Win Big, Play Smart</span>
              </div>
            </router-link>
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center gap-1">
            <router-link 
              to="/" 
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActiveRoute('/')
                  ? 'bg-indigo-600 text-white'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              ]"
            >
              <span class="flex items-center gap-2">
                <Home :size="16" /> Home
              </span>
            </router-link>
            
            <router-link 
              to="/dashboard" 
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActiveRoute('/dashboard')
                  ? 'bg-indigo-600 text-white'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              ]"
            >
              <span class="flex items-center gap-2">
                <BarChart3 :size="16" /> Dashboard
              </span>
            </router-link>

            <router-link 
              to="/leaderboard" 
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActiveRoute('/leaderboard')
                  ? 'bg-indigo-600 text-white'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              ]"
            >
              <span class="flex items-center gap-2">
                <Trophy :size="16" /> Leaderboard
              </span>
            </router-link>
          </div>

          <!-- User Section -->
          <div class="flex items-center gap-3">
            <!-- User Info & Earnings (Clickable to Profile) -->
                    <router-link 
                      v-if="appStore.isLoggedIn"
                      to="/profile"
                      :class="[
                        'hidden lg:flex items-center gap-3 px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 transition-all duration-200 cursor-pointer',
                        isActiveRoute('/profile')
                          ? 'border-indigo-500 bg-indigo-600/10'
                          : 'hover:border-neutral-600 hover:bg-neutral-800'
                      ]"
                    >
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                          {{ userInitial }}
                        </div>
                        <div class="flex flex-col">
                          <span class="text-xs font-semibold text-white">{{ userDisplayName }}</span>
                          <span class="text-[10px] text-yellow-400 font-medium">{{ formatCurrency(userEarnings) }}</span>
                        </div>
                      </div>
                    </router-link>

                    <!-- Guest Badge (Not clickable) -->
                    <div v-if="appStore.isGuest" class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700">
                      <User :size="14" class="text-neutral-300" />
                      <span class="text-xs font-medium text-neutral-300">Guest Mode</span>
                    </div>

                    <!-- Sign In Button -->
                    <button 
                      v-if="!appStore.isLoggedIn && !appStore.isGuest"
                      @click="onSignIn"
                      class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                    >
                      <Lock :size="16" />
                      <span class="hidden sm:inline">Sign In</span>
                    </button>

                    <!-- Sign In Button (Guest) -->
                    <button 
                      v-if="appStore.isGuest"
                      @click="onSignIn"
                      class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                    >
                      <Lock :size="16" />
                      <span class="hidden sm:inline">Sign In</span>
                    </button>

            <!-- Mobile Menu Button -->
            <button 
              class="md:hidden p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800/50 transition-colors"
              @click="() => {}"
            >
              <Menu :size="24" />
            </button>
          </div>
        </div>
      </nav>
    </header>

    <main class="min-h-screen">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

body {
  font-family: 'Inter', sans-serif;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
