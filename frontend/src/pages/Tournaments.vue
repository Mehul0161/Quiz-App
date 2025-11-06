<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">Tournaments</h1>
        <p class="text-neutral-400">Compete with other players and win big prizes!</p>
      </div>

      <!-- Your Earnings -->
      <div class="mb-8 p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-neutral-400 text-sm">Your Earnings</p>
            <p class="text-3xl font-bold text-yellow-400">{{ formatCurrency(userEarnings) }}</p>
          </div>
          <div class="text-right">
            <p class="text-neutral-400 text-sm">Tournaments Joined</p>
            <p class="text-3xl font-bold text-indigo-400">{{ userTournaments.length }}</p>
          </div>
        </div>
      </div>

      <!-- Active Tournaments -->
      <div class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">Active Tournaments</h2>
        
        <div v-if="loading" class="text-center py-12">
          <p class="text-neutral-400">Loading tournaments...</p>
        </div>

        <div v-else-if="activeTournaments.length === 0" class="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-xl">
          <p class="text-neutral-400">No active tournaments available</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="tournament in activeTournaments" 
            :key="tournament._id"
            class="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-indigo-500 transition-all duration-200"
          >
            <h3 class="text-xl font-bold text-white mb-2">{{ tournament.name }}</h3>
            <p class="text-neutral-400 text-sm mb-4">{{ tournament.category }}</p>
            
            <div class="space-y-3 mb-6">
              <div class="flex justify-between text-sm">
                <span class="text-neutral-400">Players</span>
                <span class="text-white font-semibold">{{ tournament.currentPlayers }}/{{ tournament.maxPlayers }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-neutral-400">Entry Fee</span>
                <span class="text-yellow-400 font-semibold">{{ formatCurrency(tournament.entryFee) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-neutral-400">Prize Pool</span>
                <span class="text-green-400 font-semibold">{{ formatCurrency(tournament.prizePool) }}</span>
              </div>
            </div>

            <button 
              @click="joinTournament(tournament)"
              :disabled="!canJoin(tournament)"
              class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200"
            >
              {{ getButtonText(tournament) }}
            </button>

            <p v-if="!canJoin(tournament)" class="text-red-400 text-xs mt-2">
              {{ getErrorMessage(tournament) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Your Tournaments -->
      <div v-if="userTournaments.length > 0">
        <h2 class="text-2xl font-bold text-white mb-6">Your Tournaments</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="tournament in userTournaments" 
            :key="tournament._id"
            class="bg-neutral-900 border border-neutral-800 rounded-xl p-6"
          >
            <h3 class="text-lg font-bold text-white mb-2">{{ tournament.name }}</h3>
            <p class="text-neutral-400 text-sm mb-4">{{ tournament.category }}</p>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-neutral-400">Status</span>
                <span :class="tournament.status === 'open' ? 'text-green-400' : 'text-yellow-400'" class="font-semibold">
                  {{ tournament.status }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-400">Players</span>
                <span class="text-white">{{ tournament.currentPlayers }}/{{ tournament.maxPlayers }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/appStore'
import { formatCurrency } from '@/utils/constants'
import axios from 'axios'

const appStore = useAppStore()
const loading = ref(false)
const tournaments = ref<any[]>([])
const userTournaments = ref<any[]>([])

const userEarnings = computed(() => appStore.currentUser?.totalEarnings || 0)

const activeTournaments = computed(() => {
  return tournaments.value.filter(t => t.status === 'open')
})

const canJoin = (tournament: any) => {
  if (!appStore.isLoggedIn) return false
  if (tournament.currentPlayers >= tournament.maxPlayers) return false
  if (userEarnings.value < tournament.entryFee) return false
  if (userTournaments.value.some(t => t._id === tournament._id)) return false
  return true
}

const getButtonText = (tournament: any) => {
  if (!appStore.isLoggedIn) return 'Sign In to Join'
  if (tournament.currentPlayers >= tournament.maxPlayers) return 'Tournament Full'
  if (userEarnings.value < tournament.entryFee) return 'Insufficient Earnings'
  if (userTournaments.value.some(t => t._id === tournament._id)) return 'Already Joined'
  return 'Join Tournament'
}

const getErrorMessage = (tournament: any) => {
  if (tournament.currentPlayers >= tournament.maxPlayers) return 'Tournament is full'
  if (userEarnings.value < tournament.entryFee) {
    const needed = tournament.entryFee - userEarnings.value
    return `Need ${formatCurrency(needed)} more`
  }
  return ''
}

const joinTournament = async (tournament: any) => {
  try {
    loading.value = true
    const response = await axios.post(
      `/api/tournaments/${tournament._id}/join`,
      {},
      { headers: { Authorization: `Bearer ${appStore.token}` } }
    )
    
    // Update user earnings
    appStore.currentUser!.totalEarnings = response.data.wallet.totalEarnings
    
    // Refresh tournaments
    await fetchTournaments()
    await fetchUserTournaments()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Failed to join tournament')
  } finally {
    loading.value = false
  }
}

const fetchTournaments = async () => {
  try {
    const response = await axios.get('/api/tournaments?status=open')
    tournaments.value = response.data.tournaments
  } catch (error) {
    console.error('Error fetching tournaments:', error)
  }
}

const fetchUserTournaments = async () => {
  try {
    if (!appStore.isLoggedIn) return
    const response = await axios.get('/api/tournaments/user/me', {
      headers: { Authorization: `Bearer ${appStore.token}` }
    })
    userTournaments.value = response.data.tournaments
  } catch (error) {
    console.error('Error fetching user tournaments:', error)
  }
}

onMounted(() => {
  fetchTournaments()
  fetchUserTournaments()
})
</script>

<style scoped>
/* Smooth transitions */
button {
  transition: all 0.3s ease;
}
</style>
