<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
          {{ isRegistering ? 'Create Account' : 'Welcome Back' }}
        </h1>
        <p class="text-gray-300 text-sm">
          {{ isRegistering ? 'Join the challenge and win big!' : 'Sign in to continue your journey' }}
        </p>
      </div>

      <!-- Form Card -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="isRegistering">
            <label class="block text-xs font-semibold text-gray-200 mb-1">Username</label>
            <input 
              v-model="username" 
              type="text" 
              required 
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-1 focus:ring-purple-400 focus:border-transparent text-white placeholder-gray-300 transition-colors duration-200 text-sm" 
              placeholder="Choose a unique username" 
            />
          </div>
          
          <div>
            <label class="block text-xs font-semibold text-gray-200 mb-1">Email</label>
            <input 
              v-model="email" 
              type="email" 
              required 
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-1 focus:ring-purple-400 focus:border-transparent text-white placeholder-gray-300 transition-colors duration-200 text-sm" 
              placeholder="Enter your email" 
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-200 mb-1">Password</label>
            <input 
              v-model="password" 
              type="password" 
              required 
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-1 focus:ring-purple-400 focus:border-transparent text-white placeholder-gray-300 transition-colors duration-200 text-sm" 
              placeholder="Enter your password" 
            />
          </div>
          
          <button 
            type="submit" 
            :disabled="userStore.loading" 
            class="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white font-medium py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <LoadingSpinner v-if="userStore.loading" text="Processing..." />
            <span v-else>{{ isRegistering ? 'Create Account' : 'Sign In' }}</span>
          </button>
        </form>
        
        <!-- Toggle Mode -->
        <div class="mt-4 text-center">
          <button 
            @click="toggleMode" 
            class="text-xs text-purple-300 hover:text-purple-200 font-medium transition-colors"
          >
            {{ isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register' }}
          </button>
        </div>
        
        <!-- Error Display -->
        <div v-if="userStore.error" class="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-center text-red-300 text-xs">
          {{ userStore.error }}
        </div>
      </div>
      
      <!-- Back to Home -->
      <div class="text-center mt-4">
        <router-link to="/" class="text-xs text-gray-400 hover:text-white transition-colors">
          ← Back to Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../stores/user'
import LoadingSpinner from './LoadingSpinner.vue'

const userStore = useUserStore()

const username = ref('')
const email = ref('')
const password = ref('')
const isRegistering = ref(false)

const toggleMode = () => {
  isRegistering.value = !isRegistering.value
  userStore.error = null
}

const handleSubmit = async () => {
  try {
    if (isRegistering.value) {
      await userStore.register(username.value, email.value, password.value)
    } else {
      await userStore.login(email.value, password.value)
    }
    
    // Router guard will automatically redirect to dashboard
  } catch (error) {
    // Error is already set in the store
    console.error('Authentication failed:', error)
  }
}
</script>

<style scoped>
.container {
  max-width: 1200px;
}

.max-w-md {
  max-width: 28rem;
}

.w-full {
  width: 100%;
}

.space-y-6 > :not([hidden]) ~ :not([hidden]) {
  margin-top: 1.5rem;
}

.space-y-2 > :not([hidden]) ~ :not([hidden]) {
  margin-top: 0.5rem;
}

.focus\:outline-none:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.focus\:border-gold-400:focus {
  border-color: #fbbf24;
}

.focus\:ring-2:focus {
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.5);
}

.focus\:ring-gold-400:focus {
  --tw-ring-color: #fbbf24;
}

.focus\:ring-opacity-50:focus {
  --tw-ring-opacity: 0.5;
}

.disabled\:bg-gray-600:disabled {
  background-color: #4b5563;
}

.bg-red-600 {
  background-color: #dc2626;
}

.bg-opacity-20 {
  background-color: rgba(220, 38, 38, 0.2);
}

.border-red-500 {
  border-color: #ef4444;
}

.text-red-300 {
  color: #fca5a5;
}

.placeholder-gray-400::placeholder {
  color: #9ca3af;
}

.underline {
  text-decoration: underline;
}

.border-t {
  border-top-width: 1px;
}

.pt-6 {
  padding-top: 1.5rem;
}

.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}
</style>
