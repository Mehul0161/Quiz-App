<template>
  <div class="min-h-screen bg-neutral-950 relative">

    <!-- Hero Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center relative z-10">
      <div class="mb-12 animate-fade-in">
        <div class="inline-block mb-6 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-full">
          <span class="text-sm font-semibold text-neutral-300">🎮 Win Big, Play Smart</span>
        </div>
        <h1 class="text-6xl md:text-8xl font-black text-white mb-6 leading-tight tracking-tight">
          Who Wants to Be a
          <span class="block text-yellow-400">Millionaire?</span>
        </h1>
        <p class="text-xl md:text-2xl text-neutral-300 max-w-3xl mx-auto mb-10 leading-relaxed">
          Experience the ultimate quiz challenge. Answer 15 progressive questions, compete globally, and climb your way to virtual <span class="font-bold text-yellow-400">$1,000,000</span>.
        </p>
      </div>

      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row justify-center gap-4 mb-16">
        <button @click="onPlayClick" class="px-10 py-5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3">
          <Play :size="22" fill="currentColor" />
          <span>Play Now</span>
        </button>
        <router-link to="/leaderboard" class="px-10 py-5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white font-bold rounded-xl text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3">
          <Trophy :size="22" class="text-yellow-400" />
          <span>View Rankings</span>
        </router-link>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div class="p-6 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-all duration-300 hover:shadow-lg">
          <div class="mb-4 flex justify-center">
            <div class="p-3 bg-indigo-500/10 rounded-lg">
              <Target :size="32" class="text-indigo-400" />
            </div>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">15 Questions</h3>
          <p class="text-neutral-400 text-sm">Progressive difficulty with safe havens at $32K and $1M milestones.</p>
        </div>
        <div class="p-6 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-all duration-300 hover:shadow-lg">
          <div class="mb-4 flex justify-center">
            <div class="p-3 bg-purple-500/10 rounded-lg">
              <Brain :size="32" class="text-purple-400" />
            </div>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">3 Game Modes</h3>
          <p class="text-neutral-400 text-sm">Normal, Rapid Fire, or No Options—choose your preferred challenge style.</p>
        </div>
        <div class="p-6 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-all duration-300 hover:shadow-lg">
          <div class="mb-4 flex justify-center">
            <div class="p-3 bg-yellow-500/10 rounded-lg">
              <Award :size="32" class="text-yellow-400" />
            </div>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Compete Globally</h3>
          <p class="text-neutral-400 text-sm">Climb the leaderboard, earn achievements, and prove your knowledge.</p>
        </div>
      </div>

      <!-- Prize Structure Section -->
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-8 mb-16">
        <div class="flex items-center justify-center gap-3 mb-6">
          <Coins :size="28" class="text-yellow-400" />
          <h2 class="text-2xl font-bold text-white">Prize Ladder</h2>
        </div>
        <div class="grid grid-cols-5 md:grid-cols-10 gap-3">
          <div v-for="(prize, idx) in prizeStructure" :key="idx" class="p-3 bg-neutral-800 border border-neutral-700 rounded-lg hover:border-yellow-500/50 transition-all duration-300 text-center">
            <div class="text-xs text-neutral-400 mb-1">Q{{ idx + 1 }}</div>
            <div class="text-sm font-bold text-yellow-400">${{ (prize / 1000).toFixed(0) }}K</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section (if logged in) -->
    <section v-if="appStore.isLoggedIn" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
        <h2 class="text-3xl font-bold text-white text-center mb-8">Your Performance</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-5 bg-neutral-800 border border-neutral-700 rounded-lg hover:border-yellow-500/50 transition-all duration-300">
            <div class="text-2xl font-bold text-yellow-400 mb-1">{{ formatCurrency(appStore.currentUser?.totalEarnings || 0) }}</div>
            <div class="text-sm text-neutral-400">Total Earnings</div>
          </div>
          <div class="p-5 bg-neutral-800 border border-neutral-700 rounded-lg hover:border-green-500/50 transition-all duration-300">
            <div class="text-2xl font-bold text-green-400 mb-1">{{ appStore.currentUser?.gamesPlayed || 0 }}</div>
            <div class="text-sm text-neutral-400">Games Played</div>
          </div>
          <div class="p-5 bg-neutral-800 border border-neutral-700 rounded-lg hover:border-purple-500/50 transition-all duration-300">
            <div class="text-2xl font-bold text-purple-400 mb-1">{{ formatCurrency(appStore.currentUser?.highestScore || 0) }}</div>
            <div class="text-sm text-neutral-400">Best Score</div>
          </div>
          <div class="p-5 bg-neutral-800 border border-neutral-700 rounded-lg hover:border-indigo-500/50 transition-all duration-300">
            <div class="text-2xl font-bold text-indigo-400 mb-1">{{ appStore.currentUser?.achievements?.length || 0 }}</div>
            <div class="text-sm text-neutral-400">Achievements</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Auth Modal -->
    <div v-if="authModal" class="fixed inset-0 bg-black/80 z-50 grid place-items-center p-4">
      <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-8 max-w-md w-full shadow-2xl">
        <h2 class="text-2xl font-bold text-white mb-6 text-center">Join the Game</h2>

        <!-- Tabs for login/signup -->
        <div class="flex gap-2 mb-6 p-1 bg-neutral-800 rounded-lg">
          <button
            @click="authTab = 'signin'"
            :class="[
              'flex-1 py-2 rounded-lg font-semibold transition-all duration-300',
              authTab === 'signin'
                ? 'bg-indigo-600 text-white'
                : 'text-neutral-400 hover:text-white'
            ]"
          >
            Sign In
          </button>
          <button
            @click="authTab = 'signup'"
            :class="[
              'flex-1 py-2 rounded-lg font-semibold transition-all duration-300',
              authTab === 'signup'
                ? 'bg-indigo-600 text-white'
                : 'text-neutral-400 hover:text-white'
            ]"
          >
            Sign Up
          </button>
        </div>

        <!-- Sign In Form -->
        <form v-if="authTab === 'signin'" @submit.prevent="handleSignIn" class="space-y-4">
          <div>
            <input
              v-model="authForm.email"
              type="email"
              placeholder="Email"
              class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>
          <div>
            <input
              v-model="authForm.password"
              type="password"
              placeholder="Password"
              class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>
          <button type="submit" :disabled="appStore.loading" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition disabled:opacity-50">
            {{ appStore.loading ? 'Signing In...' : 'Sign In' }}
          </button>
        </form>

        <!-- Sign Up Form -->
        <form v-if="authTab === 'signup'" @submit.prevent="handleSignUp" class="space-y-4">
          <div>
            <input
              v-model="authForm.username"
              type="text"
              placeholder="Username"
              class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>
          <div>
            <input
              v-model="authForm.email"
              type="email"
              placeholder="Email"
              class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>
          <div>
            <input
              v-model="authForm.password"
              type="password"
              placeholder="Password"
              class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>
          <button type="submit" :disabled="appStore.loading" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition disabled:opacity-50">
            {{ appStore.loading ? 'Creating...' : 'Sign Up' }}
          </button>
        </form>

        <!-- Google OAuth -->
        <div class="my-4 flex items-center gap-2">
          <div class="flex-1 h-px bg-neutral-700"></div>
          <span class="text-xs text-neutral-400">or</span>
          <div class="flex-1 h-px bg-neutral-700"></div>
        </div>
        <button @click="continueWithGoogle" class="w-full py-3 bg-white hover:bg-neutral-100 text-black font-bold rounded-lg transition">
          Continue with Google
        </button>

        <!-- Guest Mode -->
        <button @click="playAsGuest" class="w-full py-3 mt-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg transition">
          Play as Guest
        </button>

        <!-- Error Message -->
        <div v-if="appStore.error" class="mt-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg text-red-300 text-sm">
          {{ appStore.error }}
        </div>

        <!-- Close Button -->
        <button @click="authModal = false" class="absolute top-4 right-4 text-neutral-400 hover:text-white">
          <X :size="20" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import { formatCurrency } from '../utils/constants'
