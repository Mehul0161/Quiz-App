<template>
	<div class="min-h-screen bg-neutral-950 grid place-items-center p-4">
		<div class="card text-center">
			<h1 class="text-xl font-bold text-white mb-2">Signing you in...</h1>
			<p class="text-neutral-400 text-sm">Please wait, completing authentication.</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/appStore'
import axios from 'axios'

const router = useRouter()
const appStore = useAppStore()

onMounted(async () => {
	try {
		const params = new URLSearchParams(window.location.search)
		const token = params.get('token')
		if (token) {
			localStorage.setItem('quiz_token', token)
			axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
			// Fetch user data - this will update the store state
			await appStore.fetchCurrentUser()
			// Small delay to ensure state updates propagate
			await new Promise(resolve => setTimeout(resolve, 100))
			router.replace('/dashboard')
			return
		}
		router.replace('/')
	} catch (e) {
		console.error('OAuth callback error', e)
		router.replace('/')
	}
})
</script>



