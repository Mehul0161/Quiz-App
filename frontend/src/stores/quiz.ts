import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '../config'

export interface Question {
  id: string
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
	correctAnswer: string
  category: string
	difficulty: string
	explanation?: string
	imageUrl?: string
}

export interface GameMode {
	id: string
	name: string
	timeLimit: number
	lifelines: number
	scoring: 'standard' | 'rapid' | 'exact' | 'visual'
}

export const useQuizStore = defineStore('quiz', () => {
	const questions = ref<Question[]>([])
	const currentQuestionIndex = ref(0)
	const score = ref(0)
	const gameMode = ref<GameMode | null>(null)
	const category = ref('')
	const loading = ref(false)
	const error = ref('')

	const gameModes: GameMode[] = [
		{
			id: 'normal',
			name: 'Normal Mode',
			timeLimit: 30,
			lifelines: 3,
			scoring: 'standard'
		},
		{
			id: 'rapidfire',
			name: 'Rapid Fire',
			timeLimit: 15,
			lifelines: 0,
			scoring: 'rapid'
		},
		{
			id: 'nooptions',
			name: 'Without Options',
			timeLimit: 45,
			lifelines: 0,
			scoring: 'exact'
		},
		{
			id: 'imagebased',
			name: 'Image Based',
			timeLimit: 40,
			lifelines: 2,
			scoring: 'visual'
		}
	]

	const categories = ref([
		'General Knowledge',
		'Science & Technology',
		'History',
		'Geography',
		'Entertainment',
		'Sports',
		'Literature',
		'Mathematics'
	])

	const prizeStructure = [
		100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000
	]

	const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])
	const totalQuestions = computed(() => questions.value.length)
	const isGameComplete = computed(() => currentQuestionIndex.value >= totalQuestions.value)
	const totalEarnings = computed(() => {
		if (isGameComplete.value) {
			return prizeStructure[Math.min(currentQuestionIndex.value - 1, prizeStructure.length - 1)]
		}
		return 0
	})

	const startQuiz = async (selectedCategory: string, selectedMode: string) => {
		loading.value = true
		error.value = ''
		category.value = selectedCategory
		
		const mode = gameModes.find(m => m.id === selectedMode)
		if (!mode) {
			throw new Error('Invalid game mode')
		}
		gameMode.value = mode

		try {
			const response = await axios.post(`${API_BASE_URL}/quizzes/start`, {
				category: selectedCategory,
				mode: selectedMode
			})
			
			questions.value = response.data.questions
			currentQuestionIndex.value = 0
			score.value = 0
		} catch (err) {
			console.error('Error starting quiz:', err)
			throw new Error('Failed to start quiz')
      } finally {
			loading.value = false
		}
	}

	const answerQuestion = (answer: string) => {
		if (!currentQuestion.value) return false

		let isCorrect = false
		
		// For no-options mode, do case-insensitive comparison and trim whitespace
		if (gameMode.value?.id === 'nooptions') {
			const userAnswer = answer.toLowerCase().trim()
			const correctAnswer = currentQuestion.value.correctAnswer.toLowerCase().trim()
			isCorrect = userAnswer === correctAnswer
		} else {
			// For multiple choice, exact match
			isCorrect = answer === currentQuestion.value.correctAnswer
		}
      
      if (isCorrect) {
			score.value += calculatePoints()
		}

		return isCorrect
	}

	const calculatePoints = () => {
		if (!gameMode.value) return 100

		const basePoints = 100
		const questionMultiplier = Math.floor(currentQuestionIndex.value / 5) + 1

		switch (gameMode.value.scoring) {
			case 'rapid':
				return basePoints * questionMultiplier * 2 // Double points for rapid fire
			case 'exact':
				return basePoints * questionMultiplier * 1.5 // Bonus for exact answers
			case 'visual':
				return basePoints * questionMultiplier * 1.2 // Slight bonus for visual questions
			default:
				return basePoints * questionMultiplier
		}
	}

	const nextQuestion = () => {
		if (currentQuestionIndex.value < totalQuestions.value - 1) {
			currentQuestionIndex.value++
		}
	}

	const completeGame = async (finalScore?: number) => {
		if (!gameMode.value) return

		try {
			const score = finalScore || totalEarnings.value
			const questionsAnswered = currentQuestionIndex.value

			await axios.post(`${API_BASE_URL}/games/complete`, {
				finalScore: score,
				questionsAnswered,
				mode: gameMode.value.id,
				category: category.value
			})
		} catch (err) {
			console.error('Error completing game:', err)
		}
	}

	const resetGame = () => {
		questions.value = []
		currentQuestionIndex.value = 0
		score.value = 0
		gameMode.value = null
		category.value = ''
		error.value = ''
	}

	return {
		// State
		questions,
		currentQuestionIndex,
		score,
		gameMode,
		category,
		loading,
		error,
		gameModes,
		categories,
		prizeStructure,

		// Computed
		currentQuestion,
		totalQuestions,
		isGameComplete,
		totalEarnings,

		// Actions
		startQuiz,
		answerQuestion,
		nextQuestion,
		completeGame,
		resetGame
  }
})
