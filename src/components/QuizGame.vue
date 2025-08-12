<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center p-3">
    <!-- No quiz -->
    <div v-if="!quizStore.currentQuiz || quizStore.currentQuiz.length === 0" class="text-center">
      <div class="bg-gray-800/40 backdrop-blur rounded-md border border-gray-700 p-6">
        <h1 class="text-2xl font-bold text-white mb-2">No Quiz Available</h1>
        <p class="text-gray-400 mb-4 text-sm">Please start a new game to begin playing.</p>
        <router-link to="/setup" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded">Start New Game</router-link>
      </div>
    </div>

    <!-- Game over / winner -->
    <div v-else-if="quizStore.gameCompleted" class="text-center max-w-md w-full">
      <div class="bg-gray-800/40 backdrop-blur rounded-md border border-gray-700 p-6">
        <div v-if="quizStore.isWinner" class="mb-4">
          <div class="text-4xl mb-3">🎉</div>
          <h1 class="text-2xl font-extrabold text-yellow-400 mb-1">MILLIONAIRE!</h1>
          <p class="text-white text-sm">Congratulations! You've conquered the game!</p>
        </div>
        <div v-else class="mb-4">
          <div class="text-4xl mb-3">😔</div>
          <h1 class="text-xl font-bold text-white mb-1">Game Over</h1>
          <p class="text-gray-400 text-sm">You reached question {{ quizStore.currentQuestionIndex + 1 }}.</p>
        </div>
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded p-3 mb-4 text-white">
          <h2 class="text-sm font-bold mb-1">Final Winnings</h2>
          <p class="text-3xl font-extrabold">${{ quizStore.totalEarnings.toLocaleString() }}</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2 justify-center">
          <router-link to="/setup" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded">Play Again</router-link>
          <router-link to="/leaderboard" class="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-white text-sm rounded">Leaderboard</router-link>
        </div>
      </div>
    </div>

    <!-- Active game -->
    <div v-else class="max-w-6xl mx-auto w-full">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <!-- Main -->
        <div class="lg:col-span-3">
          <div class="bg-gray-800/40 backdrop-blur rounded-md border border-gray-700 p-5">
            <div class="flex items-center justify-between mb-4">
              <div class="text-xs font-semibold text-gray-300">Q {{ quizStore.currentQuestionIndex + 1 }}/15 · ${{ prizeValue.toLocaleString() }}</div>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :class="timerPaused ? 'bg-yellow-400' : 'bg-green-400'"></div>
                <div class="font-mono text-lg font-bold" :class="timeLeft <= 5 ? 'text-red-400' : 'text-white'">{{ timeLeft }}s</div>
              </div>
            </div>
            <div class="bg-gray-900/40 rounded p-5 mb-5 border border-gray-700 min-h-[90px] grid place-items-center">
              <h2 class="text-xl font-semibold text-white text-center leading-relaxed">{{ currentQuestion?.question }}</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                v-for="optionKey in getVisibleOptions()"
                :key="optionKey"
                @click="confirmOrSelect(optionKey as 'A' | 'B' | 'C' | 'D')"
                :disabled="showingResult || timeLeft === 0"
                :class="getAnswerClass(optionKey as 'A' | 'B' | 'C' | 'D')"
                class="relative p-4 rounded border-2 transition-all duration-300 text-left disabled:opacity-70 group overflow-hidden"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full border-2 grid place-items-center font-bold text-base"
                       :class="selectedAnswer === optionKey ? 'border-white bg-white text-indigo-600' : 'border-gray-500 text-gray-300 group-hover:border-indigo-400'">
                    {{ optionKey }}
                  </div>
                  <span class="font-semibold text-sm sm:text-base">{{ currentQuestion?.options[optionKey] }}</span>
                </div>

                <!-- Confirm overlay -->
                <div v-if="pendingConfirm === optionKey && !showingResult" class="absolute inset-0 bg-black/40 grid place-items-center text-white font-bold text-sm">
                  Tap again to confirm
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Right rail -->
        <div class="lg:col-span-1 space-y-3">
          <div class="bg-gray-800/40 backdrop-blur rounded-md p-4 border border-gray-700">
            <h3 class="font-bold text-white mb-3 text-center text-sm">Lifelines</h3>
            <div class="space-y-2">
              <button @click="handleLifeline('50-50')" :disabled="lifelinesUsed['50-50']" class="w-full p-2.5 rounded text-sm font-bold" :class="lifelinesUsed['50-50'] ? 'bg-gray-700 text-gray-500' : 'bg-gray-600 hover:bg-gray-500'">🎯 50:50</button>
              <button @click="handleLifeline('audience')" :disabled="lifelinesUsed.audience" class="w-full p-2.5 rounded text-sm font-bold" :class="lifelinesUsed.audience ? 'bg-gray-700 text-gray-500' : 'bg-gray-600 hover:bg-gray-500'">👥 Audience</button>
              <button @click="handleLifeline('friend')" :disabled="lifelinesUsed.friend" class="w-full p-2.5 rounded text-sm font-bold" :class="lifelinesUsed.friend ? 'bg-gray-700 text-gray-500' : 'bg-gray-600 hover:bg-gray-500'">📞 Friend</button>
            </div>
          </div>
          <!-- Prize Ladder -->
          <div class="bg-gray-800/40 backdrop-blur rounded-md p-4 border border-gray-700">
            <h3 class="font-bold text-white mb-3 text-center text-sm">Prize Ladder</h3>
            <div class="space-y-1 max-h-[60vh] overflow-y-auto">
              <div
                v-for="(prize, i) in quizStore.prizeStructure.slice().reverse()"
                :key="i"
                :class="ladderClass(14 - i)"
                class="flex items-center justify-between px-3 py-2 rounded border text-xs"
              >
                <span class="font-mono">Q{{ 15 - i }}</span>
                <span class="font-bold">${{ prize.toLocaleString() }}</span>
              </div>
            </div>
          </div>
          <!-- Actions -->
          <div class="bg-gray-800/40 backdrop-blur rounded-md p-4 border border-gray-700">
            <button @click="walkAway" :disabled="showingResult || quizStore.currentQuestionIndex === 0" class="w-full p-2.5 rounded text-sm font-bold disabled:opacity-50" :class="quizStore.currentQuestionIndex > 0 ? 'bg-red-900/60 hover:bg-red-900/80 text-red-300' : 'bg-gray-700 text-gray-500'">Walk Away</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lifeline Modal -->
    <div v-if="showLifelineResult" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-md shadow-2xl p-6 border border-gray-700 max-w-md w-full">
        <h2 class="text-xl font-bold text-white text-center mb-4">{{ lifelineResultTitle }}</h2>
        <div v-if="currentLifeline === 'audience'" class="space-y-3">
          <div v-for="(percentage, option) in audiencePoll" :key="option" class="w-full">
            <div class="flex justify-between text-white text-sm mb-1">
              <span>{{ option }}</span>
              <span>{{ percentage }}</span>
            </div>
            <div class="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
              <div class="bg-indigo-500 h-3" :style="{ width: percentage }"></div>
            </div>
          </div>
        </div>
        <div v-else-if="currentLifeline === 'friend'" class="text-center text-indigo-300 text-base italic">
          <p>"{{ friendAdvice }}"</p>
        </div>
        <div v-else class="text-center text-gray-300 text-sm">
          <p>Two incorrect options have been removed.</p>
        </div>
        <button @click="showLifelineResult = false; resumeTimer()" class="w-full mt-4 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useQuizStore } from '../stores/quiz'

