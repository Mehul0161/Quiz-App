<template>
	<div class="min-h-screen bg-neutral-950 p-4 sm:p-6">
		<div class="max-w-7xl mx-auto">
			<!-- Header -->
			<div class="mb-10">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-4xl sm:text-5xl font-bold text-white mb-2">
                        Welcome, <span class="text-yellow-400">{{ appStore.isGuest ? 'Guest' : (appStore.currentUser?.username || 'Guest') }}</span>
                    </h1>
						<p class="text-neutral-300 text-base font-medium">Ready to climb the leaderboard?</p>
					</div>
                <div class="flex items-center gap-3">
                    <button v-if="appStore.isGuest" @click="router.push({ path: '/', query: { auth: '1' } })" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition">
                        Sign In
                    </button>
                </div>
				</div>
			</div>

			<!-- Main Stats Grid -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<!-- Total Earnings -->
				<div class="p-6 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-yellow-500/50 transition-all duration-300">
					<div class="flex items-center gap-2 mb-3">
						<div class="p-2 bg-yellow-500/10 rounded-lg"><Coins :size="18" class="text-yellow-400" /></div>
						<div class="text-sm text-neutral-300 font-semibold">Total Earnings</div>
					</div>
					<div class="text-3xl font-bold text-yellow-400 mb-2">{{ formatCurrency(appStore.currentUser?.totalEarnings || 0) }}</div>
					<div class="text-xs text-neutral-400">{{ appStore.currentUser?.gamesPlayed || 0 }} games played</div>
				</div>

				<!-- Games Played -->
				<div class="p-6 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-green-500/50 transition-all duration-300">
					<div class="flex items-center gap-2 mb-3">
						<div class="p-2 bg-green-500/10 rounded-lg"><Gamepad2 :size="18" class="text-green-400" /></div>
						<div class="text-sm text-neutral-300 font-semibold">Games Played</div>
					</div>
					<div class="text-3xl font-bold text-green-400 mb-2">{{ appStore.currentUser?.gamesPlayed || 0 }}</div>
					<div class="text-xs text-neutral-400">Avg: {{ getAverageScore() }}</div>
				</div>

				<!-- Best Score -->
				<div class="p-6 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-purple-500/50 transition-all duration-300">
					<div class="flex items-center gap-2 mb-3">
						<div class="p-2 bg-purple-500/10 rounded-lg"><Trophy :size="18" class="text-purple-400" /></div>
						<div class="text-sm text-neutral-300 font-semibold">Best Score</div>
					</div>
					<div class="text-3xl font-bold text-purple-400 mb-2">{{ formatCurrency(appStore.currentUser?.highestScore || 0) }}</div>
					<div class="text-xs text-neutral-400">Personal best</div>
				</div>

				<!-- Achievements -->
				<div class="p-6 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-indigo-500/50 transition-all duration-300">
					<div class="flex items-center gap-2 mb-3">
						<div class="p-2 bg-indigo-500/10 rounded-lg"><Star :size="18" class="text-indigo-400" /></div>
						<div class="text-sm text-neutral-300 font-semibold">Achievements</div>
					</div>
					<div class="text-3xl font-bold text-indigo-400 mb-2">{{ appStore.currentUser?.achievements?.length || 0 }}</div>
					<div class="text-xs text-neutral-400 truncate" v-if="appStore.currentUser?.achievements?.length">{{ appStore.currentUser.achievements.join(', ') }}</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				<router-link to="/setup" class="p-6 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg">
					<div class="mb-4 flex justify-center">
						<div class="p-3 bg-indigo-500/10 rounded-lg"><Gamepad2 :size="32" class="text-indigo-400" /></div>
					</div>
					<h3 class="text-lg font-bold text-white mb-2">Play Now</h3>
					<p class="text-neutral-400 text-sm">Start a new game and earn virtual money</p>
				</router-link>

				<router-link to="/leaderboard" class="p-6 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg">
					<div class="mb-4 flex justify-center">
						<div class="p-3 bg-yellow-500/10 rounded-lg"><Trophy :size="32" class="text-yellow-400" /></div>
					</div>
					<h3 class="text-lg font-bold text-white mb-2">Leaderboard</h3>
					<p class="text-neutral-400 text-sm">See where you rank globally</p>
				</router-link>

				<router-link to="/statistics" class="p-6 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-green-500/50 transition-all duration-300 hover:shadow-lg">
					<div class="mb-4 flex justify-center">
						<div class="p-3 bg-green-500/10 rounded-lg"><BarChart3 :size="32" class="text-green-400" /></div>
					</div>
					<h3 class="text-lg font-bold text-white mb-2">Statistics</h3>
					<p class="text-neutral-400 text-sm">View detailed game history</p>
				</router-link>
			</div>

			<!-- Recent Activity -->
			<div class="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
				<h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
					<ScrollText :size="20" class="text-indigo-400" /> Recent Games
				</h2>
				<div v-if="!appStore.currentUser?.gameHistory || appStore.currentUser.gameHistory.length === 0" class="text-center py-12">
					<div class="mb-3 flex justify-center"><Target :size="48" class="text-neutral-500" /></div>
					<p class="text-neutral-400 mb-4">No games yet. Start your first game!</p>
					<router-link to="/setup" class="inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition">
						Play Now
					</router-link>
				</div>
				<div v-else class="space-y-3">
					<div v-for="(game, idx) in appStore.currentUser.gameHistory.slice().reverse().slice(0, 5)" :key="idx" class="p-4 bg-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-between hover:border-neutral-600 transition">
						<div class="flex items-center gap-4 flex-1">
							<div class="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex items-center justify-center">
								<component :is="getGameModeIcon(game.gameMode)" :size="24" class="text-indigo-400" />
							</div>
							<div class="flex-1">
								<div class="font-medium text-white text-sm">{{ game.category }}</div>
								<div class="text-xs text-neutral-400">{{ getGameModeName(game.gameMode) }} • {{ formatDate(game.playedAt) }} • {{ game.questionsAnswered }} Q</div>
							</div>
						</div>
						<div class="text-right">
							<div class="font-bold text-lg" :class="game.gameMode === 'rapidfire' ? 'text-green-400' : 'text-yellow-400'">
								{{ formatCurrency(game.score) }}
							</div>
							<div v-if="game.gameMode === 'rapidfire'" class="text-xs text-green-400">Rapid Fire</div>
						</div>
					</div>
					<router-link to="/statistics" class="mt-4 text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
						View all games <Rocket :size="14" />
					</router-link>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import { formatCurrency, formatDate } from '../utils/constants'
import { Coins, Gamepad2, Trophy, Star, ScrollText, Target, Rocket, BarChart3 } from 'lucide-vue-next'
import { getGameModeIcon } from '../utils/icons'

const router = useRouter()
const appStore = useAppStore()

const getGameModeName = (mode: string) => {
	switch(mode) {
		case 'normal': return 'Normal'
		case 'rapidfire': return 'Rapid Fire'
		case 'nooptions': return 'No Options'
		default: return mode
	}
}

const getAverageScore = () => {
	const gamesPlayed = appStore.currentUser?.gamesPlayed || 0
	const totalEarnings = appStore.currentUser?.totalEarnings || 0
	return gamesPlayed > 0 ? formatCurrency(Math.round(totalEarnings / gamesPlayed)) : '$0'
}
</script>
