<template>
	<div class="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4">
		<!-- Game Header -->
		<div class="max-w-7xl mx-auto mb-6">
			<div class="card p-4 shadow-lg border-2 border-neutral-700">
				<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div class="flex-1">
						<h1 class="text-xl md:text-2xl font-bold text-white mb-1">
							<span v-if="quizStore.gameMode?.id === 'rapidfire'">
								Rapid Fire Mode!
							</span>
							<span v-else>
								Question {{ currentQuestionIndex + 1 }} of {{ totalQuestions }}
							</span>
							<span class="text-indigo-400 block sm:inline">- {{ quizStore.category }}</span>
						</h1>
						<p class="text-sm text-neutral-400">Mode: {{ quizStore.gameMode?.name }}</p>
					</div>
					<div class="text-left sm:text-right">
						<!-- Rapid Fire Score Display -->
						<div v-if="quizStore.gameMode?.id === 'rapidfire'" class="text-center">
							<div class="text-xl md:text-2xl font-bold text-green-400 mb-1">{{ rapidFireScore }} pts</div>
							<div class="text-sm text-neutral-400">
								Time: <span :class="getTimeColor()">{{ formatTime(timeRemaining) }}</span>
							</div>
						</div>
						<!-- Normal Prize Display -->
						<div v-else>
							<div class="text-xl md:text-2xl font-bold text-yellow-400 mb-1">${{ currentPrize.toLocaleString() }}</div>
							<div v-if="quizStore.gameMode?.timeLimit" class="text-sm text-neutral-400">
								Time: <span :class="getTimeColor()">{{ formatTime(timeRemaining) }}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Timer Bar -->
				<div v-if="quizStore.gameMode?.timeLimit" class="mt-4">
					<div class="w-full bg-neutral-800 rounded-full h-2 shadow-inner">
						<div
							class="h-2 rounded-full transition-all duration-1000 shadow-sm"
							:class="getTimeBarColor()"
							:style="{ width: (timeRemaining / quizStore.gameMode.timeLimit * 100) + '%' }"
						></div>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Game Area -->
		<div class="max-w-7xl mx-auto">
			<div class="flex flex-col xl:flex-row gap-6">
				<!-- Left Column: Question + Lifelines (2/3 width) -->
				<div class="flex-[2] min-w-0 space-y-6">
					<!-- Question Card -->
					<div class="card p-6 shadow-lg border-2 border-neutral-700">
						<div class="mb-6">
							<h2 class="text-xl font-bold text-white mb-4 leading-relaxed">{{ currentQuestion?.question }}</h2>

							<!-- Image for image-based mode -->
							<div v-if="quizStore.gameMode?.id === 'imagebased'" class="mb-6">
								<img
									:src="getImageUrl((currentQuestion as any)?.imageQuery || quizStore.category)"
									:alt="(currentQuestion as any)?.imageQuery || quizStore.category"
									class="w-full max-w-lg mx-auto rounded-xl border-2 border-neutral-600 shadow-lg"
								/>
							</div>

							<!-- Answer Options -->
							<div v-if="currentQuestion?.options && quizStore.gameMode?.id !== 'nooptions'" class="space-y-3">
								<button
									v-for="(option, key) in currentQuestion.options"
									:key="key"
									v-show="!hiddenOptions.includes(key)"
									@click="handleAnswerClick(key)"
									:disabled="answered || timeRemaining <= 0"
									:class="getOptionClass(key)"
									class="w-full p-3 md:p-4 text-left rounded-xl border-2 transition-all duration-300 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg transform"
								>
									<span class="font-bold text-base md:text-lg mr-2 md:mr-3 inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-neutral-700 text-white text-sm md:text-base">{{ key }}</span>
									<span class="text-base md:text-lg">{{ option }}</span>
								</button>
							</div>

							<!-- Text Input (for no-options mode) -->
							<div v-else-if="quizStore.gameMode?.id === 'nooptions'" class="space-y-4">
								<div>
									<label class="block text-sm font-medium text-neutral-200 mb-2">Your Answer:</label>
									<input
										v-model="textAnswer"
										type="text"
										@keyup.enter="submitTextAnswer"
										:disabled="answered || timeRemaining <= 0"
										class="input-field py-3 text-lg"
										placeholder="Type your answer and press Enter..."
									/>
								</div>
								<button
									@click="submitTextAnswer"
									:disabled="!textAnswer.trim() || answered || timeRemaining <= 0"
									class="btn-primary w-full py-3 text-lg font-semibold"
								>
									Submit Answer
								</button>
							</div>
						</div>

						<!-- Feedback and Navigation -->
						<div v-if="answered" class="mt-6 p-4 rounded-xl border-2 shadow-lg" :class="isCorrect ? 'bg-green-600/20 border-green-500' : 'bg-red-600/20 border-red-500'">
							<div class="flex items-center justify-between w-full">
								<div class="flex items-center gap-4">
									<div class="text-3xl">{{ isCorrect ? '✅' : '❌' }}</div>
									<div>
										<h3 class="font-bold text-white text-lg mb-1">{{ isCorrect ? 'Correct!' : 'Incorrect!' }}</h3>
										<p class="text-neutral-300 text-sm">{{ currentQuestion?.explanation }}</p>
									</div>
								</div>
								<div class="flex items-center gap-3">
									<button @click="walkAway" class="btn-secondary py-2 px-4 text-sm font-semibold">
										💰 Walk Away
									</button>
									<button @click="nextQuestion" class="btn-primary py-2 px-4 text-sm font-semibold">
										{{ isLastQuestion ? 'Finish' : 'Next →' }}
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Lifelines Card -->
					<div v-if="quizStore.gameMode?.lifelines && quizStore.gameMode.lifelines > 0 && quizStore.gameMode?.id === 'normal'" class="card p-4 shadow-lg border-2 border-neutral-700">
						<h3 class="text-lg font-bold text-white mb-4 text-center">Lifelines</h3>
						<div class="grid grid-cols-3 gap-2 md:gap-3">
							<button
								v-for="lifeline in availableLifelines"
								:key="lifeline.id"
								@click="useLifeline(lifeline.id)"
								:disabled="lifeline.used || answered || timeRemaining <= 0"
								class="p-2 md:p-3 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 transform"
								:class="lifeline.used ? 'border-neutral-600 bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'border-indigo-500 bg-indigo-600/20 text-white hover:bg-indigo-600/30 hover:shadow-lg'"
							>
								<div class="text-xl md:text-2xl mb-1">{{ lifeline.icon }}</div>
								<div class="font-semibold text-xs md:text-sm">{{ lifeline.name }}</div>
							</button>
						</div>
					</div>
				</div>

				<!-- Right Column: Prize Ladder (1/3 width) -->
				<div class="flex-[1] min-w-[280px] max-w-[450px] xl:max-w-none">
					<div class="card p-4 shadow-lg border-2 border-neutral-700 h-fit">
						<h3 class="text-lg font-bold text-white mb-3 text-center">
							{{ quizStore.gameMode?.id === 'rapidfire' ? 'Rapid Fire Rewards' : 'Prize Ladder' }}
						</h3>
						<div class="space-y-1.5 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
							<!-- Rapid Fire Prize Ladder -->
							<div v-if="quizStore.gameMode?.id === 'rapidfire'">
								<div
									v-for="(prize, index) in rapidFirePrizeStructure.slice().reverse()"
									:key="index"
									:class="getRapidFirePrizeClass(prize)"
									class="flex items-center justify-between p-2 rounded-lg border-2 transition-all duration-300"
								>
									<div class="flex items-center gap-2">
										<div class="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shadow-sm" :class="getRapidFirePrizeNumberClass(prize)">
											🏆
										</div>
										<span class="font-bold text-xs" :class="getRapidFirePrizeTextClass(prize)">{{ prize }} Points</span>
									</div>
									<div class="flex items-center">
										<div v-if="rapidFireScore >= prize" class="text-base text-green-400">✅</div>
									</div>
								</div>
							</div>
							<!-- Standard Prize Ladder -->
							<div v-else>
								<div
									v-for="(prize, index) in prizeStructure"
									:key="index"
									:class="getPrizeClass(index)"
									class="flex items-center justify-between p-2 rounded-lg border-2 transition-all duration-300 hover:scale-[1.01] transform"
								>
									<div class="flex items-center gap-2">
										<div class="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shadow-sm" :class="getPrizeNumberClass(index)">
											{{ prizeStructure.length - index }}
										</div>
										<span class="font-bold text-xs" :class="getPrizeTextClass(index)">${{ prize.toLocaleString() }}</span>
									</div>
									<div class="flex items-center">
										<div v-if="prizeStructure.length - 1 - index === currentQuestionIndex" class="text-base animate-pulse">🎯</div>
										<div v-else-if="prizeStructure.length - 1 - index < currentQuestionIndex" class="text-base text-green-400">✅</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Lifeline Modals -->
		<div v-if="showLifelineModal" class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
			<div class="bg-neutral-900 rounded-xl border-2 border-neutral-700 p-6 max-w-md w-full shadow-2xl">
				<h3 class="text-xl font-bold text-white mb-4">{{ activeLifeline?.name }}</h3>
				<div class="text-neutral-300 mb-6 text-base leading-relaxed">{{ activeLifeline?.result }}</div>
				<button @click="showLifelineModal = false" class="btn-primary w-full py-3 text-lg font-semibold">Close</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'
