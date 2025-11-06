<template>
  <div class="min-h-screen bg-neutral-950 p-4 sm:p-6">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2"><Trophy :size="28" class="text-yellow-500" /> Global Leaderboard</h1>
        <p class="text-neutral-400 text-sm">Top players competing for the $1M prize</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-neutral-400 mt-4 text-sm">Loading rankings...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="p-6 bg-red-600/20 border border-red-600/30 rounded-xl text-center">
        <p class="text-red-400 mb-3">{{ error }}</p>
        <button @click="loadLeaderboard" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
          Retry
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="leaderboard.length === 0" class="text-center py-12">
        <div class="mb-3 flex justify-center"><Gamepad2 :size="64" class="text-neutral-500" /></div>
        <p class="text-neutral-400 mb-4">No players yet. Be the first!</p>
        <router-link to="/" class="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
          Start Playing
        </router-link>
      </div>

      <!-- Leaderboard Table -->
      <div v-else class="space-y-6">
        <!-- Top 3 Champions -->
        <div v-if="leaderboard.length >= 1" class="mb-8">
          <h2 class="text-lg font-bold text-white mb-4">🏆 Top 3 Champions</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- 2nd Place -->
            <div v-if="leaderboard[1]" class="bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-center hover:border-neutral-600 transition">
              <div class="text-4xl mb-2">🥈</div>
              <div class="text-sm font-bold text-white mb-1">{{ leaderboard[1].username }}</div>
              <div class="text-xs text-neutral-400 mb-3">#2 Rank</div>
              <div class="space-y-1">
                <div class="text-lg font-bold text-yellow-400">{{ formatCurrency(leaderboard[1].totalEarnings) }}</div>
                <div class="text-xs text-neutral-400">{{ leaderboard[1].gamesPlayed }} games</div>
              </div>
            </div>

            <!-- 1st Place -->
            <div v-if="leaderboard[0]" class="bg-neutral-800 border-2 border-yellow-500 rounded-lg p-4 text-center hover:border-yellow-400 transition">
              <div class="text-4xl mb-2">👑</div>
              <div class="text-sm font-bold text-white mb-1">{{ leaderboard[0].username }}</div>
              <div class="text-xs text-yellow-400 mb-3 font-semibold">#1 Champion</div>
              <div class="space-y-1">
                <div class="text-lg font-bold text-yellow-400">{{ formatCurrency(leaderboard[0].totalEarnings) }}</div>
                <div class="text-xs text-neutral-400">{{ leaderboard[0].gamesPlayed }} games</div>
              </div>
            </div>

            <!-- 3rd Place -->
            <div v-if="leaderboard[2]" class="bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-center hover:border-neutral-600 transition">
              <div class="text-4xl mb-2">🥉</div>
              <div class="text-sm font-bold text-white mb-1">{{ leaderboard[2].username }}</div>
              <div class="text-xs text-neutral-400 mb-3">#3 Rank</div>
              <div class="space-y-1">
                <div class="text-lg font-bold text-yellow-400">{{ formatCurrency(leaderboard[2].totalEarnings) }}</div>
                <div class="text-xs text-neutral-400">{{ leaderboard[2].gamesPlayed }} games</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Your Ranking Section -->
        <div v-if="appStore.currentUser" class="bg-neutral-800 border border-indigo-500 rounded-lg p-4">
          <h2 class="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Trophy :size="16" class="text-indigo-400" /> Your Ranking
          </h2>
          <div v-if="userRanking" class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-neutral-900 rounded-lg p-3 text-center border border-neutral-700">
              <div class="text-xs text-neutral-400 mb-2">Your Rank</div>
              <div class="text-2xl font-bold text-indigo-400">#{{ userRanking.rank }}</div>
            </div>
            <div class="bg-neutral-900 rounded-lg p-3 text-center border border-neutral-700">
              <div class="text-xs text-neutral-400 mb-2">Total Earnings</div>
              <div class="text-lg font-bold text-yellow-400">{{ formatCurrency(userRanking.totalEarnings) }}</div>
            </div>
            <div class="bg-neutral-900 rounded-lg p-3 text-center border border-neutral-700">
              <div class="text-xs text-neutral-400 mb-2">Games Played</div>
              <div class="text-lg font-bold text-green-400">{{ userRanking.gamesPlayed }}</div>
            </div>
            <div class="bg-neutral-900 rounded-lg p-3 text-center border border-neutral-700">
              <div class="text-xs text-neutral-400 mb-2">Best Score</div>
              <div class="text-lg font-bold text-purple-400">{{ formatCurrency(userRanking.highestScore) }}</div>
            </div>
          </div>
          <div v-else class="text-center py-4 text-neutral-400 text-sm">
            Play some games to appear on the leaderboard!
          </div>
        </div>

        <!-- Top 100 Leaderboard -->
        <div class="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
          <h2 class="text-base font-bold text-white mb-4">📊 Top 100 Players</h2>
          <div v-if="leaderboard.length > 3" class="space-y-2">
            <!-- Table Header (Desktop) -->
            <div class="hidden md:grid md:grid-cols-12 gap-4 px-3 py-2 text-xs text-neutral-400 font-semibold border-b border-neutral-700">
              <div class="col-span-1">Rank</div>
              <div class="col-span-4">Player</div>
              <div class="col-span-2 text-right">Earnings</div>
              <div class="col-span-2 text-right">Best Score</div>
              <div class="col-span-3 text-right">Games</div>
            </div>

            <!-- Player Rows -->
            <div v-for="player in leaderboard.slice(3)" :key="player.username" class="bg-neutral-900 border border-neutral-700 rounded-lg p-3 hover:border-neutral-600 transition">
              <div class="hidden md:grid md:grid-cols-12 gap-4 items-center">
                <div class="col-span-1 font-bold text-white text-sm">#{{ player.rank }}</div>
                <div class="col-span-4">
                  <div class="font-semibold text-white text-sm">{{ player.username }}</div>
                </div>
                <div class="col-span-2 text-right">
                  <div class="font-bold text-yellow-400 text-sm">{{ formatCurrency(player.totalEarnings) }}</div>
                </div>
                <div class="col-span-2 text-right">
                  <div class="font-bold text-green-400 text-sm">{{ formatCurrency(player.highestScore) }}</div>
                </div>
                <div class="col-span-3 text-right">
                  <div class="text-neutral-400 text-sm">{{ player.gamesPlayed }}</div>
                </div>
              </div>

              <!-- Mobile View -->
              <div class="md:hidden flex items-center justify-between">
                <div class="flex items-center gap-3 flex-1">
                  <div class="font-bold text-white text-sm bg-neutral-700 rounded px-2 py-1 w-8 h-8 flex items-center justify-center">#{{ player.rank }}</div>
                  <div>
                    <div class="font-semibold text-white text-sm">{{ player.username }}</div>
                    <div class="text-xs text-neutral-400">{{ player.gamesPlayed }} games</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-yellow-400 text-sm">{{ formatCurrency(player.totalEarnings) }}</div>
                  <div class="text-xs text-neutral-400">earnings</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-6 text-neutral-400 text-sm">
            No additional players to display
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="!loading && leaderboard.length > 0" class="mt-6 text-center text-neutral-400 text-xs border-t border-neutral-700 pt-3">
        Showing top {{ leaderboard.length }} of {{ totalPlayers }} players worldwide
      </div>

      <!-- Back Button -->
      <router-link to="/" class="mt-4 block text-center text-indigo-400 hover:text-indigo-300 font-medium text-xs flex items-center justify-center gap-2">
        <ArrowLeft :size="14" /> Back to Home
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import { formatCurrency } from '../utils/constants'
import { Trophy, Gamepad2, ArrowLeft } from 'lucide-vue-next'
import { useAppStore } from '../stores/appStore'

