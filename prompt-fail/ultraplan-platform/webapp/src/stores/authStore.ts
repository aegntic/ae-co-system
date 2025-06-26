// UltraPlan Authentication Store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { User, Subscription } from '../../../shared/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (email: string, password: string, name: string) => Promise<void>
  refreshToken: () => Promise<void>
  updateSubscription: (subscription: Subscription) => void
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.ultraplan.ai'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password,
          })
          
          const { user, token } = response.data
          
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        delete axios.defaults.headers.common['Authorization']
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true })
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/register`, {
            email,
            password,
            name,
          })
          
          const { user, token } = response.data
          
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      refreshToken: async () => {
        const currentToken = get().token
        if (!currentToken) return
        
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            token: currentToken,
          })
          
          const { token } = response.data
          
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          set({ token })
        } catch (error) {
          // Token refresh failed, logout
          get().logout()
        }
      },

      updateSubscription: (subscription: Subscription) => {
        const user = get().user
        if (user) {
          set({
            user: { ...user, subscription },
          })
        }
      },
    }),
    {
      name: 'ultraplan-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)