import { API_BASE_URL } from '../config'

const router = useRouter()
const quizStore = useQuizStore()

// Expose the rapid fire prize structure to the template
const rapidFirePrizeStructure = computed(() => quizStore.rapidFirePrizeStructure);

const answered = ref(false)
const isCorrect = ref(false)
const timeRemaining = ref(30)
const textAnswer = ref('')
const showLifelineModal = ref(false)
const activeLifeline = ref<any>(null)
const hiddenOptions = ref<string[]>([])
const rapidFireScore = ref(0)

// For double-click
const provisionalAnswer = ref('')
const lastClickTime = ref(0)
const DOUBLE_CLICK_DELAY = 500 // 500ms

let timer: ReturnType<typeof setInterval> | null = null

const currentQuestionIndex = computed(() => quizStore.currentQuestionIndex)
const totalQuestions = computed(() => quizStore.totalQuestions)
const currentQuestion = computed(() => quizStore.currentQuestion)
const prizeStructure = computed(() => quizStore.prizeStructure.slice().reverse()) // Reversed for display

const currentPrize = computed(() => {
	if (quizStore.gameMode?.id === 'rapidfire') {
		// Find the highest prize achieved based on score
		const currentScore = rapidFireScore.value;
		return [...quizStore.rapidFirePrizeStructure].reverse().find(prize => currentScore >= prize) || 0;
	}

	if (answered.value && !isCorrect.value) {
		// Find safe haven
		if (currentQuestionIndex.value >= 10) return quizStore.prizeStructure[9]
		if (currentQuestionIndex.value >= 5) return quizStore.prizeStructure[4]
		return 0
	}
	return currentQuestionIndex.value > 0 ? quizStore.prizeStructure[currentQuestionIndex.value - 1] : 0
})

