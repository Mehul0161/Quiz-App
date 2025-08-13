<script setup lang="ts">
import { onMounted } from 'vue';
import { useHealthStore } from './stores/health';

const healthStore = useHealthStore();

onMounted(() => {
  healthStore.checkBackendStatus();
});
</script>

<template>
  <div class="bg-gray-900 text-white min-h-screen">
    <!-- Optional: Display a global status indicator -->
    <div v-if="healthStore.loading" class="bg-blue-600 text-center text-xs py-1">
      Checking backend connection...
    </div>
    <div v-if="!healthStore.loading && !healthStore.backendConnected" class="bg-red-600 text-center text-xs py-1">
      Error: Could not connect to the backend. {{ healthStore.error }}
    </div>
    <div v-if="!healthStore.loading && healthStore.backendConnected" class="bg-green-600 text-center text-xs py-1">
      Successfully connected to the backend.
    </div>
    
    <header class="bg-black/20 backdrop-blur-sm border-b border-gray-700">
      <nav class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="font-bold text-xl text-white">QuizMillionaire</router-link>
          </div>
          <div class="flex items-center space-x-4">
            <router-link to="/leaderboard" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Leaderboard</router-link>
            <router-link to="/profile" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Profile</router-link>
          </div>
        </div>
      </nav>
    </header>

    <main>
      <router-view />
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
</style>
