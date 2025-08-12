<template>
  <div class="bg-gray-900 text-gray-200">
    <!-- Hero -->
    <div class="relative max-w-5xl mx-auto px-3 pt-10 pb-6 text-center">
      <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">Who Wants to Be a Millionaire?</h1>
      <p class="text-base md:text-lg text-gray-400 mb-6">Create your account, learn the rules, and start your journey.</p>
      <div v-if="userStore.isLoggedIn" class="mb-4">
        <router-link to="/dashboard" class="inline-block px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded">Go to Dashboard</router-link>
      </div>
    </div>

    <!-- Auth + Rules -->
    <div class="max-w-5xl mx-auto px-3 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card-compact">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-white">Get Started</h2>
          <button @click="toggleMode" class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
            {{ isRegistering ? 'Have an account? Sign in' : 'New here? Create an account' }}
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="isRegistering">
            <label class="block text-xs font-semibold text-gray-300 mb-1">Username</label>
            <input v-model="username" type="text" required class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 text-white" placeholder="Username" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-300 mb-1">Email</label>
            <input v-model="email" type="email" required class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 text-white" placeholder="Email" />
          </div>
          <button type="submit" :disabled="userStore.loading" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded disabled:opacity-50">
            <span v-if="userStore.loading">Processing...</span>
            <span v-else>{{ isRegistering ? 'Create Account' : 'Sign In' }}</span>
          </button>
        </form>
        <div v-if="userStore.error" class="mt-3 p-2 bg-red-900/50 border border-red-500/30 rounded text-center text-red-300 text-sm">{{ userStore.error }}</div>
      </div>

      <div class="card-compact">
        <h2 class="text-xl font-bold text-white mb-2">Rules</h2>
        <ul class="list-disc list-inside space-y-1 text-gray-300 text-sm">
          <li>15 questions; prize ladder from $100 to $1,000,000.</li>
          <li>Progressive difficulty: easy → medium → hard → very hard.</li>
          <li>One-time lifelines: 50:50, Audience, Friend.</li>
          <li>Walk away anytime to keep winnings.</li>
        </ul>
        <h3 class="text-base font-semibold text-white mt-5 mb-2">Categories</h3>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="c in categories" :key="c" class="px-2 py-0.5 bg-gray-700/50 border border-gray-600 rounded text-xs text-gray-300">{{ c }}</span>
        </div>
        <h3 class="text-base font-semibold text-white mt-5 mb-2">Prize Structure</h3>
        <div class="grid grid-cols-3 md:grid-cols-5 gap-1">
          <div v-for="(p, i) in prizes" :key="i" class="p-2 text-center bg-gray-800/40 border border-gray-700 rounded text-xs">
            <span class="font-bold text-indigo-300">${{ p.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Features -->
    <div class="max-w-5xl mx-auto px-3 pb-10">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="card-compact text-center">
          <div class="text-2xl mb-2">🤖</div>
          <h3 class="font-bold text-white text-base mb-1">AI-Powered</h3>
          <p class="text-gray-400 text-sm">Fresh challenges with lifelines included.</p>
        </div>
        <div class="card-compact text-center">
          <div class="text-2xl mb-2">🏆</div>
          <h3 class="font-bold text-white text-base mb-1">Compete</h3>
          <p class="text-gray-400 text-sm">Climb the leaderboard.</p>
        </div>
        <div class="card-compact text-center">
          <div class="text-2xl mb-2">🎯</div>
          <h3 class="font-bold text-white text-base mb-1">Strategy</h3>
          <p class="text-gray-400 text-sm">Walk away or risk it.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useQuizStore } from '../stores/quiz'

const router = useRouter()
const userStore = useUserStore()
const quizStore = useQuizStore()

const isRegistering = ref(true)
const username = ref('')
const email = ref('')

const categories = ref<string[]>([])
const prizes = ref<number[]>([])

const toggleMode = () => {
  isRegistering.value = !isRegistering.value
  userStore.error = null
}

const handleSubmit = async () => {
  try {
    if (isRegistering.value) {
      await userStore.register(username.value, email.value)
    } else {
      await userStore.login(email.value)
    }
    router.push('/dashboard')
  } catch (e) {}
}

onMounted(async () => {
  await quizStore.loadCategories()
  await quizStore.loadPrizeStructure()
  categories.value = quizStore.categories
  prizes.value = quizStore.prizeStructure
})
</script>

<style scoped>
.bg-grid-slate-100 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(148 163 184 / 0.1)'%3e%3cpath d='m0 .5H31.5V32'/%3e%3c/svg%3e");
}
</style>