const isLastQuestion = computed(() => currentQuestionIndex.value === totalQuestions.value - 1)

const availableLifelines = computed(() => {
	if (!quizStore.gameMode?.lifelines) return []
	
	const lifelines = [
		{
			id: '50-50',
			name: '50:50',
			icon: '✂️',
			description: 'Remove two wrong answers',
			used: false
		},
		{
			id: 'audience',
			name: 'Audience',
			icon: '👥',
			description: 'See audience poll results',
			used: false
		},
		{
			id: 'friend',
			name: 'Friend',
			icon: '📞',
			description: 'Get advice from a friend',
			used: false
		}
	]
	
	return lifelines.slice(0, quizStore.gameMode.lifelines)
})

onMounted(() => {
	if (!quizStore.gameMode) {
		router.push('/setup')
		return
	}
	
  startTimer()
})

onUnmounted(() => {
	if (timer) clearInterval(timer)
})

const startTimer = () => {
	if (!quizStore.gameMode?.timeLimit) return
	
	timeRemaining.value = quizStore.gameMode.timeLimit
	timer = setInterval(() => {
		timeRemaining.value--
		if (timeRemaining.value <= 0) {
			timeUp()
		}
	}, 1000)
}

const timeUp = () => {
	if (timer) clearInterval(timer);
	if (quizStore.gameMode?.id === 'rapidfire') {
		completeGame();
	} else {
		// For normal modes, end the game when time runs out
		answered.value = true;
		isCorrect.value = false;
		// End the game after showing the incorrect answer
		setTimeout(() => {
			completeGame();
		}, 1500);
	}
};

