<template>
  <div class="container mx-auto px-6 py-16 relative">
    <!-- Background Effects -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/3 right-1/3 w-80 h-80 border border-neon-green/20 rounded-full animate-pulse"></div>
      <div class="absolute bottom-1/3 left-1/3 w-64 h-64 border border-neon-blue/20 rounded-full animate-pulse" style="animation-delay: 2s"></div>
    </div>
    
    <div class="relative z-10 max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16">
        <div class="text-8xl mb-6 animate-float">👤</div>
        <h1 class="text-6xl font-bold font-['Orbitron'] neon-text mb-4">
          NEURAL PROFILE
        </h1>
        <p class="text-xl text-gray-300">
          Quantum consciousness analytics and digital evolution metrics
        </p>
      </div>

      <div v-if="!userStore.isLoggedIn" class="text-center">
        <div class="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-8">
          <h1 class="text-2xl font-bold text-red-300 mb-4">❌ Access Denied</h1>
          <p class="text-red-200 mb-6">You must be logged in to view your profile!</p>
          <router-link 
            to="/login" 
            class="bg-gold-600 hover:bg-gold-700 text-black font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Login / Register
          </router-link>
        </div>
      </div>

      <div v-else>
        <h1 class="text-4xl font-bold text-gold-400 mb-8 text-center">
          👤 {{ userStore.currentUser?.username }}'s Profile
        </h1>

        <!-- Quantum Analytics Matrix -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="cyber-card p-8 border-gold-400/30 text-center group hover:border-gold-400/60 transition-all duration-500 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="text-5xl mb-4 animate-float">💎</div>
              <h3 class="text-lg font-bold gold-text mb-3 font-['Orbitron']">QUANTUM WEALTH</h3>
              <p class="text-3xl font-bold gold-text">${{ userStore.currentUser?.totalEarnings.toLocaleString() || 0 }}</p>
            </div>
          </div>
          
          <div class="cyber-card p-8 border-neon-purple/30 text-center group hover:border-neon-purple/60 transition-all duration-500 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="text-5xl mb-4 animate-float" style="animation-delay: 0.5s">⚡</div>
              <h3 class="text-lg font-bold text-purple-400 mb-3 font-['Orbitron']">NEURAL SESSIONS</h3>
              <p class="text-3xl font-bold text-purple-400">{{ userStore.currentUser?.gamesPlayed || 0 }}</p>
            </div>
          </div>
          
          <div class="cyber-card p-8 border-neon-green/30 text-center group hover:border-neon-green/60 transition-all duration-500 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="text-5xl mb-4 animate-float" style="animation-delay: 1s">🏆</div>
              <h3 class="text-lg font-bold text-green-400 mb-3 font-['Orbitron']">PEAK ACHIEVEMENT</h3>
              <p class="text-3xl font-bold text-green-400">${{ userStore.currentUser?.highestScore?.toLocaleString() || 0 }}</p>
            </div>
          </div>
          
          <div class="cyber-card p-8 border-neon-blue/30 text-center group hover:border-neon-blue/60 transition-all duration-500 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="text-5xl mb-4 animate-float" style="animation-delay: 1.5s">📈</div>
              <h3 class="text-lg font-bold neon-text mb-3 font-['Orbitron']">SUCCESS RATE</h3>
              <p class="text-3xl font-bold neon-text">{{ getWinRate() }}%</p>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div class="space-y-12">
          <!-- Neural Identity Matrix -->
          <div class="cyber-card p-8 border-neon-blue/30 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-transparent"></div>
            <div class="relative z-10">
              <div class="flex flex-col lg:flex-row items-center lg:items-start space-y-8 lg:space-y-0 lg:space-x-12">
                <div class="flex-shrink-0">
                  <div class="cyber-card p-8 border-gold-400/50 relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-br from-gold-400/20 to-transparent"></div>
                    <div class="relative z-10 w-32 h-32 flex items-center justify-center">
                      <span class="text-8xl animate-float">👤</span>
                    </div>
                  </div>
                </div>
                <div class="flex-grow text-center lg:text-left">
                  <h2 class="text-4xl font-bold neon-text mb-4 font-['Orbitron']">{{ userStore.currentUser?.username.toUpperCase() }}</h2>
                  <div class="cyber-card p-3 border-gold-400/30 inline-block mb-6">
                    <span class="text-gold-400 font-['Orbitron']">QUANTUM CONSCIOUSNESS</span>
                  </div>
                  <div class="flex flex-wrap justify-center lg:justify-start gap-4">
                    <div class="cyber-card p-3 border-neon-purple/30">
                      <span class="text-purple-400 text-sm font-['Orbitron']">🏆 MATRIX RANK: {{ getUserRank() }}</span>
                    </div>
                    <div class="cyber-card p-3 border-neon-green/30">
                      <span class="text-green-400 text-sm font-['Orbitron']">✅ INITIALIZED: {{ formatDate(userStore.currentUser?.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Digital Immortality Progress -->
          <div class="cyber-card p-8 border-gold-400/30 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-transparent"></div>
            <div class="relative z-10">
              <h3 class="text-3xl font-bold gold-text mb-8 text-center font-['Orbitron']">DIGITAL IMMORTALITY PROGRESS</h3>
              <div class="mb-8">
                <div class="flex justify-between text-gray-300 mb-4 font-['Orbitron']">
                  <span>CURRENT: ${{ userStore.currentUser?.totalEarnings.toLocaleString() || 0 }}</span>
                  <span>TRANSCENDENCE: $1,000,000</span>
                </div>
                <div class="cyber-card p-2 border-gray-500/30">
                  <div class="w-full bg-gray-800 rounded-full h-6 relative overflow-hidden">
                    <div 
                      class="bg-gradient-to-r from-gold-400 to-gold-600 h-6 rounded-full transition-all duration-1000 relative"
                      :style="{ width: getProgressPercentage() + '%' }"
                    >
                      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div class="text-center mt-4">
                  <span class="text-2xl font-bold gold-text font-['Orbitron']">{{ getProgressPercentage() }}% EVOLVED</span>
                </div>
              </div>
              
              <div class="text-center">
                <div class="cyber-card p-6 border-gold-400/30 mb-6">
                  <p class="text-gray-300 mb-2 font-['Orbitron']">
                    QUANTUM WEALTH REQUIRED FOR TRANSCENDENCE:
                  </p>
                  <p class="text-2xl font-bold gold-text">
                    ${{ (1000000 - (userStore.currentUser?.totalEarnings || 0)).toLocaleString() }}
                  </p>
                </div>
                <router-link 
                  to="/setup" 
                  class="gold-button text-xl py-4 px-8 transform hover:scale-110 transition-all duration-300"
                >
                  <span class="flex items-center space-x-3">
                    <span class="text-2xl">🚀</span>
                    <span class="font-['Orbitron']">CONTINUE EVOLUTION</span>
                  </span>
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="text-center space-x-4">
          <router-link 
            to="/setup" 
            class="inline-block bg-gold-600 hover:bg-gold-700 text-black font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🎯 Play New Quiz
          </router-link>
          <router-link 
            to="/leaderboard" 
            class="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🏆 View Leaderboard
          </router-link>
          <button 
            @click="userStore.logout()" 
            class="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '../stores/user'
const userStore = useUserStore()

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getWinRate = () => {
  const user = userStore.currentUser
  if (!user || user.gamesPlayed === 0) return 0
  // Simplified calculation based on earnings vs games played
  const rate = Math.min(100, Math.round((user.totalEarnings / (user.gamesPlayed * 50000)) * 100))
  return rate
}

const getUserRank = () => {
  // Simplified ranking based on total earnings
  const earnings = userStore.currentUser?.totalEarnings || 0
  if (earnings >= 1000000) return 'DIGITAL IMMORTAL'
  if (earnings >= 500000) return 'QUANTUM MASTER'
  if (earnings >= 100000) return 'NEURAL ELITE'
  if (earnings >= 50000) return 'CYBER ADEPT'
  if (earnings >= 10000) return 'DATA NOVICE'
  return 'NEURAL INITIATE'
}

const getProgressPercentage = () => {
  const earnings = userStore.currentUser?.totalEarnings || 0
  return Math.min(100, Math.round((earnings / 1000000) * 100))
}

// Removed unused helper functions
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
