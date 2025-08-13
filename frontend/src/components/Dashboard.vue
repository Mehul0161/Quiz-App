<template>
	<div class="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4">
		<div class="max-w-6xl mx-auto">
			<!-- Header -->
			<div class="text-center mb-8">
				<h1 class="text-4xl md:text-5xl font-bold text-white mb-4 animate-float">
					👋 Welcome, {{ userStore.currentUser?.username }}!
				</h1>
				<p class="text-xl text-neutral-400">Ready to become a millionaire? Your journey starts here!</p>
			</div>

			<!-- Main Stats -->
			<div class="card border-2 border-neutral-700 mb-8">
				<div class="flex flex-col md:flex-row items-center gap-6 mb-6">
					<div class="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full grid place-items-center text-white text-4xl font-bold shadow-lg animate-glow">
						{{ userStore.currentUser?.username.charAt(0).toUpperCase() }}
					</div>
					<div class="text-center md:text-left flex-1">
						<h2 class="text-3xl font-bold text-white mb-2">{{ userStore.currentUser?.username }}</h2>
						<p class="text-neutral-400">Member since {{ formatDate(userStore.currentUser?.createdAt) }}</p>
					</div>
					<div>
						<button @click="logout" class="btn-secondary px-6 py-3 font-bold hover:scale-105 transform transition-all duration-300">
							🚪 Logout
						</button>
					</div>
				</div>

				<div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
					<div class="text-center card-compact border-2 border-yellow-500/30 bg-yellow-500/5 hover:scale-105 transform transition-all duration-300 hover:shadow-lg">
						<div class="text-5xl mb-3 animate-float">💰</div>
						<div class="text-sm text-neutral-300 mb-1">Total Earnings</div>
						<div class="text-2xl font-bold text-yellow-400">${{ userStore.currentUser?.totalEarnings.toLocaleString() || 0 }}</div>
					</div>

					<div class="text-center card-compact border-2 border-blue-500/30 bg-blue-500/5 hover:scale-105 transform transition-all duration-300 hover:shadow-lg">
						<div class="text-5xl mb-3 animate-float">🎮</div>
						<div class="text-sm text-neutral-300 mb-1">Games Played</div>
						<div class="text-2xl font-bold text-blue-400">{{ userStore.currentUser?.gamesPlayed || 0 }}</div>
					</div>

					<div class="text-center card-compact border-2 border-green-500/30 bg-green-500/5 hover:scale-105 transform transition-all duration-300 hover:shadow-lg">
						<div class="text-5xl mb-3 animate-float">🏆</div>
						<div class="text-sm text-neutral-300 mb-1">Best Score</div>
						<div class="text-2xl font-bold text-green-400">${{ userStore.currentUser?.highestScore?.toLocaleString() || 0 }}</div>
					</div>

					<div class="text-center card-compact border-2 border-purple-500/30 bg-purple-500/5 hover:scale-105 transform transition-all duration-300 hover:shadow-lg">
						<div class="text-5xl mb-3 animate-float">📈</div>
						<div class="text-sm text-neutral-300 mb-1">Success Rate</div>
						<div class="text-2xl font-bold text-purple-400">{{ getWinRate() }}%</div>
					</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
				<router-link to="/setup" class="card border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 text-white p-8 text-center transition-all duration-300 hover:scale-105 transform hover:shadow-2xl group">
					<div class="text-6xl mb-4 group-hover:animate-float">🎮</div>
					<h3 class="text-2xl font-bold mb-3">Start New Game</h3>
					<p class="text-neutral-200 text-lg mb-4">Begin your journey to $1,000,000</p>
					<div class="inline-flex items-center gap-2 text-indigo-300 font-semibold">
						Play Now <span class="group-hover:translate-x-1 transition-transform">→</span>
					</div>
				</router-link>

				<router-link to="/leaderboard" class="card border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 hover:from-yellow-600/30 hover:to-orange-600/30 text-white p-8 text-center transition-all duration-300 hover:scale-105 transform hover:shadow-2xl group">
					<div class="text-6xl mb-4 group-hover:animate-float">🏆</div>
					<h3 class="text-2xl font-bold mb-3">View Leaderboard</h3>
					<p class="text-neutral-200 text-lg mb-4">See how you rank among others</p>
					<div class="inline-flex items-center gap-2 text-yellow-300 font-semibold">
						Check Rankings <span class="group-hover:translate-x-1 transition-transform">→</span>
					</div>
				</router-link>
			</div>

			<!-- Recent Activity -->
			<div class="card">
				<h3 class="text-lg font-bold text-white mb-4">Recent Activity</h3>
				<div v-if="userStore.currentUser?.gamesPlayed === 0" class="text-center text-neutral-400 py-8">
					<div class="text-5xl mb-3">🎯</div>
					<p>No games played yet. Start your first game!</p>
				</div>
				<div v-else class="space-y-3">
					<div class="flex items-center justify-between p-4 bg-neutral-800 rounded-lg border border-neutral-700">
						<div class="flex items-center gap-4">
							<div class="w-10 h-10 bg-indigo-600 rounded-full grid place-items-center text-white text-lg font-bold">🎮</div>
							<div>
								<div class="font-semibold text-white">Last Game</div>
								<div class="text-sm text-neutral-400">Earned ${{ userStore.currentUser?.highestScore?.toLocaleString() || 0 }}</div>
							</div>
						</div>
						<div class="text-right">
							<div class="text-sm text-neutral-400">Best Score</div>
							<div class="font-bold text-green-400">${{ userStore.currentUser?.highestScore?.toLocaleString() || 0 }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

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
		day: 'numeric',
	})
}

const logout = () => {
	userStore.logout()
	router.push('/login')
}
</script>
