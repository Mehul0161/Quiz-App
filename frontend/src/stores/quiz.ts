import { defineStore } from 'pinia'
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
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string
  category: string
  questionNumber: number
  prizeValue: number
  lifelines: {
    '50-50': string[]
    audience: Record<string, string>
    friend: string
  }
}

export interface QuizState {
  currentQuiz: Question[]
  currentQuestionIndex: number
  selectedCategory: string
  totalEarnings: number
  gameActive: boolean
  gameCompleted: boolean
  isWinner: boolean
  loading: boolean
  error: string | null
  categories: string[]
  prizeStructure: number[]
  lifelines: {
    fiftyFiftyUsed: boolean
    audienceUsed: boolean
    friendUsed: boolean
  }
}

export const useQuizStore = defineStore('quiz', {
  state: (): QuizState => ({
    currentQuiz: [],
    currentQuestionIndex: 0,
    selectedCategory: '',
    totalEarnings: 0,
    gameActive: false,
    gameCompleted: false,
    isWinner: false,
    loading: false,
    error: null,
    categories: [],
    prizeStructure: [],
    lifelines: {
      fiftyFiftyUsed: false,
      audienceUsed: false,
      friendUsed: false
    }
  }),

  getters: {
    currentQuestion: (state) => {
      return state.currentQuiz[state.currentQuestionIndex] || null
    },
    
    questionsRemaining: (state) => {
      return state.currentQuiz.length - state.currentQuestionIndex
    },
    
    currentPrizeValue: (state) => {
      const question = state.currentQuiz[state.currentQuestionIndex]
      return question?.prizeValue || 0
    },
    
    nextPrizeValue: (state) => {
      const nextQuestion = state.currentQuiz[state.currentQuestionIndex + 1]
      return nextQuestion?.prizeValue || 0
    },

    safeHavenIndices: () => {
      return [4, 9, 14] // Q5, Q10, Q15 (0-based)
    }
  },

  actions: {
    async loadCategories() {
      try {
        const response = await axios.get(`${API_BASE_URL}/categories`)
        this.categories = response.data.categories
      } catch (error: any) {
        this.error = 'Failed to load categories'
        console.error('Error loading categories:', error)
      }
    },

    async loadPrizeStructure() {
      try {
        const response = await axios.get(`${API_BASE_URL}/prize-structure`)
        this.prizeStructure = response.data.prizes
      } catch (error: any) {
        this.error = 'Failed to load prize structure'
        console.error('Error loading prize structure:', error)
      }
    },

    async generateQuiz(category: string) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post(`${API_BASE_URL}/quiz/generate`, {
          category
        })
        
        this.currentQuiz = response.data.questions
        this.selectedCategory = category
        this.prizeStructure = response.data.prizeStructure
        this.currentQuestionIndex = 0
        this.totalEarnings = 0
        this.gameActive = false
        this.gameCompleted = false
        this.isWinner = false
        this.lifelines = { fiftyFiftyUsed: false, audienceUsed: false, friendUsed: false }
        
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Failed to generate quiz'
        console.error('Error generating quiz:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    startGame() {
      if (this.currentQuiz.length === 0) {
        this.error = 'No quiz loaded'
        return
      }
      
      this.gameActive = true
      this.currentQuestionIndex = 0
      this.totalEarnings = 0
      this.gameCompleted = false
      this.isWinner = false
      this.error = null
      this.lifelines = { fiftyFiftyUsed: false, audienceUsed: false, friendUsed: false }
    },

    answerQuestion(selectedAnswer: 'A' | 'B' | 'C' | 'D') {
      const currentQuestion = this.currentQuestion
      if (!currentQuestion || !this.gameActive) {
        return { correct: false, gameOver: true }
      }

      const isCorrect = selectedAnswer === currentQuestion.correctAnswer
      
      if (isCorrect) {
        // Add earnings for this question
        this.totalEarnings = currentQuestion.prizeValue
        
        // Move to next question
        this.currentQuestionIndex++
        
        // Check if game is complete
        if (this.currentQuestionIndex >= this.currentQuiz.length) {
          this.completeGame(true) // Winner!
          return { correct: true, gameOver: true, winner: true }
        }
        
        return { correct: true, gameOver: false }
      } else {
        // Wrong answer - award last safe haven
        const safeIndices = [4, 9, 14] // Q5, Q10, Q15 (0-based)
        let safePrize = 0
        for (let i = safeIndices.length - 1; i >= 0; i--) {
          if (this.currentQuestionIndex > safeIndices[i]) { // last passed safe haven
            safePrize = this.prizeStructure[safeIndices[i]] || 0
            break
          }
        }
        this.totalEarnings = safePrize
        this.completeGame(false)
        return { correct: false, gameOver: true, winner: false }
      }
    },

    timeoutQuestion() {
      // Treat as incorrect answer while awarding last safe haven
      if (!this.gameActive) return { correct: false, gameOver: true }
      const safeIndices = [4, 9, 14]
      let safePrize = 0
      for (let i = safeIndices.length - 1; i >= 0; i--) {
        if (this.currentQuestionIndex > safeIndices[i]) {
          safePrize = this.prizeStructure[safeIndices[i]] || 0
          break
        }
      }
      this.totalEarnings = safePrize
      this.completeGame(false)
      return { correct: false, gameOver: true, winner: false }
    },

    completeGame(isWinner: boolean) {
      this.gameActive = false
      this.gameCompleted = true
      this.isWinner = isWinner
    },

    quitGame() {
      this.gameActive = false
      this.gameCompleted = true
      // Keep current earnings set by caller
    },

    resetGame() {
      this.currentQuiz = []
      this.currentQuestionIndex = 0
      this.selectedCategory = ''
      this.totalEarnings = 0
      this.gameActive = false
      this.gameCompleted = false
      this.isWinner = false
      this.error = null
    },

    async testAIConnection() {
      try {
        const response = await axios.get(`${API_BASE_URL}/quiz/test-ai`)
        return response.data
      } catch (error: any) {
        console.error('Error testing AI connection:', error)
        return { aiConnected: false, error: 'Connection failed' }
      }
    }
  }
})
