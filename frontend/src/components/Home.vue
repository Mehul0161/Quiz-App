<template>
	<div class="min-h-screen bg-neutral-950">
		<!-- Hero -->
		<div class="relative max-w-4xl mx-auto px-4 pt-12 pb-8 text-center">
			<h1 class="text-4xl md:text-5xl font-bold text-white mb-3">Who Wants to Be a Millionaire?</h1>
			<p class="text-base md:text-lg text-neutral-400 mb-6">Create your account, learn the rules, and start your journey.</p>
			<div v-if="userStore.isLoggedIn" class="mb-4">
				<router-link to="/dashboard" class="btn-primary">Go to Dashboard</router-link>
			</div>
		</div>

		<!-- Auth + Rules -->
		<div class="max-w-4xl mx-auto px-4 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div class="card">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-bold text-white">Get Started</h2>
					<button @click="toggleMode" class="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
						{{ isRegistering ? 'Have an account? Sign in' : 'New here? Create an account' }}
					</button>
				</div>
				<form @submit.prevent="handleSubmit" class="space-y-4">
					<div v-if="isRegistering">
						<label class="block text-sm font-medium text-neutral-200 mb-2">Username</label>
						<input v-model="username" type="text" required class="input-field" placeholder="Choose a unique username" />
					</div>
					<div>
						<label class="block text-sm font-medium text-neutral-200 mb-2">Email</label>
						<input v-model="email" type="email" required class="input-field" placeholder="Enter your email" />
					</div>
					<div>
						<label class="block text-sm font-medium text-neutral-200 mb-2">Password</label>
						<input v-model="password" type="password" required class="input-field" placeholder="Enter your password" />
					</div>
					<button type="submit" :disabled="userStore.loading" class="btn-primary w-full">
						<LoadingSpinner v-if="userStore.loading" text="Processing..." />
						<span v-else>{{ isRegistering ? 'Create Account' : 'Sign In' }}</span>
					</button>
				</form>
				<div v-if="userStore.error" class="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-center text-red-300 text-sm">
					{{ userStore.error }}
				</div>
			</div>

			<div class="card">
				<h2 class="text-xl font-bold text-white mb-3">Rules</h2>
				<ul class="list-disc list-inside space-y-2 text-neutral-300 text-sm">
					<li>15 questions; prize ladder from $100 to $1,000,000.</li>
					<li>Progressive difficulty: easy → medium → hard → very hard.</li>
					<li>One-time lifelines: 50:50, Audience, Friend.</li>
					<li>Walk away anytime to keep winnings.</li>
				</ul>
				<h3 class="text-base font-semibold text-white mt-5 mb-3">Categories</h3>
				<div class="flex flex-wrap gap-2">
					<span v-for="c in categories" :key="c" class="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300">{{ c }}</span>
				</div>
				<h3 class="text-base font-semibold text-white mt-5 mb-3">Prize Structure</h3>
				<div class="grid grid-cols-3 md:grid-cols-5 gap-2">
					<div v-for="(p, i) in prizes" :key="i" class="p-2 text-center bg-neutral-800 border border-neutral-700 rounded text-sm">
						<span class="font-semibold text-indigo-300">${{ p.toLocaleString() }}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Features -->
		<div class="max-w-4xl mx-auto px-4 pb-12">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="card text-center">
					<div class="text-4xl mb-3">🤖</div>
					<h3 class="font-bold text-white text-lg mb-2">AI-Powered</h3>
					<p class="text-neutral-400 text-sm">Fresh challenges with lifelines included.</p>
				</div>
				<div class="card text-center">
					<div class="text-4xl mb-3">🏆</div>
					<h3 class="font-bold text-white text-lg mb-2">Compete</h3>
					<p class="text-neutral-400 text-sm">Climb the leaderboard.</p>
				</div>
				<div class="card text-center">
					<div class="text-4xl mb-3">🎯</div>
					<h3 class="font-bold text-white text-lg mb-2">Strategy</h3>
					<p class="text-neutral-400 text-sm">Walk away or risk it.</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import LoadingSpinner from './LoadingSpinner.vue'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const email = ref('')
const password = ref('')
const isRegistering = ref(true)

const categories = ['General Knowledge', 'Science', 'History', 'Geography', 'Entertainment', 'Sports']
const prizes = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000]

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
    
    // Redirect to dashboard on success
    router.push('/dashboard')
  } catch (error) {
    // Error is already set in the store
    console.error('Authentication failed:', error)
  }
}
</script>

<style scoped>
.bg-grid-slate-100 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(148 163 184 / 0.1)'%3e%3cpath d='m0 .5H31.5V32'/%3e%3c/svg%3e");
}
</style>
