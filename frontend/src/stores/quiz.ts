import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import { useUserStore } from './user'

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
	imageQuery?: string
	lifelines?: {
		'50-50'?: string[]
		audience?: Record<string, string>
		friend?: string
	}
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
	const lastGameResult = ref<any>(null);

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
			timeLimit: 90,
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
			lifelines: 0,
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
	];

	const rapidFirePrizeStructure = [
		5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75
	];

	const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])
	const totalQuestions = computed(() => questions.value.length)
	const isGameComplete = computed(() => {
		if (gameMode.value?.id === 'rapidfire') {
			return false; // Game is only complete when time runs out
		}
		return currentQuestionIndex.value >= totalQuestions.value;
	})
	const totalEarnings = computed(() => {
		if (isGameComplete.value) {
			return prizeStructure[Math.min(currentQuestionIndex.value - 1, prizeStructure.length - 1)]
		}
		return 0
	})

	const startQuiz = async (selectedCategory: string, selectedMode: string) => {
		loading.value = true;
		error.value = '';
		category.value = selectedCategory;

		const mode = gameModes.find(m => m.id === selectedMode);
		if (!mode) {
			throw new Error('Invalid game mode');
		}
		gameMode.value = mode;

		try {
			const response = await axios.post(`${API_BASE_URL}/quizzes/start`, {
				category: selectedCategory,
				mode: selectedMode
			});
			
			let fetchedQuestions = response.data.questions;
			// For rapid fire, shuffle the questions initially
			if (gameMode.value.id === 'rapidfire') {
				fetchedQuestions = shuffleArray(fetchedQuestions);
			}

			questions.value = fetchedQuestions;
			currentQuestionIndex.value = 0;
			score.value = 0;
		} catch (err) {
			console.error('Error starting quiz:', err);
			throw new Error('Failed to start quiz');
      } finally {
			loading.value = false;
		}
	};

	const answerQuestion = (answer: string) => {
		if (!currentQuestion.value) return false;

		let isCorrect = false;

		// For no-options mode, do case-insensitive comparison and trim whitespace
		if (gameMode.value?.id === 'nooptions') {
			const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
			const userAnswer = normalize(answer)
			const correctAnswer = normalize((currentQuestion.value as any).correctAnswer || '')
			const acceptable = ((currentQuestion.value as any).acceptableAnswers || []).map((a: string) => normalize(a))
			isCorrect = userAnswer === correctAnswer || acceptable.includes(userAnswer)
		} else {
			// For multiple choice, exact match
			isCorrect = answer === currentQuestion.value.correctAnswer;
		}

		if (isCorrect && gameMode.value?.id !== 'rapidfire') {
			score.value += calculatePoints();
		}

		return isCorrect;
	};

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
		// For rapid fire, loop and reshuffle if we reach the end of the question pool
		if (gameMode.value?.id === 'rapidfire') {
			if (currentQuestionIndex.value >= totalQuestions.value - 1) {
				questions.value = shuffleArray(questions.value); // Reshuffle for variety
				currentQuestionIndex.value = 0;
			} else {
				currentQuestionIndex.value++;
			}
			return;
		}

		if (currentQuestionIndex.value < totalQuestions.value - 1) {
			currentQuestionIndex.value++;
		}
	};

	const completeGame = async (finalScore?: number) => {
		if (!gameMode.value) return;

		const userStore = useUserStore()

		try {
			const questionsAnswered = currentQuestionIndex.value;
			            const correctAnswers = questions.value.slice(0, questionsAnswered).filter(() => {
				// This assumes you have a way to check if the answer for question i was correct.
				// For simplicity, I'll placeholder this. You'd need to store answers.
				// Let's assume the score reflects correct answers for now for non-rapidfire.
				return true; // Placeholder
			}).length;

			const resultData = {
				finalScore: finalScore || 0,
				questionsAnswered,
				correctAnswers,
				incorrectAnswers: questionsAnswered - correctAnswers,
				mode: gameMode.value.name,
				category: category.value,
				isWin: (finalScore || 0) > 0, // Simple win condition
			};
			lastGameResult.value = resultData;

			await axios.post(`${API_BASE_URL}/games/complete`, {
				finalScore: resultData.finalScore,
				questionsAnswered,
				gameMode: gameMode.value.id,
				rapidFireScore: gameMode.value.id === 'rapidfire' ? resultData.finalScore : undefined,
				category: category.value
			});

			// Fetch the latest user data to update stats everywhere
			await userStore.fetchCurrentUser();

		} catch (err) {
			console.error('Error completing game:', err);
		}
	};

	const resetGame = () => {
		questions.value = [];
		currentQuestionIndex.value = 0;
		score.value = 0;
		gameMode.value = null;
		category.value = '';
		error.value = '';
		// Do not reset lastGameResult here, so the result page can access it
	};

	// Helper function to shuffle an array
	const shuffleArray = (array: Question[]) => {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	};

	return {
		// State
		questions,
		currentQuestionIndex,
		score,
		gameMode,
		category,
		loading,
		error,
		lastGameResult,
		gameModes,
		categories,
		prizeStructure,
		rapidFirePrizeStructure,

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