const formatTime = (seconds: number) => {
	const mins = Math.floor(seconds / 60)
	const secs = seconds % 60
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getTimeColor = () => {
	if (timeRemaining.value > 10) return 'text-green-400'
	if (timeRemaining.value > 5) return 'text-yellow-400'
	return 'text-red-400'
}

const getTimeBarColor = () => {
	if (timeRemaining.value > 10) return 'bg-green-500'
	if (timeRemaining.value > 5) return 'bg-yellow-500'
	return 'bg-red-500'
}

const getOptionClass = (key: string) => {
	if (answered.value) {
		if (key === currentQuestion.value?.correctAnswer) return 'border-green-500 bg-green-600/20 shadow-green-500/20 shadow-lg'
		if (key === provisionalAnswer.value) return 'border-red-500 bg-red-600/20 shadow-red-500/20 shadow-lg'
		return 'border-neutral-600 bg-neutral-800/50'
	}
	
	if (key === provisionalAnswer.value) {
		return 'border-yellow-500 bg-yellow-600/20 animate-pulse shadow-yellow-500/20 shadow-lg'
	}
	
	return 'border-neutral-600 hover:border-indigo-500 hover:bg-indigo-600/10 hover:shadow-indigo-500/20 hover:shadow-md'
}

const getPrizeClass = (index: number) => {
	const originalIndex = prizeStructure.value.length - 1 - index
	if (originalIndex === currentQuestionIndex.value) {
		return 'bg-indigo-600/20 border-indigo-500 shadow-indigo-500/20 shadow-lg'
	}
	if (originalIndex < currentQuestionIndex.value) {
		return 'bg-green-600/20 border-green-500 shadow-green-500/20 shadow-md'
	}
	return 'bg-neutral-800/50 border-neutral-600'
}

const getPrizeNumberClass = (index: number) => {
	const originalIndex = prizeStructure.value.length - 1 - index
	if (originalIndex === currentQuestionIndex.value) {
		return 'bg-indigo-600 text-white'
	}
	if (originalIndex < currentQuestionIndex.value) {
		return 'bg-green-600 text-white'
	}
	return 'bg-neutral-700 text-neutral-300'
}

const getPrizeTextClass = (index: number) => {
	const originalIndex = prizeStructure.value.length - 1 - index
	if (originalIndex === currentQuestionIndex.value) {
		return 'text-indigo-300'
	}
	if (originalIndex < currentQuestionIndex.value) {
		return 'text-green-300'
	}
	return 'text-neutral-400'
}

const getRapidFirePrizeClass = (prize: number) => {
	const nextPrize = [...quizStore.rapidFirePrizeStructure].find(p => p > rapidFireScore.value) || Infinity;
	if (rapidFireScore.value >= prize) {
		return 'bg-green-600/20 border-green-500 shadow-green-500/20 shadow-md';
	}
	if (prize === nextPrize) {
		return 'bg-indigo-600/20 border-indigo-500 shadow-indigo-500/20 shadow-lg';
	}
	return 'bg-neutral-800/50 border-neutral-600';
};

const getRapidFirePrizeNumberClass = (prize: number) => {
	const nextPrize = [...quizStore.rapidFirePrizeStructure].find(p => p > rapidFireScore.value) || Infinity;
	if (rapidFireScore.value >= prize) {
		return 'bg-green-600 text-white';
	}
	if (prize === nextPrize) {
		return 'bg-indigo-600 text-white animate-pulse';
	}
	return 'bg-neutral-700 text-neutral-300';
};

const getRapidFirePrizeTextClass = (prize: number) => {
	const nextPrize = [...quizStore.rapidFirePrizeStructure].find(p => p > rapidFireScore.value) || Infinity;
	if (rapidFireScore.value >= prize) {
		return 'text-green-300';
	}
	if (prize === nextPrize) {
		return 'text-indigo-300';
	}
	return 'text-neutral-400';
};


const handleAnswerClick = (key: string) => {
	if (answered.value || timeRemaining.value <= 0) return

	const now = Date.now()
	if (provisionalAnswer.value === key && now - lastClickTime.value < DOUBLE_CLICK_DELAY) {
		confirmAnswer(key)
	} else {
		provisionalAnswer.value = key
		lastClickTime.value = now
	}
}

const confirmAnswer = (answer: string) => {
	if (answered.value || (timeRemaining.value <= 0 && quizStore.gameMode?.id !== 'rapidfire')) return;

	answered.value = true;
	isCorrect.value = quizStore.answerQuestion(answer);
	
	if (quizStore.gameMode?.id === 'rapidfire') {
		if(isCorrect.value) {
			rapidFireScore.value += 5;
		} else {
			rapidFireScore.value = Math.max(0, rapidFireScore.value - 3);
		}
		setTimeout(() => {
			nextQuestion();
		}, 500); // Shorter delay for rapid fire
		return;
	}

	if (timer) clearInterval(timer);

	// Auto-advance after correct answer for normal modes
	if (isCorrect.value) {
		setTimeout(() => {
			if (isLastQuestion.value) {
				completeGame()
			} else {
				quizStore.nextQuestion()
				resetQuestion()
			}
		}, 900)
	} else if (quizStore.gameMode?.id === 'normal') {
		setTimeout(() => {
			completeGame();
		}, 900);
	}
}

const submitTextAnswer = () => {
	if (!textAnswer.value.trim() || answered.value || timeRemaining.value <= 0) return
	
	confirmAnswer(textAnswer.value.trim())
}

const useLifeline = (lifelineId: string) => {
	if (answered.value || timeRemaining.value <= 0) return
	
	// Mark lifeline as used
	const lifeline = availableLifelines.value.find(l => l.id === lifelineId)
	if (lifeline) {
		lifeline.used = true
	}
	
	activeLifeline.value = {
		id: lifelineId,
		name: lifeline?.name,
		result: getLifelineResult(lifelineId)
	}
	
	// Apply 50-50 effect if applicable
	if (lifelineId === '50-50') {
		apply5050Lifeline()
	}
	
	showLifelineModal.value = true
}

const getLifelineResult = (lifelineId: string) => {
	const question = currentQuestion.value
	if (!question || !question.lifelines) {
		return 'Lifeline used!'
	}

	switch (lifelineId) {
		case '50-50':
			if (question.lifelines['50-50']) {
				const removedOptions = question.lifelines['50-50']
				return `Options ${removedOptions.join(' and ')} have been removed!`
			}
			return 'Two wrong answers have been removed!'
		case 'audience':
			if (question.lifelines.audience) {
				const poll = question.lifelines.audience
				const pollText = Object.entries(poll)
					.map(([option, percentage]) => `${option} (${percentage})`)
					.join(', ')
				return `Audience poll: ${pollText}`
			}
			return 'Audience poll: A (45%), B (25%), C (20%), D (10%)'
		case 'friend':
			if (question.lifelines.friend) {
				return question.lifelines.friend
			}
			return 'Your friend thinks the answer might be A, but they\'re not sure.'
		default:
			return 'Lifeline used!'
	}
}

const nextQuestion = () => {
	if (quizStore.gameMode?.id === 'rapidfire') {
		if (timeRemaining.value > 0) {
			quizStore.nextQuestion();
			resetQuestion();
		} else {
			completeGame();
		}
		return;
	}

	if (isLastQuestion.value) {
		completeGame();
	} else {
		quizStore.nextQuestion();
		resetQuestion();
	}
};

const resetQuestion = () => {
	answered.value = false;
	isCorrect.value = false;
	provisionalAnswer.value = '';
	textAnswer.value = '';
	showLifelineModal.value = false;
	activeLifeline.value = null;
	hiddenOptions.value = [];

	// For normal modes, restart timer per question
	if (quizStore.gameMode?.id !== 'rapidfire') {
		startTimer();
	}
};

const walkAway = async () => {
	let questionsAnswered = currentQuestionIndex.value;
	
	// If the user answered at least one question, count it
	if (answered.value) {
		questionsAnswered = Math.max(1, currentQuestionIndex.value + 1);
	}
	
	// Update the quiz store's current question index before completing the game
	quizStore.currentQuestionIndex = questionsAnswered;
	
	await quizStore.completeGame(currentPrize.value);
	router.push('/result');
};

const completeGame = async () => {
	let finalScore = currentPrize.value;
	let questionsAnswered = currentQuestionIndex.value;
	
	// If the game ended due to wrong answer or time out, we need to count the current question
	if (answered.value && currentQuestionIndex.value === 0) {
		questionsAnswered = 1; // At least one question was attempted
	} else if (answered.value) {
		questionsAnswered = currentQuestionIndex.value + 1; // Include the current question
	}
	
	if(quizStore.gameMode?.id === 'rapidfire') {
		finalScore = rapidFireScore.value;
	}
	
	// Update the quiz store's current question index before completing the game
	quizStore.currentQuestionIndex = questionsAnswered;
	
	await quizStore.completeGame(finalScore);
	router.push('/result');
};

const apply5050Lifeline = () => {
	const question = currentQuestion.value
	if (!question || !question.lifelines || !question.lifelines['50-50']) return
	
	const optionsToHide = question.lifelines['50-50']
	hiddenOptions.value = [...optionsToHide]
}

// Build image URL via backend API so it works in dev/prod
const getImageUrl = (query: string) => `${API_BASE_URL}/images/lookup?query=${encodeURIComponent(query)}`
</script>
