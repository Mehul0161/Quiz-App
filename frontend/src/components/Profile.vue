<template>
	<div class="min-h-screen bg-neutral-950 p-4">
		<div class="max-w-4xl mx-auto">
			<!-- Header -->
			<div class="text-center mb-6">
				<div class="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full grid place-items-center text-white text-2xl font-bold shadow-lg mx-auto mb-3">
					{{ userStore.currentUser?.username.charAt(0).toUpperCase() }}
				</div>
				<h1 class="text-2xl md:text-3xl font-bold text-white mb-1">{{ userStore.currentUser?.username }}</h1>
				<p class="text-neutral-400 text-sm">Member since {{ formatDate(userStore.currentUser?.createdAt) }}</p>
			</div>

			<!-- Stats Grid -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
				<div class="card-compact border-2 border-yellow-500/30 bg-yellow-500/5 text-center">
					<div class="text-3xl mb-1">💰</div>
					<div class="text-xs text-neutral-300 mb-1">Total Earnings</div>
					<div class="text-lg font-bold text-yellow-400">${{ userStore.currentUser?.totalEarnings?.toLocaleString() || 0 }}</div>
				</div>
				<div class="card-compact border-2 border-blue-500/30 bg-blue-500/5 text-center">
					<div class="text-3xl mb-1">🎮</div>
					<div class="text-xs text-neutral-300 mb-1">Games Played</div>
					<div class="text-lg font-bold text-blue-400">{{ userStore.currentUser?.gamesPlayed || 0 }}</div>
				</div>
				<div class="card-compact border-2 border-green-500/30 bg-green-500/5 text-center">
					<div class="text-3xl mb-1">🏆</div>
					<div class="text-xs text-neutral-300 mb-1">Best Score</div>
					<div class="text-lg font-bold text-green-400">${{ userStore.currentUser?.highestScore?.toLocaleString() || 0 }}</div>
				</div>
				<div class="card-compact border-2 border-purple-500/30 bg-purple-500/5 text-center">
					<div class="text-3xl mb-1">📈</div>
					<div class="text-xs text-neutral-300 mb-1">Win Rate</div>
					<div class="text-lg font-bold text-purple-400">{{ getWinRate() }}%</div>
				</div>
			</div>

			<!-- Game History -->
			<div class="card">
				<h3 class="text-lg font-bold text-white mb-3">Game History</h3>
				<div v-if="!userStore.currentUser?.gameHistory || userStore.currentUser.gameHistory.length === 0" class="text-center text-neutral-400 py-6">
					<div class="text-3xl mb-2">🎯</div>
					<p class="text-sm">No games played yet. Start your first game!</p>
				</div>
				<div v-else class="space-y-2">
					<div v-for="(game, index) in userStore.currentUser.gameHistory.slice(0, 5)" :key="index" class="flex items-center justify-between p-3 bg-neutral-800 rounded border border-neutral-700">
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 bg-indigo-600 rounded-full grid place-items-center text-white text-sm font-bold">🎮</div>
							<div>
								<div class="font-medium text-white text-sm">Game {{ index + 1 }}</div>
								<div class="text-xs text-neutral-400">Score: ${{ game.score?.toLocaleString() || 0 }}</div>
							</div>
						</div>
						<div class="text-right">
							<div class="text-xs text-neutral-400">{{ formatDate(game.date) }}</div>
							<div class="font-bold text-green-400 text-sm">${{ game.score?.toLocaleString() || 0 }}</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex justify-center gap-3 mt-6">
				<router-link to="/setup" class="btn-primary">Start New Game</router-link>
				<router-link to="/dashboard" class="btn-secondary">Back to Dashboard</router-link>
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

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
  }
})

const getWinRate = () => {
  if (!userStore.currentUser?.gamesPlayed || userStore.currentUser.gamesPlayed === 0) return 0
  // Simple calculation - you can make this more sophisticated
  return Math.round((userStore.currentUser.totalEarnings / (userStore.currentUser.gamesPlayed * 1000)) * 100)
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.container {
  max-width: 1200px;
}

.max-w-4xl {
  max-width: 56rem;
}

.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .md\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.gap-8 { gap: 2rem; }
.space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.75rem; }
.space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
.space-x-4 > :not([hidden]) ~ :not([hidden]) { margin-left: 1rem; }
.text-6xl { font-size: 3.75rem; line-height: 1; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-blue-400 { color: #60a5fa; }
.text-purple-400 { color: #c084fc; }
.text-gray-400 { color: #9ca3af; }
.bg-purple-600 { background-color: #9333ea; }
.bg-purple-700 { background-color: #7c3aed; }
.hover\:bg-purple-700:hover { background-color: #7c3aed; }
.bg-red-600 { background-color: #dc2626; }
.bg-red-700 { background-color: #b91c1c; }
.hover\:bg-red-700:hover { background-color: #b91c1c; }
.text-red-300 { color: #fca5a5; }
.text-red-200 { color: #fecaca; }
.border-red-500 { border-color: #ef4444; }
.bg-red-600 { background-color: #dc2626; }
.bg-opacity-20 { background-color: rgba(220, 38, 38, 0.2); }
.relative { position: relative; }
.w-full { width: 100%; }
.bg-gray-700 { background-color: #374151; }
.rounded-full { border-radius: 9999px; }
.h-4 { height: 1rem; }
.bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
.from-gold-400 { --tw-gradient-from: #fbbf24; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(251, 191, 36, 0)); }
.to-gold-600 { --tw-gradient-to: #d97706; }
.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.duration-500 { transition-duration: 500ms; }
.justify-between { justify-content: space-between; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.mb-8 { margin-bottom: 2rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mr-3 { margin-right: 0.75rem; }
.inline-block { display: inline-block; }
.text-green-400 { color: #4ade80; }
</style>
