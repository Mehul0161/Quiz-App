import { createStore } from 'zustand/vanilla'
import { reactive, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '../config'

export interface User {
  _id: string
  username: string
  email: string
  totalEarnings: number
  gamesPlayed: number
  highestScore?: number
  createdAt: string
  gameHistory: GameRecord[]
  stats?: Record<string, any>
  achievements?: string[]
}

export interface GameRecord {
  gameId: string
  gameMode: string
  category: string
  score: number
  questionsAnswered: number
  playedAt: string
}

export interface Question {
  id: string
  question: string
  options?: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: string
  category: string
  difficulty: string
  explanation?: string
  lifelines?: {
    '50-50'?: string[]
    audience?: Record<string, string>
    friend?: string
  }
  acceptableAnswers?: string[]
}

export interface GameMode {
  id: string
  name: string
  timeLimit: number
  lifelines: number
  scoring: 'standard' | 'rapid' | 'exact'
}

const gameModes: GameMode[] = [
  { id: 'normal', name: 'Normal Mode', timeLimit: 30, lifelines: 3, scoring: 'standard' },
  { id: 'rapidfire', name: 'Rapid Fire', timeLimit: 90, lifelines: 0, scoring: 'rapid' },
  { id: 'nooptions', name: 'Without Options', timeLimit: 45, lifelines: 0, scoring: 'exact' }
]

const prizeStructure = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000]
const rapidFirePrizeStructure = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]

type AppState = {
  // Auth
  currentUser: User | null
  token: string | null
  isLoggedIn: boolean
  isGuest: boolean
  loading: boolean
  error: string | null

  // Quiz
  questions: Question[]
  currentQuestionIndex: number
  score: number
  gameMode: GameMode | null
  category: string
  gameModes: GameMode[]
  prizeStructure: number[]
  rapidFireScore: number
  rapidFirePrizeStructure: number[]
  lastGameResult: any
  categories: string[]

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  googleLogin: (idToken: string) => Promise<void>
  startGuestSession: () => void
  fetchCurrentUser: () => Promise<void>
  clearAuth: () => void
  syncGuestData: () => Promise<void>
  fetchCategories: () => Promise<void>
  fetchPrizeStructure: () => Promise<void>
  startQuiz: (category: string, mode: string) => Promise<void>
  answerQuestion: (answer: string) => boolean
  nextQuestion: () => void
  completeGame: (finalScore?: number) => Promise<void>
  resetGame: () => void
  addGuestGameRecord: (record: { score: number; gameMode: string; category: string; questionsAnswered: number }) => void
  
  // Question Tracking (Session Storage)
  getExcludedQuestions: (category: string) => string[]
  storeUsedQuestions: (category: string, questions: Question[]) => void
  clearQuestionSession: (category?: string) => void
}

