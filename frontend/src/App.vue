<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'
import { useQuizStore } from './stores/quiz'

const userStore = useUserStore()
const quizStore = useQuizStore()

onMounted(() => {
  userStore.loadUserFromStorage()
  quizStore.loadCategories()
  quizStore.loadPrizeStructure()
})
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-900 text-gray-200">
    <nav class="bg-black/40 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-3">
        <div class="flex justify-between items-center h-14">
          <router-link to="/" class="flex items-center gap-2">
            <div class="w-8 h-8 bg-indigo-600 rounded-md grid place-items-center">💰</div>
            <span class="font-bold text-white tracking-wide">MILLIONAIRE</span>
          </router-link>
          <div class="flex items-center gap-2">
            <router-link to="/leaderboard" class="px-2.5 py-1.5 text-sm rounded-md text-gray-300 hover:text-white hover:bg-gray-800">🏆 Leaderboard</router-link>
            <template v-if="userStore.isLoggedIn">
              <div class="px-2.5 py-1.5 bg-yellow-500 text-black rounded text-sm font-bold">${{ userStore.currentUser?.totalEarnings.toLocaleString() }}</div>
              <button @click="userStore.logout()" class="px-2.5 py-1.5 text-sm rounded-md text-red-300 hover:bg-red-900/40">Logout</button>
            </template>
            <router-link v-else to="/login" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded">Sign In</router-link>
          </div>
        </div>
      </div>
    </nav>

    <main>
      <router-view />
    </main>

    <footer class="border-t border-gray-800 mt-8">
      <div class="max-w-6xl mx-auto px-3 py-4 text-center text-xs text-gray-500">
        © 2024 Millionaire Quiz
      </div>
    </footer>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background-color: #111827; /* bg-gray-900 */
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
