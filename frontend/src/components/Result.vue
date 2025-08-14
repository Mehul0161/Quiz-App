<template>
  <div class="min-h-screen bg-neutral-950 p-4 flex items-center justify-center">
    <div class="max-w-2xl w-full text-center">
      <div v-if="quizStore.lastGameResult" class="card border-2 border-neutral-700 p-6">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-3">
          {{ quizStore.lastGameResult.isWin ? '🎉 Congratulations! 🎉' : '🏁 Game Over 🏁' }}
        </h1>
        <p class="text-sm text-neutral-400 mb-6">You played on {{ quizStore.lastGameResult.mode }} mode in the {{ quizStore.lastGameResult.category }} category.</p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="card-compact border-2 border-yellow-500/30 bg-yellow-500/5">
            <div class="text-3xl mb-1">💰</div>
            <div class="text-xs text-neutral-300 mb-1">Final Score</div>
            <div class="text-lg font-bold text-yellow-400">{{ quizStore.lastGameResult.finalScore.toLocaleString() }} {{ quizStore.lastGameResult.mode === 'Rapid Fire' ? 'pts' : '$' }}</div>
          </div>
          <div class="card-compact border-2 border-blue-500/30 bg-blue-500/5">
            <div class="text-3xl mb-1">✅</div>
            <div class="text-xs text-neutral-300 mb-1">Correct Answers</div>
            <div class="text-lg font-bold text-blue-400">{{ quizStore.lastGameResult.correctAnswers }}</div>
          </div>
          <div class="card-compact border-2 border-red-500/30 bg-red-500/5">
            <div class="text-3xl mb-1">❌</div>
            <div class="text-xs text-neutral-300 mb-1">Incorrect Answers</div>
            <div class="text-lg font-bold text-red-400">{{ quizStore.lastGameResult.incorrectAnswers }}</div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row justify-center gap-3">
          <router-link to="/setup" class="btn-primary px-6 py-2 text-sm font-medium">Play Again</router-link>
          <router-link to="/dashboard" class="btn-secondary px-6 py-2 text-sm font-medium">Dashboard</router-link>
        </div>
      </div>
      <div v-else class="card text-center">
        <p class="text-neutral-400 text-sm">No recent game data found.</p>
        <router-link to="/dashboard" class="btn-primary mt-3 px-4 py-2 text-sm">Go to Dashboard</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuizStore } from '../stores/quiz';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const quizStore = useQuizStore();
const router = useRouter();

onMounted(() => {
  if (!quizStore.lastGameResult) {
    // If there's no result, maybe redirect to dashboard after a delay
    setTimeout(() => {
      if (!quizStore.lastGameResult) { // Check again in case it loads
        router.push('/dashboard');
      }
    }, 3000);
  }
});
</script>


