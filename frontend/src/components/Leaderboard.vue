<template>
  <div class="min-h-screen bg-gray-900">
    <div class="max-w-4xl mx-auto px-4 py-6">
      <div class="text-center mb-4">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-1">Global Leaderboard</h1>
        <p class="text-xs text-gray-400">See how you rank among the best.</p>
      </div>

      <div class="bg-black/20 rounded border border-gray-700 p-4">
        <div v-if="loading" class="text-center py-8">
          <div class="w-6 h-6 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p class="text-gray-400 text-xs">Loading leaderboard...</p>
        </div>

        <div v-else-if="error" class="text-center py-6">
          <p class="text-red-400 text-xs mb-3">{{ error }}</p>
          <button @click="loadLeaderboard" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs">Retry</button>
        </div>

        <div v-else-if="leaderboard.length === 0" class="text-center py-6">
          <p class="text-gray-400 text-xs mb-3">No players yet. Be the first!</p>
          <router-link to="/setup" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs">Start Playing</router-link>
        </div>

        <div v-else class="overflow-x-auto">
          <!-- Mobile view - cards -->
          <div class="md:hidden space-y-2">
            <div v-for="player in leaderboard" :key="player.username" class="bg-gray-800/40 rounded border border-gray-700 p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="font-bold text-lg" :class="getRankColor(player.rank)">#{{ player.rank }}</span>
                <span class="font-semibold text-white text-sm">{{ player.username }}</span>
              </div>
              <div class="grid grid-cols-3 gap-2 text-xs">
                <div class="text-center">
                  <div class="text-gray-400">Earnings</div>
                  <div class="font-bold text-indigo-300">${{ player.totalEarnings.toLocaleString() }}</div>
                </div>
                <div class="text-center">
                  <div class="text-gray-400">Games</div>
                  <div class="font-semibold text-gray-300">{{ player.gamesPlayed }}</div>
                </div>
                <div class="text-center">
                  <div class="text-gray-400">Best</div>
                  <div class="font-semibold text-green-300">${{ player.highestScore.toLocaleString() }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop view - table -->
          <table class="hidden md:table w-full text-xs">
            <thead class="border-b border-gray-700">
              <tr class="text-gray-400">
                <th class="px-3 py-2 text-left font-bold">Rank</th>
                <th class="px-3 py-2 text-left font-bold">Player</th>
                <th class="px-3 py-2 text-right font-bold">Total Earnings</th>
                <th class="px-3 py-2 text-right font-bold">Games</th>
                <th class="px-3 py-2 text-right font-bold">Best Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="player in leaderboard" :key="player.username" class="border-b border-gray-800 hover:bg-gray-800/40">
                <td class="px-3 py-2 font-bold" :class="getRankColor(player.rank)">#{{ player.rank }}</td>
                <td class="px-3 py-2 font-semibold text-white">{{ player.username }}</td>
                <td class="px-3 py-2 text-right font-bold text-indigo-300">${{ player.totalEarnings.toLocaleString() }}</td>
                <td class="px-3 py-2 text-right text-gray-300 font-semibold">{{ player.gamesPlayed }}</td>
                <td class="px-3 py-2 text-right text-green-300 font-semibold">${{ player.highestScore.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '../config'

interface LeaderboardEntry {
  rank: number
  username: string
  totalEarnings: number
  gamesPlayed: number
  highestScore: number
}

const leaderboard = ref<LeaderboardEntry[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const getRankColor = (rank: number) => {
  if (rank === 1) return 'text-yellow-400'
  if (rank === 2) return 'text-gray-300'
  if (rank === 3) return 'text-amber-400'
  return 'text-gray-400'
}

const loadLeaderboard = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await axios.get(`${API_BASE_URL}/leaderboard`)
    leaderboard.value = response.data.leaderboard
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load leaderboard'
  } finally {
    loading.value = false
  }
}

onMounted(loadLeaderboard)
</script>
