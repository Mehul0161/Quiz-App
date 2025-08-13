import { defineStore } from 'pinia'
import axios from 'axios'
import { API_BASE_URL } from '../config'

// const API_BASE_URL = 'http://localhost:3000/api'

export interface User {
  id: string
  username: string
  email: string
  totalEarnings: number
  gamesPlayed: number
  highestScore: number
  achievements: string[]
  createdAt: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null as User | null,
    isLoggedIn: false,
    loading: false,
    error: null as string | null
  }),

  actions: {
    async register(username: string, email: string) {
      this.loading = true
      this.error = null
      
      console.log('Starting registration for:', { username, email })
      console.log('API Base URL:', API_BASE_URL)
      
      try {
        const response = await axios.post(`${API_BASE_URL}/users/register`, {
          username,
          email
        })
        
        console.log('Registration successful:', response.data)
        
        this.currentUser = response.data.user
        this.isLoggedIn = true
        
        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
        
        return response.data.user
      } catch (error: any) {
        console.error('Registration failed:', error)
        this.error = error.response?.data?.error || 'Registration failed'
        throw error
      } finally {
        this.loading = false
        console.log('Registration process completed')
      }
    },

    async login(email: string) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, {
          email
        })
        
        this.currentUser = response.data.user
        this.isLoggedIn = true
        
        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
        
        return response.data.user
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Login failed'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateUserStats(earnings: number, questionsAnswered: number, isWinner: boolean, category: string) {
      if (!this.currentUser) return

      try {
        const response = await axios.post(`${API_BASE_URL}/games/complete`, {
          userId: this.currentUser.id,
          category,
          questionsAnswered,
          earnings,
          isWinner
        })

        this.currentUser = response.data.user
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
        
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Failed to update stats'
        throw error
      }
    },

    logout() {
      this.currentUser = null
      this.isLoggedIn = false
      this.error = null
      localStorage.removeItem('currentUser')
    },

    loadUserFromStorage() {
      const storedUser = localStorage.getItem('currentUser')
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser)
        this.isLoggedIn = true
      }
    }
  }
})
