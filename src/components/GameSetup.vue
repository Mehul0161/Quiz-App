<template>
  <div class="min-h-screen bg-gray-900 relative">
    <!-- Loading overlay -->
    <div v-if="quizStore.loading" class="fixed inset-0 bg-black/70 grid place-items-center z-50">
      <div class="text-center">
        <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <h2 class="text-white font-bold mb-1">Setting up the stage...</h2>
        <p class="text-gray-400 text-sm">Preparing your questions and lifelines</p>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-3 py-8">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-extrabold text-white mb-1">Choose Your Arena</h1>
        <p class="text-sm text-gray-400">Select a category to begin your challenge.</p>
      </div>

      <div v-if="!userStore.isLoggedIn" class="text-center mb-6">
        <div class="bg-red-900/40 border border-red-500/30 rounded p-5 max-w-md mx-auto">
          <p class="text-red-300 mb-3 text-sm">You must be logged in to play!</p>
          <router-link to="/login" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Sign In / Register</router-link>
        </div>
      </div>

      <div v-else>
        <div class="bg-black/20 rounded border border-gray-700 p-5 mb-6">
          <h2 class="text-lg font-bold text-white mb-4 text-center">Select a Category</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              v-for="category in quizStore.categories"
              :key="category"
              @click="selectedCategory = category"
              :class="[
                'p-4 rounded border text-center text-sm transition-colors',
                selectedCategory === category ? 'border-indigo-500 bg-indigo-600/20' : 'border-gray-600 hover:border-indigo-500 bg-gray-700/40'
              ]"
            >
              <div class="font-semibold text-gray-200">{{ category }}</div>
            </button>
          </div>
        </div>

        <div v-if="selectedCategory" class="text-center">
          <p class="text-sm text-gray-300 mb-4">
            Selected: <span class="font-bold text-indigo-300">{{ selectedCategory }}</span>
          </p>

          <button
            @click="startGame"
            :disabled="quizStore.loading"
            class="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-sm disabled:opacity-50"
          >
            <span v-if="quizStore.loading">Generating Quiz...</span>
            <span v-else>Start</span>
          </button>

          <div v-if="quizStore.error" class="mt-4 bg-red-900/40 border border-red-500/30 rounded p-3 max-w-md mx-auto text-sm text-red-300">
            {{ quizStore.error }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useQuizStore } from '../stores/quiz'

const router = useRouter()
const userStore = useUserStore()
const quizStore = useQuizStore()

const selectedCategory = ref('')

const startGame = async () => {
  if (!selectedCategory.value) return
  try {
    await quizStore.generateQuiz(selectedCategory.value)
    quizStore.startGame()
    router.push('/game')
  } catch (error) {}
}
</script>