const router = useRouter()
const userStore = useUserStore()
const quizStore = useQuizStore()

const selectedAnswer = ref<'A' | 'B' | 'C' | 'D' | null>(null)
const pendingConfirm = ref<'A' | 'B' | 'C' | 'D' | null>(null)
const showingResult = ref(false)

const lifelinesUsed = ref({ '50-50': false, audience: false, friend: false })
const showLifelineResult = ref(false)
const currentLifeline = ref<'50-50' | 'audience' | 'friend' | ''>('')
const lifelineResultTitle = ref('')
const audiencePoll = ref<Record<string, string>>({})
const friendAdvice = ref('')
const hiddenOptions = ref<string[]>([])

const currentQuestion = computed(() => quizStore.currentQuestion)
const prizeValue = computed(() => quizStore.prizeStructure[quizStore.currentQuestionIndex] || 0)

// Ladder styling
const safeIndices = [4, 9, 14] // 0-based Q5, Q10, Q15
const ladderClass = (index: number) => {
  const isCurrent = index === quizStore.currentQuestionIndex
  const isPassed = index < quizStore.currentQuestionIndex
  const isSafe = safeIndices.includes(index)
  return [
    isCurrent ? 'bg-indigo-600/30 border-indigo-400 text-white' : '',
    isPassed ? 'bg-green-600/20 border-green-400 text-green-200' : '',
    !isCurrent && !isPassed ? 'bg-gray-700/40 border-gray-600 text-gray-300' : '',
    isSafe ? 'ring-1 ring-yellow-400' : ''
  ].join(' ')
}

