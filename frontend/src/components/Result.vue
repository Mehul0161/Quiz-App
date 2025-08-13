<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4 flex items-center justify-center">
    <div class="max-w-2xl w-full text-center">
      <div v-if="quizStore.lastGameResult" class="card border-2 border-neutral-700 p-8">
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 animate-float">
          {{ quizStore.lastGameResult.isWin ? '🎉 Congratulations! 🎉' : '🏁 Game Over 🏁' }}
        </h1>
        <p class="text-lg text-neutral-400 mb-8">You played on {{ quizStore.lastGameResult.mode }} mode in the {{ quizStore.lastGameResult.category }} category.</p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="card-compact border-2 border-yellow-500/30 bg-yellow-500/5">
            <div class="text-4xl mb-2">💰</div>
            <div class="text-sm text-neutral-300 mb-1">Final Score</div>
            <div class="text-2xl font-bold text-yellow-400">{{ quizStore.lastGameResult.finalScore.toLocaleString() }} {{ quizStore.lastGameResult.mode === 'Rapid Fire' ? 'pts' : '$' }}</div>
          </div>
          <div class="card-compact border-2 border-blue-500/30 bg-blue-500/5">
            <div class="text-4xl mb-2">✅</div>
            <div class="text-sm text-neutral-300 mb-1">Correct Answers</div>
            <div class="text-2xl font-bold text-blue-400">{{ quizStore.lastGameResult.correctAnswers }}</div>
          </div>
          <div class="card-compact border-2 border-red-500/30 bg-red-500/5">
            <div class="text-4xl mb-2">❌</div>
            <div class="text-sm text-neutral-300 mb-1">Incorrect Answers</div>
            <div class="text-2xl font-bold text-red-400">{{ quizStore.lastGameResult.incorrectAnswers }}</div>
          </div>
        </div>

        <div class="flex justify-center gap-4">
          <router-link to="/setup" class="btn-primary px-8 py-3 text-lg font-bold">Play Again</router-link>
          <router-link to="/dashboard" class="btn-secondary px-8 py-3 text-lg font-bold">Dashboard</router-link>
        </div>
      </div>
      <div v-else class="card text-center">
        <p class="text-neutral-400">No recent game data found.</p>
        <router-link to="/dashboard" class="btn-primary mt-4">Go to Dashboard</router-link>
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
