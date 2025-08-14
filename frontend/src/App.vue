<script setup lang="ts">
import { useRoute } from 'vue-router'
// No health store needed anymore
const route = useRoute()
</script>

<template>
  <div class="bg-gray-900 text-white min-h-screen">
    <header v-if="route.path !== '/game'" class="bg-black/20 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <nav class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-12">
          <div class="flex items-center">
            <router-link to="/" class="font-bold text-lg text-white hover:text-indigo-300 transition-colors">QuizMillionaire</router-link>
          </div>
          <div class="flex items-center space-x-3">
            <router-link to="/leaderboard" class="text-gray-300 hover:text-white px-2 py-1 rounded text-xs font-medium transition-colors">Leaderboard</router-link>
            <router-link to="/profile" class="text-gray-300 hover:text-white px-2 py-1 rounded text-xs font-medium transition-colors">Profile</router-link>
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
