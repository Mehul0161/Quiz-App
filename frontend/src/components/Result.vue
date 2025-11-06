<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4 sm:p-6">
    <div class="max-w-3xl mx-auto">
      <div v-if="quizStore.lastGameResult" class="space-y-6">
        <!-- Header with Result Status -->
        <div class="text-center mb-8">
          <div class="flex justify-center mb-4">
            <div :class="[
              'w-24 h-24 rounded-full flex items-center justify-center text-5xl',
              quizStore.lastGameResult.isWin
                ? 'bg-green-600/20 border-2 border-green-500'
                : 'bg-orange-600/20 border-2 border-orange-500'
            ]">
              {{ quizStore.lastGameResult.isWin ? '🎉' : '🎯' }}
            </div>
          </div>
          <h1 :class="[
            'text-4xl md:text-5xl font-bold mb-2',
            quizStore.lastGameResult.isWin ? 'text-green-400' : 'text-orange-400'
          ]">
            {{ quizStore.lastGameResult.isWin ? 'Excellent!' : 'Game Over' }}
          </h1>
          <p class="text-neutral-400 text-lg">
            {{ quizStore.lastGameResult.category }} • {{ quizStore.lastGameResult.mode }}
          </p>
        </div>

        <!-- Main Score Card -->
        <div class="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-8 text-center">
          <p class="text-neutral-400 text-sm mb-2">Your Earnings</p>
          <div class="text-5xl md:text-6xl font-bold text-yellow-400 mb-2">
            {{ formatCurrency(quizStore.lastGameResult.finalScore) }}
          </div>
          <p class="text-neutral-500 text-sm">
            {{ quizStore.lastGameResult.mode === 'Rapid Fire' ? 'Points Earned' : 'Prize Money' }}
          </p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Correct Answers -->
          <div class="bg-neutral-900 border border-green-500/30 rounded-xl p-6 text-center hover:border-green-500/60 transition">
            <div class="flex justify-center mb-3">
              <div class="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle :size="24" class="text-green-400" />
              </div>
            </div>
            <p class="text-neutral-400 text-sm mb-1">Correct Answers</p>
            <p class="text-3xl font-bold text-green-400">{{ quizStore.lastGameResult.correctAnswers }}</p>
            <p class="text-xs text-neutral-500 mt-2">{{ correctPercentage }}%</p>
          </div>

          <!-- Incorrect Answers -->
          <div class="bg-neutral-900 border border-red-500/30 rounded-xl p-6 text-center hover:border-red-500/60 transition">
            <div class="flex justify-center mb-3">
              <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle :size="24" class="text-red-400" />
              </div>
            </div>
            <p class="text-neutral-400 text-sm mb-1">Incorrect Answers</p>
            <p class="text-3xl font-bold text-red-400">{{ quizStore.lastGameResult.incorrectAnswers }}</p>
            <p class="text-xs text-neutral-500 mt-2">{{ incorrectPercentage }}%</p>
          </div>

          <!-- Total Questions -->
          <div class="bg-neutral-900 border border-blue-500/30 rounded-xl p-6 text-center hover:border-blue-500/60 transition">
            <div class="flex justify-center mb-3">
              <div class="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <HelpCircle :size="24" class="text-blue-400" />
              </div>
            </div>
            <p class="text-neutral-400 text-sm mb-1">Total Questions</p>
            <p class="text-3xl font-bold text-blue-400">{{ totalQuestions }}</p>
            <p class="text-xs text-neutral-500 mt-2">Answered</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <p class="text-neutral-400 text-sm mb-3">Accuracy</p>
          <div class="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
            <div 
              :style="{ width: correctPercentage + '%' }"
              :class="[
                'h-full transition-all duration-500',
                correctPercentage >= 70 ? 'bg-green-500' : correctPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              ]"
            ></div>
          </div>
          <p class="text-right text-sm text-neutral-400 mt-2">{{ correctPercentage }}% Accuracy</p>
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <router-link 
            to="/setup" 
            class="py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
          >
            <RotateCcw :size="18" />
            Play Again
          </router-link>
          <router-link 
            to="/dashboard" 
            class="py-3 px-6 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
          >
            <Home :size="18" />
            Dashboard
          </router-link>
        </div>

        <!-- Share Section (Optional) -->
        <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
          <p class="text-neutral-400 text-sm mb-3">Share Your Achievement</p>
          <div class="flex justify-center gap-3">
            <button class="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition">
              <Share2 :size="18" class="text-neutral-300" />
            </button>
          </div>
        </div>
      </div>

      <!-- No Result Found -->
      <div v-else class="text-center py-12">
        <div class="text-6xl mb-4">🤔</div>
        <p class="text-neutral-400 text-lg mb-6">No recent game data found.</p>
        <router-link 
          to="/dashboard" 
          class="inline-block py-3 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
        >
          Go to Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuizStore } from '../stores/quiz';
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { CheckCircle, XCircle, HelpCircle, RotateCcw, Home, Share2 } from 'lucide-vue-next';
import { formatCurrency } from '../utils/constants';

const quizStore = useQuizStore();
const router = useRouter();

const correctPercentage = computed(() => {
  const total = quizStore.lastGameResult?.correctAnswers + quizStore.lastGameResult?.incorrectAnswers;
  if (!total) return 0;
  return Math.round((quizStore.lastGameResult?.correctAnswers / total) * 100);
});

const incorrectPercentage = computed(() => {
  return 100 - correctPercentage.value;
});

const totalQuestions = computed(() => {
  return (quizStore.lastGameResult?.correctAnswers || 0) + (quizStore.lastGameResult?.incorrectAnswers || 0);
});

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


