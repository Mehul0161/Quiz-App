<template>
  <div class="min-h-screen bg-gray-900">
    <div class="max-w-6xl mx-auto px-3 py-8">
      <div class="bg-black/20 rounded-md border border-gray-700 p-4 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-indigo-600 rounded-md grid place-items-center text-white text-lg font-bold">
              {{ userStore.currentUser?.username.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h1 class="text-xl font-extrabold text-white">Game Console</h1>
              <p class="text-gray-400 text-xs">Welcome, {{ userStore.currentUser?.username }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <router-link to="/leaderboard" class="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded text-xs border border-gray-600">Leaderboard</router-link>
            <button @click="logout" class="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded text-xs border border-red-500/20">Logout</button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 bg-black/20 rounded-md border border-gray-700 p-5">
          <div class="text-center mb-5">
            <div class="text-gray-400 text-xs mb-1">Next Objective</div>
            <div class="text-2xl font-extrabold text-white">Become a Millionaire</div>
          </div>
          <div class="flex flex-col sm:flex-row justify-center gap-3 mb-5">
            <router-link to="/setup" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-sm">Start New Game</router-link>
            <router-link to="/game" class="px-6 py-2.5 bg-gray-700/50 hover:bg-gray-700 text-white font-semibold rounded text-sm border border-gray-600">Resume</router-link>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="bg-gray-800/30 border border-gray-700 rounded p-4 text-center">
              <div class="text-2xl mb-1">💰</div>
              <div class="text-xl font-extrabold text-white">${{ userStore.currentUser?.totalEarnings.toLocaleString() || 0 }}</div>
              <div class="text-gray-400 text-xs">Total Earnings</div>
            </div>
            <div class="bg-gray-800/30 border border-gray-700 rounded p-4 text-center">
              <div class="text-2xl mb-1">🎮</div>
              <div class="text-xl font-extrabold text-white">{{ userStore.currentUser?.gamesPlayed || 0 }}</div>
              <div class="text-gray-400 text-xs">Games Played</div>
            </div>
            <div class="bg-gray-800/30 border border-gray-700 rounded p-4 text-center">
              <div class="text-2xl mb-1">🏆</div>
              <div class="text-xl font-extrabold text-white">${{ userStore.currentUser?.highestScore?.toLocaleString() || 0 }}</div>
              <div class="text-gray-400 text-xs">Best Score</div>
            </div>
          </div>
        </div>
        
        <div class="space-y-3">
          <div class="bg-black/20 rounded-md border border-gray-700 p-4">
            <h3 class="text-white font-bold mb-2 text-sm">Quick Links</h3>
            <div class="flex flex-col gap-2">
              <router-link to="/setup" class="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-200 rounded border border-gray-600 text-xs">Choose Category</router-link>
              <router-link to="/leaderboard" class="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-200 rounded border border-gray-600 text-xs">Leaderboard</router-link>
              <router-link to="/profile" class="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-200 rounded border border-gray-600 text-xs">Profile</router-link>
            </div>
          </div>
          <div class="bg-black/20 rounded-md border border-gray-700 p-4">
            <h3 class="text-white font-bold mb-2 text-sm">Rules Recap</h3>
            <ul class="list-disc list-inside text-gray-300 space-y-1 text-xs">
              <li>15 questions, progressive difficulty.</li>
              <li>50:50, Audience, Friend (once each).</li>
              <li>Walk away anytime.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const logout = () => {
  userStore.logout()
  router.push('/')
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/')
  }
})
</script>
