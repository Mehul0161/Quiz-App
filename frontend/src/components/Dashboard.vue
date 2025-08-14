<template>
	<div class="min-h-screen bg-neutral-950 p-4">
		<div class="max-w-4xl mx-auto">
			<!-- Header -->
			<div class="flex items-center justify-between mb-6">
				<div>
					<h1 class="text-2xl md:text-3xl font-bold text-white">Welcome back, {{ userStore.currentUser?.username }}!</h1>
					<p class="text-neutral-400 text-sm">Ready to win big today?</p>
				</div>
				<button @click="logout" class="btn-secondary text-xs">Logout</button>
			</div>

			<!-- Stats Overview -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
				<div class="card-compact border-2 border-indigo-500/30 bg-indigo-500/5 text-center">
					<div class="text-3xl mb-1">💰</div>
					<div class="text-xs text-neutral-300 mb-1">Total Earnings</div>
					<div class="text-lg font-bold text-indigo-400">${{ userStore.currentUser?.totalEarnings?.toLocaleString() || 0 }}</div>
				</div>
				<div class="card-compact border-2 border-green-500/30 bg-green-500/5 text-center">
					<div class="text-3xl mb-1">🎮</div>
					<div class="text-xs text-neutral-300 mb-1">Games Played</div>
					<div class="text-lg font-bold text-green-400">{{ userStore.currentUser?.gamesPlayed || 0 }}</div>
				</div>
				<div class="card-compact border-2 border-yellow-500/30 bg-yellow-500/5 text-center">
					<div class="text-3xl mb-1">🏆</div>
					<div class="text-xs text-neutral-300 mb-1">Best Score</div>
					<div class="text-lg font-bold text-yellow-400">${{ userStore.currentUser?.highestScore?.toLocaleString() || 0 }}</div>
				</div>
				<div class="card-compact border-2 border-purple-500/30 bg-purple-500/5 text-center">
					<div class="text-3xl mb-1">📈</div>
					<div class="text-xs text-neutral-300 mb-1">Success Rate</div>
					<div class="text-lg font-bold text-purple-400">{{ getWinRate() }}%</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<router-link to="/setup" class="card border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 text-white p-4 text-center transition-all duration-200 hover:scale-105 group">
					<div class="text-4xl mb-2 group-hover:animate-float">🎮</div>
					<h3 class="text-lg font-bold mb-1">Start New Game</h3>
					<p class="text-neutral-200 text-sm mb-2">Begin your journey to $1,000,000</p>
					<div class="inline-flex items-center gap-1 text-indigo-300 font-medium text-xs">
						Play Now <span class="group-hover:translate-x-1 transition-transform">→</span>
					</div>
				</router-link>

				<router-link to="/leaderboard" class="card border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 hover:from-yellow-600/30 hover:to-orange-600/30 text-white p-4 text-center transition-all duration-200 hover:scale-105 group">
					<div class="text-4xl mb-2 group-hover:animate-float">🏆</div>
					<h3 class="text-lg font-bold mb-1">View Leaderboard</h3>
					<p class="text-neutral-200 text-sm mb-2">See how you rank among others</p>
					<div class="inline-flex items-center gap-1 text-yellow-300 font-medium text-xs">
						Check Rankings <span class="group-hover:translate-x-1 transition-transform">→</span>
					</div>
				</router-link>

				<router-link to="/statistics" class="card border-2 border-green-500/50 bg-gradient-to-br from-green-600/20 to-teal-600/20 hover:from-green-600/30 hover:to-teal-600/30 text-white p-4 text-center transition-all duration-200 hover:scale-105 group">
					<div class="text-4xl mb-2 group-hover:animate-float">📊</div>
					<h3 class="text-lg font-bold mb-1">My Statistics</h3>
					<p class="text-neutral-200 text-sm mb-2">Check your detailed game stats</p>
					<div class="inline-flex items-center gap-1 text-green-300 font-medium text-xs">
						View My Stats <span class="group-hover:translate-x-1 transition-transform">→</span>
					</div>
				</router-link>
			</div>

			<!-- Recent Activity -->
			<div class="card">
				<h3 class="text-base font-bold text-white mb-3">Recent Activity</h3>
				<div v-if="userStore.currentUser?.gamesPlayed === 0" class="text-center text-neutral-400 py-6">
					<div class="text-3xl mb-2">🎯</div>
					<p class="text-sm">No games played yet. Start your first game!</p>
				</div>
				<div v-else class="space-y-2">
					<div class="flex items-center justify-between p-3 bg-neutral-800 rounded border border-neutral-700">
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 bg-indigo-600 rounded-full grid place-items-center text-white text-sm font-bold">🎮</div>
							<div>
								<div class="font-medium text-white text-sm">Last Game</div>
								<div class="text-xs text-neutral-400">Earned ${{ userStore.currentUser?.highestScore?.toLocaleString() || 0 }}</div>
							</div>
						</div>
						<div class="text-right">
							<div class="text-xs text-neutral-400">Best Score</div>
							<div class="font-bold text-green-400 text-sm">${{ userStore.currentUser?.highestScore?.toLocaleString() || 0 }}</div>
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
	if (!userStore.currentUser?.gamesPlayed || userStore.currentUser.gamesPlayed === 0) return 0;
	// A simple win is any game where the user earned more than $0.
	const wins = userStore.currentUser.gameHistory?.filter(game => game.score > 0).length || 0;
	return Math.round((wins / userStore.currentUser.gamesPlayed) * 100);
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