interface LeaderboardEntry {
  rank: number
  username: string
  totalEarnings: number
  gamesPlayed: number
  highestScore: number
}

const appStore = useAppStore()
const leaderboard = ref<LeaderboardEntry[]>([])
const userRanking = ref<LeaderboardEntry | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const totalPlayers = ref(0)

const loadLeaderboard = async () => {
  loading.value = true
  error.value = null
  try {
    // Fetch top 100 leaderboard
    const response = await axios.get(`${API_BASE_URL}/leaderboard?limit=100`)
    leaderboard.value = response.data.leaderboard
    totalPlayers.value = response.data.totalPlayers

    // If user is logged in, fetch their ranking
    if (appStore.currentUser) {
      try {
        const userResponse = await axios.get(`${API_BASE_URL}/leaderboard?limit=10000`)
        const allPlayers = userResponse.data.leaderboard
        const currentUserRank = allPlayers.find((player: LeaderboardEntry) => player.username === appStore.currentUser?.username)
        if (currentUserRank) {
          userRanking.value = currentUserRank
        }
      } catch (userErr) {
        console.error('Failed to fetch user ranking:', userErr)
        // User might not be in leaderboard yet, which is fine
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load leaderboard'
  } finally {
    loading.value = false
  }
}

onMounted(loadLeaderboard)
</script>
