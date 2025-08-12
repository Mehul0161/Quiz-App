<template>
  <div class="min-h-screen bg-gray-900">
    <div class="max-w-6xl mx-auto px-3 py-8">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-extrabold text-white mb-1">Global Leaderboard</h1>
        <p class="text-sm text-gray-400">See how you rank among the best.</p>
      </div>

      <div class="bg-black/20 rounded border border-gray-700 p-5">
        <div v-if="loading" class="text-center py-12">
          <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-gray-400 text-sm">Loading leaderboard...</p>
        </div>

        <div v-else-if="error" class="text-center py-8">
          <p class="text-red-400 text-sm mb-4">{{ error }}</p>
          <button @click="loadLeaderboard" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm">Retry</button>
        </div>

        <div v-else-if="leaderboard.length === 0" class="text-center py-8">
          <p class="text-gray-400 text-sm mb-4">No players yet. Be the first!</p>
          <router-link to="/setup" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm">Start Playing</router-link>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-700">
              <tr class="text-gray-400">
                <th class="px-4 py-3 text-left font-bold">Rank</th>
                <th class="px-4 py-3 text-left font-bold">Player</th>
                <th class="px-4 py-3 text-right font-bold">Total Earnings</th>
                <th class="px-4 py-3 text-right font-bold">Games</th>
                <th class="px-4 py-3 text-right font-bold">Best Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="player in leaderboard" :key="player.username" class="border-b border-gray-800 hover:bg-gray-800/40">
                <td class="px-4 py-3 font-extrabold" :class="getRankColor(player.rank)">#{{ player.rank }}</td>
                <td class="px-4 py-3 font-semibold text-white">{{ player.username }}</td>
                <td class="px-4 py-3 text-right font-bold text-indigo-300">${{ player.totalEarnings.toLocaleString() }}</td>
                <td class="px-4 py-3 text-right text-gray-300 font-semibold">{{ player.gamesPlayed }}</td>
                <td class="px-4 py-3 text-right text-green-300 font-semibold">${{ player.highestScore.toLocaleString() }}</td>
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
import { useUserStore } from '../stores/user'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const userStore = useUserStore()

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
