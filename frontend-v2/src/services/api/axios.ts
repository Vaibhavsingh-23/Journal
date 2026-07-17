import axios from "axios"

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080"
const aiBaseURL = import.meta.env.VITE_AI_API_URL || "http://localhost:8001"

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
})

export const aiClient = axios.create({
  baseURL: aiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // AI requests might take longer
})

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

aiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear session data if token is invalid or expired
      localStorage.removeItem("jwt_token")
      
      // Dispatch custom event to trigger logout in AuthContext
      window.dispatchEvent(new Event("auth:unauthorized"))
    }
    return Promise.reject(error)
  }
)
