<template>
	<div class="min-h-screen bg-neutral-950">
		<div class="max-w-5xl mx-auto px-4 py-8">
      <!-- Header -->
			<div class="text-center mb-8">
				<div class="text-6xl mb-4">👤</div>
				<h1 class="text-3xl font-bold text-white mb-2">Player Profile</h1>
				<p class="text-neutral-400">Your journey to becoming a millionaire</p>
      </div>

			<div v-if="!userStore.isLoggedIn" class="card text-center">
				<div class="text-5xl mb-3">❌</div>
				<h1 class="text-xl font-bold text-red-300 mb-3">Access Denied</h1>
				<p class="text-red-200 mb-4">You must be logged in to view your profile!</p>
				<router-link to="/login" class="btn-primary">Login / Register</router-link>
      </div>

      <div v-else>
				<!-- Profile Header -->
				<div class="card mb-6">
					<div class="flex flex-col lg:flex-row items-center gap-6">
						<div class="w-24 h-24 bg-indigo-600 rounded-full grid place-items-center text-white text-4xl font-bold">
							{{ userStore.currentUser?.username.charAt(0).toUpperCase() }}
						</div>
						<div class="text-center lg:text-left">
							<h2 class="text-3xl font-bold text-white mb-2">{{ userStore.currentUser?.username }}</h2>
							<p class="text-neutral-300 text-sm mb-3">Member since {{ formatDate(userStore.currentUser?.createdAt) }}</p>
							<div class="flex flex-wrap gap-2 justify-center lg:justify-start">
								<span class="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded text-purple-300 text-sm font-semibold">
									🎮 Quiz Player
								</span>
								<span v-if="(userStore.currentUser?.totalEarnings || 0) >= 1000000" class="px-3 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded text-yellow-300 text-sm font-semibold">
									👑 Millionaire
								</span>
								<span v-else-if="(userStore.currentUser?.totalEarnings || 0) >= 100000" class="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded text-blue-300 text-sm font-semibold">
									⭐ Elite Player
								</span>
            </div>
          </div>
            </div>
          </div>
          
				<!-- Stats Grid -->
				<div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
					<div class="card-compact text-center">
						<div class="text-4xl mb-2">💰</div>
						<h3 class="font-bold text-neutral-300 text-sm mb-1">Total Earnings</h3>
						<p class="text-2xl font-bold text-yellow-400">${{ userStore.currentUser?.totalEarnings.toLocaleString() || 0 }}</p>
            </div>

					<div class="card-compact text-center">
						<div class="text-4xl mb-2">🎮</div>
						<h3 class="font-bold text-neutral-300 text-sm mb-1">Games Played</h3>
						<p class="text-2xl font-bold text-blue-400">{{ userStore.currentUser?.gamesPlayed || 0 }}</p>
          </div>
          
					<div class="card-compact text-center">
						<div class="text-4xl mb-2">🏆</div>
						<h3 class="font-bold text-neutral-300 text-sm mb-1">Best Score</h3>
						<p class="text-2xl font-bold text-green-400">${{ userStore.currentUser?.highestScore?.toLocaleString() || 0 }}</p>
            </div>

					<div class="card-compact text-center">
						<div class="text-4xl mb-2">📈</div>
						<h3 class="font-bold text-neutral-300 text-sm mb-1">Success Rate</h3>
						<p class="text-2xl font-bold text-purple-400">{{ getWinRate() }}%</p>
          </div>
        </div>

				<!-- Progress Section -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
					<!-- Millionaire Progress -->
					<div class="card">
						<h3 class="text-lg font-bold text-white mb-4 text-center">Millionaire Progress</h3>
						<div class="space-y-3">
							<div class="flex justify-between text-sm">
								<span class="text-neutral-300">Current: ${{ userStore.currentUser?.totalEarnings.toLocaleString() || 0 }}</span>
								<span class="text-neutral-300">Target: $1,000,000</span>
                    </div>
							<div class="w-full bg-neutral-800 rounded-full h-3 overflow-hidden border border-neutral-700">
								<div
									class="bg-indigo-600 h-3 transition-all duration-1000"
									:style="{ width: Math.min((userStore.currentUser?.totalEarnings || 0) / 1000000 * 100, 100) + '%' }"
								></div>
                  </div>
							<div class="text-center text-sm text-neutral-400">
								{{ Math.round((userStore.currentUser?.totalEarnings || 0) / 1000000 * 100) }}% Complete
              </div>
            </div>
          </div>

					<!-- Recent Achievements -->
					<div class="card">
						<h3 class="text-lg font-bold text-white mb-4 text-center">Recent Achievements</h3>
						<div class="space-y-2">
							<div v-if="(userStore.currentUser?.totalEarnings || 0) >= 1000000" class="flex items-center gap-3 p-3 bg-yellow-600/20 border border-yellow-500/30 rounded">
								<div class="text-xl">👑</div>
								<div>
									<div class="font-bold text-yellow-300 text-sm">Millionaire!</div>
									<div class="text-xs text-yellow-200">Reached $1,000,000 in earnings</div>
								</div>
                </div>
							<div v-if="(userStore.currentUser?.gamesPlayed || 0) >= 10" class="flex items-center gap-3 p-3 bg-blue-600/20 border border-blue-500/30 rounded">
								<div class="text-xl">🎯</div>
								<div>
									<div class="font-bold text-blue-300 text-sm">Veteran Player</div>
									<div class="text-xs text-blue-200">Played 10+ games</div>
                    </div>
                  </div>
							<div v-if="(userStore.currentUser?.highestScore || 0) >= 100000" class="flex items-center gap-3 p-3 bg-green-600/20 border border-green-500/30 rounded">
								<div class="text-xl">⭐</div>
								<div>
									<div class="font-bold text-green-300 text-sm">High Roller</div>
									<div class="text-xs text-green-200">Scored $100,000+ in a single game</div>
                </div>
              </div>
							<div v-if="!userStore.currentUser?.totalEarnings || userStore.currentUser?.totalEarnings < 100000" class="text-center text-neutral-400 py-3 text-sm">
								Keep playing to unlock achievements!
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
				<div class="text-center">
					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<router-link to="/setup" class="btn-primary">🎮 Play Again</router-link>
						<router-link to="/leaderboard" class="btn-secondary">🏆 View Leaderboard</router-link>
					</div>
        </div>
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
    router.push('/')
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
