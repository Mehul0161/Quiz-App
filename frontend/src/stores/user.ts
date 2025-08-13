import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
  gameHistory: any[]
  stats?: Record<string, any>
}

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isLoggedIn = computed(() => !!token.value && !!currentUser.value)

  // Initialize from localStorage
  const initializeAuth = () => {
    const storedToken = localStorage.getItem('quiz_token')
    const storedUser = localStorage.getItem('quiz_user')
    
    if (storedToken && storedUser) {
      try {
        token.value = storedToken
        currentUser.value = JSON.parse(storedUser)
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        
        // Verify token with backend and fetch fresh data
        fetchCurrentUser();
      } catch (err) {
        console.error('Error parsing stored user data:', err)
        clearAuth()
      }
    }
  }

  // Verify token with backend
  const verifyToken = async () => {
    if (!token.value) return false
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify`, {}, {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      
      if (response.data.valid) {
        // Token is valid, fetch updated user data
        await fetchCurrentUser()
        return true
      } else {
        clearAuth()
        return false
      }
    } catch (err: any) {
      console.error('Token verification failed:', err)
      clearAuth()
      return false
    }
  }

  // Fetch current user data
  const fetchCurrentUser = async () => {
    if (!token.value) {
      console.warn('No token available for fetching user profile')
      return
    }
    
    try {
      console.log('Fetching user profile with token:', token.value ? 'Present' : 'Missing')
      const response = await axios.get(`${API_BASE_URL}/users/profile/me`, {
        headers: { 
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.data && response.data.user) {
        currentUser.value = response.data.user
        localStorage.setItem('quiz_user', JSON.stringify(response.data.user))
        console.log('User profile fetched successfully')
      } else {
        console.error('Invalid response format:', response.data)
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err)
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url,
        method: err.config?.method,
        headers: err.config?.headers
      })
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Authentication failed, clearing auth')
        clearAuth()
      }
    }
  }

  // Register new user
  const register = async (username: string, email: string, password: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`${API_BASE_URL}/users/register`, {
        username,
        email,
        password
      })
      
      // Auto-login after successful registration
      await login(email, password)
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Login user
  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`${API_BASE_URL}/users/login`, {
        email,
        password
      })
      
      const { user, token: newToken } = response.data
      
      // Store token and user data
      token.value = newToken
      currentUser.value = user
      
      // Save to localStorage
      localStorage.setItem('quiz_token', newToken)
      localStorage.setItem('quiz_user', JSON.stringify(user))
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Logout user
  const logout = () => {
    clearAuth()
  }

  // Clear authentication data
  const clearAuth = () => {
    currentUser.value = null
    token.value = null
    error.value = null
    
    // Remove from localStorage
    localStorage.removeItem('quiz_token')
    localStorage.removeItem('quiz_user')
    
    // Remove axios default header
    delete axios.defaults.headers.common['Authorization']
  }

  // Update user stats after game completion
  const updateUserStats = async (finalScore: number, questionsAnswered: number) => {
    if (!token.value) return
    
    try {
      const response = await axios.post(`${API_BASE_URL}/games/complete`, {
        finalScore,
        questionsAnswered
      }, {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      
      if (response.data.success) {
        // Fetch updated user data
        await fetchCurrentUser()
      }
      
      return response.data
    } catch (err: any) {
      console.error('Error updating user stats:', err)
      throw err
    }
  }

  // Initialize auth on store creation
  initializeAuth()

  return {
    // State
    currentUser,
    token,
    loading,
    error,
    
    // Computed
    isLoggedIn,
    
    // Actions
    register,
    login,
    logout,
    verifyToken,
    fetchCurrentUser,
    updateUserStats,
    clearAuth
  }
})