import { Play, Trophy, Target, Brain, Award, X, Coins } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// User is initialized automatically by the store from localStorage

const authModal = ref(false)
const authTab = ref<'signin' | 'signup'>('signin')
const authForm = ref({ username: '', email: '', password: '' })

const prizeStructure = computed(() => appStore.prizeStructure.length > 0 ? appStore.prizeStructure : [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000])

onMounted(() => {
  if (appStore.prizeStructure.length === 0) {
    appStore.fetchPrizeStructure()
  }
})

// Open auth modal if header sent ?auth=1
watchEffect(() => {
  if (route.query.auth === '1' && !appStore.isLoggedIn && !appStore.isGuest) {
    authModal.value = true
  }
})

const onPlayClick = () => {
  if (appStore.isLoggedIn || appStore.isGuest) {
    router.push('/setup')
  } else {
    authModal.value = true
  }
}

const handleSignIn = async () => {
  try {
    await appStore.login(authForm.value.email, authForm.value.password)
    authModal.value = false
    router.push('/setup')
  } catch (e) {
    // Error is set in store
  }
}

const handleSignUp = async () => {
  try {
    await appStore.register(authForm.value.username, authForm.value.email, authForm.value.password)
    authModal.value = false
    router.push('/setup')
  } catch (e) {
    // Error is set in store
  }
}

const continueWithGoogle = () => {
  const api = (import.meta as any).env?.VITE_API_BASE_URL || `${window.location.origin}/api`
  window.location.href = `${api}/auth/google`
}

const playAsGuest = () => {
  appStore.startGuestSession()
  authModal.value = false
  router.push('/setup')
}
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}
</style>
