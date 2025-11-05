<template>
  <div class="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 p-4 sm:p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3"><Trophy :size="40" /> Global Leaderboard</h1>
        <p class="text-neutral-400">Top players competing for the $1M prize</p>
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
      <div v-else class="space-y-3">
        <!-- Top 3 Featured Cards -->
        <div v-if="leaderboard.length >= 1" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <template v-for="rank in [1, 2, 3]" :key="rank">
          <div v-if="leaderboard[rank - 1]"
            class="p-6 bg-gradient-to-br rounded-xl border-2 transition"
            :class="[
              rank === 1 ? 'from-yellow-900/30 to-yellow-900/10 border-yellow-600/50' :
              rank === 2 ? 'from-gray-700/30 to-gray-700/10 border-gray-600/50' :
              'from-amber-900/30 to-amber-900/10 border-amber-600/50'
            ]"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 rounded-lg flex items-center justify-center"
                :class="[
                  rank === 1 ? 'bg-yellow-600' :
                  rank === 2 ? 'bg-gray-400' :
                  'bg-amber-700'
                ]"
              >
                <Medal :size="24" 
                  :class="[
                    rank === 1 ? 'text-yellow-100' :
                    rank === 2 ? 'text-gray-900' :
                    'text-amber-100'
                  ]"
                />
              </div>
              <div>
                <div class="font-bold text-white">{{ leaderboard[rank - 1].username }}</div>
                <div class="text-xs text-neutral-400">Rank #{{ leaderboard[rank - 1].rank }}</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-center">
              <div class="p-2 bg-neutral-900/50 rounded">
                <div class="text-xs text-neutral-400">Earnings</div>
                <div class="font-bold text-yellow-400 text-sm">{{ formatCurrency(leaderboard[rank - 1].totalEarnings) }}</div>
              </div>
              <div class="p-2 bg-neutral-900/50 rounded">
                <div class="text-xs text-neutral-400">Games</div>
                <div class="font-bold text-blue-400 text-sm">{{ leaderboard[rank - 1].gamesPlayed }}</div>
              </div>
            </div>
          </div>
          </template>
        </div>

        <!-- Rest of Leaderboard -->
        <div class="bg-neutral-800/40 border border-neutral-700 rounded-xl p-4">
          <div v-if="leaderboard.length > 3" class="space-y-2">
            <div v-for="player in leaderboard.slice(3)" :key="player.username" class="p-4 bg-neutral-800/60 border border-neutral-700 rounded-lg flex items-center justify-between hover:border-neutral-600 transition">
              <!-- Rank & Player -->
              <div class="flex items-center gap-4 flex-1">
                <div class="w-10 h-10 flex items-center justify-center rounded-lg bg-neutral-700 font-bold text-neutral-300 text-sm">
                  #{{ player.rank }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-white text-sm">{{ player.username }}</div>
                  <div class="text-xs text-neutral-400">{{ player.gamesPlayed }} games played</div>
                </div>
              </div>

              <!-- Stats -->
              <div class="hidden sm:grid sm:grid-cols-3 gap-6 text-right ml-4">
                <div>
                  <div class="text-xs text-neutral-400">Earnings</div>
                  <div class="font-bold text-yellow-400 text-sm">{{ formatCurrency(player.totalEarnings) }}</div>
                </div>
                <div>
                  <div class="text-xs text-neutral-400">Best</div>
                  <div class="font-bold text-green-400 text-sm">{{ formatCurrency(player.highestScore) }}</div>
                </div>
                <div>
                  <div class="text-xs text-neutral-400">Avg</div>
                  <div class="font-bold text-purple-400 text-sm">{{ formatCurrency(Math.round(player.totalEarnings / Math.max(1, player.gamesPlayed))) }}</div>
                </div>
              </div>

              <!-- Mobile Stats -->
              <div class="sm:hidden text-right ml-2">
                <div class="font-bold text-yellow-400 text-sm">{{ formatCurrency(player.totalEarnings) }}</div>
                <div class="text-xs text-neutral-400">earnings</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="!loading && leaderboard.length > 0" class="mt-8 text-center text-neutral-400 text-sm border-t border-neutral-700 pt-4">
        Showing top {{ leaderboard.length }} of {{ totalPlayers }} players worldwide
      </div>

      <!-- Back Button -->
      <router-link to="/" class="mt-6 block text-center text-indigo-400 hover:text-indigo-300 font-medium text-sm flex items-center justify-center gap-2">
        <ArrowLeft :size="16" /> Back to Home
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import { formatCurrency } from '../utils/constants'
import { Trophy, Gamepad2, Medal, ArrowLeft } from 'lucide-vue-next'

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
const totalPlayers = ref(0)

const loadLeaderboard = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await axios.get(`${API_BASE_URL}/leaderboard`)
    leaderboard.value = response.data.leaderboard
    totalPlayers.value = response.data.totalPlayers
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load leaderboard'
  } finally {
    loading.value = false
  }
}

onMounted(loadLeaderboard)
</script>
