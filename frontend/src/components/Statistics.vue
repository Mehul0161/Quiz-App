<template>
  <div class="min-h-screen bg-neutral-950 p-4">
    <div class="max-w-4xl mx-auto">
      <div v-if="loading" class="text-center py-12">
        <LoadingSpinner />
        <p class="mt-3 text-sm text-neutral-400">Loading your stats...</p>
      </div>
      
      <div v-else-if="error" class="card text-center p-4 border-2 border-red-500/50 bg-red-500/10">
        <h2 class="text-lg font-bold text-red-400 mb-2">Error Loading Stats</h2>
        <p class="text-neutral-300 text-sm">{{ error }}</p>
      </div>

      <div v-else-if="userStats">
        <div class="text-center mb-4">
          <div class="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full grid place-items-center text-white text-lg font-bold shadow-lg mx-auto mb-2">
            {{ userStore.currentUser?.username.charAt(0).toUpperCase() }}
          </div>
          <h1 class="text-xl md:text-2xl font-bold text-white">
            {{ userStore.currentUser?.username }}'s Statistics
          </h1>
        </div>

        <!-- Key Stats Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div class="card-compact p-2.5 text-center border-2 border-yellow-500/30 bg-yellow-500/5">
            <div class="mb-0.5 flex justify-center"><Coins :size="24" class="text-yellow-400" /></div>
            <div class="text-xs text-neutral-300">Total Earnings</div>
            <div class="text-base font-bold text-yellow-400">${{ userStats.totalEarnings?.toLocaleString() || 0 }}</div>
          </div>
          <div class="card-compact p-2.5 text-center border-2 border-blue-500/30 bg-blue-500/5">
            <div class="mb-0.5 flex justify-center"><Gamepad2 :size="24" class="text-blue-400" /></div>
            <div class="text-xs text-neutral-300">Games Played</div>
            <div class="text-base font-bold text-blue-400">{{ userStats.gamesPlayed || 0 }}</div>
          </div>
          <div class="card-compact p-2.5 text-center border-2 border-green-500/30 bg-green-500/5">
            <div class="mb-0.5 flex justify-center"><Trophy :size="24" class="text-green-400" /></div>
            <div class="text-xs text-neutral-300">Highest Score</div>
            <div class="text-base font-bold text-green-400">${{ userStats.highestScore?.toLocaleString() || 0 }}</div>
          </div>
          <div class="card-compact p-2.5 text-center border-2 border-purple-500/30 bg-purple-500/5">
            <div class="mb-0.5 flex justify-center"><TrendingUp :size="24" class="text-purple-400" /></div>
            <div class="text-xs text-neutral-300">Win Rate</div>
            <div class="text-base font-bold text-purple-400">{{ getWinRate() }}%</div>
          </div>
        </div>

        <!-- Mode-Specific Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div v-for="(stats, mode) in getModeStats()" :key="mode" class="card p-4 border-2 border-neutral-700">
            <div class="flex items-center gap-2 mb-3">
              <component :is="getGameModeIcon(mode)" :size="24" class="text-indigo-400" />
              <h3 class="text-base font-bold text-white">{{ getModeName(mode) }}</h3>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="text-center">
                <div class="text-lg font-bold text-indigo-400">{{ stats.gamesPlayed || 0 }}</div>
                <div class="text-xs text-neutral-400">Games Played</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-green-400">${{ stats.highestScore?.toLocaleString() || 0 }}</div>
                <div class="text-xs text-neutral-400">Best Score</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-yellow-400">${{ stats.totalScore?.toLocaleString() || 0 }}</div>
                <div class="text-xs text-neutral-400">Total Earned</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-purple-400">{{ stats.questionsAnswered || 0 }}</div>
                <div class="text-xs text-neutral-400">Questions</div>
              </div>
            </div>
            <div v-if="stats.lastPlayedAt" class="mt-3 text-center">
              <div class="text-xs text-neutral-500">Last played: {{ formatDate(stats.lastPlayedAt) }}</div>
              <div v-if="stats.lastCategory" class="text-xs text-neutral-500">Category: {{ stats.lastCategory }}</div>
            </div>
          </div>
        </div>
        
        <!-- Game History -->
        <div class="card p-4 border-2 border-neutral-700">
          <h2 class="text-lg font-bold text-white mb-3 text-center">Game History</h2>
          <div v-if="userStats.gameHistory && userStats.gameHistory.length > 0" class="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
            <div v-for="game in userStats.gameHistory.slice().reverse()" :key="game.gameId"
                 class="flex items-center justify-between p-3 bg-neutral-800/60 rounded border border-neutral-700 hover:bg-neutral-800 transition-colors">
              <div class="flex items-center gap-3">
                <div>
                  <component :is="getGameModeIcon(game.gameMode)" :size="24" class="text-indigo-400" />
                </div>
                <div>
                  <div class="font-bold text-white text-sm">{{ game.category }}</div>
                  <div class="text-xs text-neutral-400">{{ game.gameMode }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="font-bold text-base text-indigo-400">${{ game.score.toLocaleString() }}</div>
                <div class="text-xs text-neutral-500">{{ new Date(game.playedAt).toLocaleString() }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-neutral-400 py-10">
            <div class="mb-3 flex justify-center"><Target :size="64" class="text-neutral-500" /></div>
            <p>No games played yet. Let's change that!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '../stores/user';
import LoadingSpinner from './LoadingSpinner.vue';
import { Coins, Gamepad2, Trophy, TrendingUp, Target } from 'lucide-vue-next';
import { getGameModeIcon } from '../utils/icons';

const userStore = useUserStore();
const userStats = computed(() => userStore.currentUser);
const loading = ref(false);
const error = ref('');

const fetchUserStats = async () => {
  if (userStore.currentUser?._id) {
    loading.value = true;
    error.value = '';
    try {
      await userStore.fetchCurrentUser();
    } catch (err) {
      error.value = 'Failed to load user statistics.';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }
};

// getGameModeIcon is now imported from utils/icons

const getModeName = (mode: string | number) => {
  const modeStr = String(mode);
  switch(modeStr) {
    case 'normal': return 'Normal Mode';
    case 'rapidfire': return 'Rapid Fire';
    case 'nooptions': return 'Without Options';
    case 'imagebased': return 'Image Based';
    default: return modeStr;
  }
};

const getModeStats = () => {
  return userStats.value?.stats || {};
};

const getWinRate = () => {
  if (!userStats.value?.gamesPlayed || userStats.value.gamesPlayed === 0) return 0;
  const wins = userStats.value.gameHistory?.filter(game => game.score > 0).length || 0;
  return Math.round((wins / userStats.value.gamesPlayed) * 100);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

watch(() => userStore.currentUser, (newUser) => {
  if (newUser && !newUser.gameHistory) { // Fetch if stats are not fully loaded
    fetchUserStats();
  }
}, { immediate: true });

onMounted(() => {
  if (!userStore.currentUser || !userStore.currentUser.gameHistory) {
    fetchUserStats();
  }
});
</script>
