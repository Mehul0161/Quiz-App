<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">
          {{ isRegistering ? 'Create Your Account' : 'Welcome Back' }}
        </h1>
        <p class="text-gray-400">
          {{ isRegistering ? 'Join the challenge and win big!' : 'Sign in to continue your journey.' }}
        </p>
      </div>

      <!-- Form Card -->
      <div class="bg-black/20 rounded-lg shadow-lg border border-gray-700 p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div v-if="isRegistering">
            <label class="block text-sm font-semibold text-gray-300 mb-2">Username</label>
            <input
              v-model="username"
              type="text"
              required
              class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
              placeholder="Choose a unique username"
            />
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
              placeholder="Enter your email"
            />
          </div>
          
          <button
            type="submit"
            :disabled="userStore.loading"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            <span v-if="userStore.loading">Processing...</span>
            <span v-else>{{ isRegistering ? 'Create Account' : 'Sign In' }}</span>
          </button>
        </form>

        <!-- Toggle Mode -->
        <div class="mt-6 text-center text-sm">
          <span class="text-gray-400">
            {{ isRegistering ? 'Already have an account?' : 'New here?' }}
          </span>
          <button 
            @click="toggleMode" 
            class="ml-1 text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            {{ isRegistering ? 'Sign in' : 'Create an account' }}
          </button>
        </div>

        <!-- Error Display -->
        <div v-if="userStore.error" class="mt-6 p-4 bg-red-900/50 border border-red-500/30 rounded-lg">
          <p class="text-red-300 text-center">{{ userStore.error }}</p>
        </div>
      </div>
      
      <!-- Back to Home -->
      <div class="mt-8 text-center">
        <router-link 
          to="/" 
          class="text-gray-500 hover:text-gray-300 text-sm transition-colors font-semibold"
        >
          ← Back to Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const isRegistering = ref(true)
const username = ref('')
const email = ref('')

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
  } catch (error) {
    console.error('Authentication error:', error)
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