// Timer
const INITIAL_TIME = 15
const timeLeft = ref<number>(INITIAL_TIME)
let timerId: number | null = null
const timerPaused = ref(false)

const startTimer = () => {
  clearTimer()
  timerPaused.value = false
  timeLeft.value = INITIAL_TIME
  timerId = window.setInterval(() => {
    if (timerPaused.value) return
    if (timeLeft.value > 0) timeLeft.value -= 1
    else { clearTimer(); handleTimeUp() }
  }, 1000)
}
const clearTimer = () => { if (timerId) { clearInterval(timerId); timerId = null } }
const pauseTimer = () => { timerPaused.value = true }
const resumeTimer = () => { timerPaused.value = false }

const handleTimeUp = () => {
  if (!showingResult.value) {
    showingResult.value = true
    const result = quizStore.answerQuestion('A')
    setTimeout(() => { if (!result.gameOver) { resetSelection(); showingResult.value = false; startTimer() } }, 1500)
  }
}

watch(() => quizStore.currentQuestionIndex, () => {
  hiddenOptions.value = []
  resetSelection()
  showingResult.value = false
  startTimer()
})

onMounted(() => {
  if (!userStore.isLoggedIn) { router.push('/login'); return }
  if (quizStore.currentQuiz?.length) startTimer()
})

onUnmounted(() => { clearTimer(); if (quizStore.gameActive && !quizStore.gameCompleted) quizStore.resetGame() })

const resetSelection = () => { selectedAnswer.value = null; pendingConfirm.value = null }

const confirmOrSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
  if (showingResult.value || timeLeft.value === 0) return
  if (pendingConfirm.value === answer) {
    submitAnswer()
  } else {
    selectedAnswer.value = answer
    pendingConfirm.value = answer
  }
}

const getVisibleOptions = () => !currentQuestion.value ? [] : Object.keys(currentQuestion.value.options).filter(k => !hiddenOptions.value.includes(k))

const useLifeline = (type: '50-50' | 'audience' | 'friend') => {
  const lifelines = currentQuestion.value!.lifelines
  if (type === '50-50') hiddenOptions.value = lifelines['50-50']
  if (type === 'audience') audiencePoll.value = lifelines.audience
  if (type === 'friend') friendAdvice.value = lifelines.friend
}

const handleLifeline = (type: '50-50' | 'audience' | 'friend') => {
  if (lifelinesUsed.value[type] || !currentQuestion.value) return
  lifelinesUsed.value[type] = true
  currentLifeline.value = type
  pauseTimer()
  useLifeline(type)
  lifelineResultTitle.value = type === '50-50' ? '50:50 - Two options removed' : type === 'audience' ? 'Ask the Audience' : 'Phone-a-Friend'
  showLifelineResult.value = true
}

const submitAnswer = () => {
  if (!selectedAnswer.value || showingResult.value) return
  clearTimer()
  showingResult.value = true
  const result = quizStore.answerQuestion(selectedAnswer.value)
  if (result.gameOver) userStore.updateUserStats(quizStore.totalEarnings, quizStore.currentQuestionIndex, !!result.winner, quizStore.selectedCategory)
  setTimeout(() => { if (!result.gameOver) { resetSelection(); showingResult.value = false; startTimer() } }, 1500)
}

