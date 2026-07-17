import { apiClient } from "./axios"

export interface AuthResponse {
  token: string
  username: string
  expiresAt: string
}

export interface UserProfile {
  id: string
  username: string
  email: string
  preferences?: any
}

export const authApi = {
  login: async (credentials: any): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/public/login", credentials)
    return data
  },

  register: async (userData: any): Promise<{ message: string; username: string }> => {
    const { data } = await apiClient.post("/public/create-user", userData)
    return data
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>("/user/me")
    return data
  },
}