const store = createStore<AppState>()((set, get) => {
  // Initialize from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('quiz_token') : null
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('quiz_user') : null
  const currentUser = userStr ? JSON.parse(userStr) : null
  const isLoggedIn = !!(token && currentUser)
  
  // Set axios header if token exists
  if (token && typeof window !== 'undefined') {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  return {
  // Auth
  currentUser,
  token,
  isLoggedIn,
  isGuest: typeof window !== 'undefined' && localStorage.getItem('quiz_guest') === 'true',
  loading: false,
  error: null,

  // Quiz
  questions: [],
  currentQuestionIndex: 0,
  score: 0,
  gameMode: null,
  category: '',
  gameModes,
  prizeStructure,
  rapidFireScore: 0,
  rapidFirePrizeStructure,
  lastGameResult: null,
  categories: [],

  // Actions
  login: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const response = await axios.post(`${API_BASE_URL}/users/login`, { email, password })
      const { user, token: newToken } = response.data
      if (typeof window !== 'undefined') {
        localStorage.setItem('quiz_token', newToken)
        localStorage.setItem('quiz_user', JSON.stringify(user))
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      await get().syncGuestData()
      set({ currentUser: user, token: newToken, isLoggedIn: true, isGuest: false })
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Login failed' })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      await axios.post(`${API_BASE_URL}/users/register`, { username, email, password })
      await get().login(email, password)
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Registration failed' })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quiz_token')
      localStorage.removeItem('quiz_user')
      localStorage.removeItem('quiz_guest')
      localStorage.removeItem('quiz_guest_history')
    }
    delete axios.defaults.headers.common['Authorization']
    set({ currentUser: null, token: null, isLoggedIn: false, isGuest: false })
  },

  googleLogin: async (idToken: string) => {
    set({ loading: true, error: null })
    try {
      const response = await axios.post(`${API_BASE_URL}/users/google`, { idToken })
      const { user, token: newToken } = response.data
      if (typeof window !== 'undefined') {
        localStorage.setItem('quiz_token', newToken)
        localStorage.setItem('quiz_user', JSON.stringify(user))
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      await get().syncGuestData()
      set({ currentUser: user, token: newToken, isLoggedIn: true, isGuest: false })
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Google login failed' })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  startGuestSession: () => {
    if (typeof window !== 'undefined') localStorage.setItem('quiz_guest', 'true')
    set({ isGuest: true })
  },

  fetchCurrentUser: async () => {
    const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('quiz_token') : null)
    if (!token) return
    try {
      const response = await axios.get(`${API_BASE_URL}/users/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data?.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('quiz_user', JSON.stringify(response.data.user))
          localStorage.setItem('quiz_token', token)
        }
        set({ currentUser: response.data.user, token, isLoggedIn: true, isGuest: false })
      }
    } catch (err) {
      console.error('Failed to fetch user:', err)
      // If token is invalid, clear auth
      if (typeof window !== 'undefined') {
        localStorage.removeItem('quiz_token')
        localStorage.removeItem('quiz_user')
      }
      set({ currentUser: null, token: null, isLoggedIn: false })
    }
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quiz_token')
      localStorage.removeItem('quiz_user')
    }
    delete axios.defaults.headers.common['Authorization']
    set({ currentUser: null, token: null, isLoggedIn: false })
  },

  syncGuestData: async () => {
    const token = get().token
    if (!token) return
    const historyRaw = typeof window !== 'undefined' ? localStorage.getItem('quiz_guest_history') : null
    const games = historyRaw ? JSON.parse(historyRaw) : []
    if (!games.length) return
    try {
      await axios.post(`${API_BASE_URL}/users/sync-guest`, { games }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (typeof window !== 'undefined') {
        localStorage.removeItem('quiz_guest_history')
        localStorage.removeItem('quiz_guest')
      }
      set({ isGuest: false })
    } catch (e) {
      console.error('Guest sync failed', e)
    }
  },

  fetchCategories: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`)
      if (response.data?.categories) {
        set({ categories: response.data.categories })
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      // Fallback to empty array
      set({ categories: [] })
    }
  },

  fetchPrizeStructure: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/prize-structure`)
      if (response.data?.prizes) {
        set({ prizeStructure: response.data.prizes })
      }
    } catch (err) {
      console.error('Failed to fetch prize structure:', err)
      // Keep existing prize structure as fallback
    }
  },

  startQuiz: async (selectedCategory: string, selectedMode: string) => {
    set({ loading: true, error: '' })
    try {
      const mode = gameModes.find(m => m.id === selectedMode)
      if (!mode) throw new Error('Invalid game mode')
      
      console.log('Starting quiz:', { category: selectedCategory, mode: selectedMode })
      
      // Get previously used questions from session storage
      const excludeQuestionIds = get().getExcludedQuestions(selectedCategory)
      console.log(`Excluding ${excludeQuestionIds.length} previously used questions`)
      
      const response = await axios.post(`${API_BASE_URL}/quizzes/start`, {
        category: selectedCategory,
        mode: selectedMode,
        excludeQuestionIds: excludeQuestionIds
      })
      
      console.log('Quiz response received:', response.data)
      
      let fetchedQuestions = response.data?.questions
      
      if (!fetchedQuestions || !Array.isArray(fetchedQuestions) || fetchedQuestions.length === 0) {
        console.error('No questions received from API:', response.data)
        throw new Error('No questions received from server')
      }
      
      console.log(`Received ${fetchedQuestions.length} questions`)
      
      // Store the used questions in session storage
      get().storeUsedQuestions(selectedCategory, fetchedQuestions)
      
      if (mode.id === 'rapidfire') fetchedQuestions = fetchedQuestions.sort(() => Math.random() - 0.5)
      
      set({ 
        questions: fetchedQuestions, 
        currentQuestionIndex: 0, 
        score: 0, 
        gameMode: mode, 
        category: selectedCategory, 
        rapidFireScore: 0 
      })
      
      console.log('Quiz started successfully, questions set in store')
    } catch (err: any) {
      console.error('Error starting quiz:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Failed to start quiz'
      set({ error: errorMessage })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  answerQuestion: (answer: string) => {
    const state = get()
    const question = state.questions[state.currentQuestionIndex]
    if (!question) return false
    let isCorrect = false
    if (state.gameMode?.id === 'nooptions') {
      const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
      const userAnswer = normalize(answer)
      const correctAnswer = normalize(question.correctAnswer || '')
      const acceptable = ((question as any).acceptableAnswers || []).map((a: string) => normalize(a))
      isCorrect = userAnswer === correctAnswer || acceptable.includes(userAnswer)
    } else {
      isCorrect = answer === question.correctAnswer
    }
    if (isCorrect && state.gameMode?.id !== 'rapidfire') {
      const basePoints = 100
      const questionMultiplier = Math.floor(state.currentQuestionIndex / 5) + 1
      let points = basePoints * questionMultiplier
      if (state.gameMode?.id === 'nooptions') points *= 1.5
      set({ score: state.score + points })
    }
    return isCorrect
  },

  nextQuestion: () => {
    const state = get()
    if (state.gameMode?.id === 'rapidfire') {
      if (state.currentQuestionIndex >= state.questions.length - 1) {
        set({ questions: state.questions.sort(() => Math.random() - 0.5), currentQuestionIndex: 0 })
      } else {
        set({ currentQuestionIndex: state.currentQuestionIndex + 1 })
      }
    } else if (state.currentQuestionIndex < state.questions.length - 1) {
      set({ currentQuestionIndex: state.currentQuestionIndex + 1 })
    }
  },

  completeGame: async (finalScore?: number) => {
    const state = get()
    if (!state.gameMode) return
    try {
      const questionsAnswered = state.currentQuestionIndex
      const resultData = {
        finalScore: finalScore || 0,
        questionsAnswered,
        mode: state.gameMode.name,
        category: state.category,
        isWin: (finalScore || 0) > 0
      }
      set({ lastGameResult: resultData })
      if (state.isGuest) {
        get().addGuestGameRecord({ score: resultData.finalScore, questionsAnswered, gameMode: state.gameMode.id, category: state.category })
      } else {
        await axios.post(`${API_BASE_URL}/games/complete`, {
          finalScore: resultData.finalScore,
          questionsAnswered,
          gameMode: state.gameMode.id,
          rapidFireScore: state.gameMode.id === 'rapidfire' ? resultData.finalScore : undefined,
          category: state.category
        })
        await get().fetchCurrentUser()
      }
    } catch (err) {
      console.error('Game completion error:', err)
    }
  },

  resetGame: () => set({ questions: [], currentQuestionIndex: 0, score: 0, gameMode: null, category: '', rapidFireScore: 0 }),

  addGuestGameRecord: (record) => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('quiz_guest_history') : null
    const list = raw ? JSON.parse(raw) : []
    list.push({ gameId: crypto.randomUUID(), ...record, playedAt: new Date().toISOString() })
    if (typeof window !== 'undefined') localStorage.setItem('quiz_guest_history', JSON.stringify(list))
  },

  // Question Tracking - Session Storage Methods
  getExcludedQuestions: (category: string) => {
    if (typeof window === 'undefined') return []
    try {
      const sessionData = JSON.parse(sessionStorage.getItem('quizSessionData') || '{}')
      return sessionData[category]?.usedQuestionIds || []
    } catch (err) {
      console.error('Error reading excluded questions:', err)
      return []
    }
  },

  storeUsedQuestions: (category: string, questions: Question[]) => {
    if (typeof window === 'undefined') return
    try {
      const sessionData = JSON.parse(sessionStorage.getItem('quizSessionData') || '{}')
      
      if (!sessionData[category]) {
        sessionData[category] = {
          usedQuestionIds: [],
          lastPlayedAt: Date.now(),
          mode: null
        }
      }
      
      const questionIds = questions.map(q => q.id)
      sessionData[category].usedQuestionIds.push(...questionIds)
      sessionData[category].lastPlayedAt = Date.now()
      
      sessionStorage.setItem('quizSessionData', JSON.stringify(sessionData))
      console.log(`Stored ${questionIds.length} used questions for category: ${category}`)
    } catch (err) {
      console.error('Error storing used questions:', err)
    }
  },

  clearQuestionSession: (category?: string) => {
    if (typeof window === 'undefined') return
    try {
      if (category) {
        const sessionData = JSON.parse(sessionStorage.getItem('quizSessionData') || '{}')
        delete sessionData[category]
        sessionStorage.setItem('quizSessionData', JSON.stringify(sessionData))
        console.log(`Cleared question session for category: ${category}`)
      } else {
        sessionStorage.removeItem('quizSessionData')
        console.log('Cleared all question sessions')
      }
    } catch (err) {
      console.error('Error clearing question session:', err)
    }
  }
  }
})

export function useAppStore() {
  const state = reactive(store.getState())
  let unsub: (() => void) | null = null
  onMounted(() => {
    unsub = store.subscribe((s) => Object.assign(state, s))
  })
  onUnmounted(() => { if (unsub) unsub() })
  return state
}