const walkAway = () => {
  if (quizStore.currentQuestionIndex === 0) return
  clearTimer()
  quizStore.quitGame()
  const earnings = quizStore.prizeStructure[quizStore.currentQuestionIndex - 1] || 0
  userStore.updateUserStats(earnings, quizStore.currentQuestionIndex, false, quizStore.selectedCategory)
}

const getAnswerClass = (option: 'A' | 'B' | 'C' | 'D') => {
  if (showingResult.value) {
    const correct = currentQuestion.value?.correctAnswer || currentQuestion.value?.correct_answer
    if (option === correct) return 'bg-green-600/50 border-green-500 text-white'
    if (selectedAnswer.value === option) return 'bg-red-600/50 border-red-500 text-white'
  }
  return selectedAnswer.value === option ? 'bg-indigo-600/40 border-indigo-500 text-white' : 'bg-gray-700/40 border-gray-600 text-gray-200 hover:border-indigo-500'
}
</script>

<style scoped>
.container {
  max-width: 1200px;
}

.max-w-6xl {
  max-width: 72rem;
}

.max-w-2xl {
  max-width: 42rem;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
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
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .lg\:col-span-2 {
    grid-column: span 2 / span 2;
  }
  .lg\:col-span-1 {
    grid-column: span 1 / span 1;
  }
  .lg\:flex-row {
    flex-direction: row;
  }
  .lg\:mb-0 {
    margin-bottom: 0;
  }
  .lg\:text-2xl {
    font-size: 1.5rem;
    line-height: 2rem;
  }
}

.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.space-x-4 > :not([hidden]) ~ :not([hidden]) { margin-left: 1rem; }
.space-x-6 > :not([hidden]) ~ :not([hidden]) { margin-left: 1.5rem; }
.space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
.border-2 { border-width: 2px; }
.transform { transform: translateZ(0); }
.hover\:scale-105:hover { transform: scale(1.05); }
.bg-green-600 { background-color: #16a34a; }
.bg-green-700 { background-color: #15803d; }
.hover\:bg-green-700:hover { background-color: #15803d; }
.text-green-400 { color: #4ade80; }
.text-green-300 { color: #86efac; }
.border-green-500 { border-color: #22c55e; }
.border-green-400 { border-color: #4ade80; }
.bg-green-600 { background-color: #16a34a; }
.bg-opacity-30 { background-color: rgba(22, 163, 74, 0.3); }
.bg-opacity-20 { background-color: rgba(220, 38, 38, 0.2); }
.bg-red-600 { background-color: #dc2626; }
.bg-red-700 { background-color: #b91c1c; }
.hover\:bg-red-700:hover { background-color: #b91c1c; }
.text-red-400 { color: #f87171; }
.text-red-300 { color: #fca5a5; }
.text-red-200 { color: #fecaca; }
.border-red-500 { border-color: #ef4444; }
.border-red-400 { border-color: #f87171; }
.bg-gray-600 { background-color: #4b5563; }
.bg-gray-700 { background-color: #374151; }
.hover\:bg-gray-700:hover { background-color: #374151; }
.text-gray-300 { color: #d1d5db; }
.border-gray-500 { border-color: #6b7280; }
.disabled\:bg-gray-600:disabled { background-color: #4b5563; }
.bg-purple-600 { background-color: #9333ea; }
.bg-purple-700 { background-color: #7c3aed; }
.hover\:bg-purple-700:hover { background-color: #7c3aed; }
.rounded-full { border-radius: 9999px; }
.leading-relaxed { line-height: 1.625; }
.max-h-96 { max-height: 24rem; }
.overflow-y-auto { overflow-y: auto; }
.flex-col { flex-direction: column; }
.sm\:flex-row { flex-direction: row; }
@media (min-width: 640px) {
  .sm\:flex-row {
    flex-direction: row;
  }
}
.hover\:bg-gold-600:hover { background-color: #d97706; }
.hover\:bg-opacity-20:hover { background-color: rgba(217, 119, 6, 0.2); }
.bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
.from-gold-600 { --tw-gradient-from: #d97706; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(217, 119, 6, 0)); }
.to-gold-700 { --tw-gradient-to: #b45309; }
</style>
