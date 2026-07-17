import { apiClient } from "./axios"

export interface UserProgress {
  currentStreak: number
  longestStreak: number
  weeklyEntryCount: number
  totalEntries: number
  lastEntryDate?: string
  lastEntryAt?: string
}

export interface WeeklySummary {
  id: string
  userId: string
  weekStartDate: string
  weekEndDate: string
  summaryText: string
  dominantMood: string
  overallSentiment: number
  createdAt: string
}

export const dashboardApi = {
  getProgress: async (): Promise<UserProgress> => {
    const { data } = await apiClient.get<UserProgress>("/api/dashboard/progress")
    return data
  },

  getWeeklySummary: async (): Promise<WeeklySummary | null> => {
    try {
      const { data } = await apiClient.get<WeeklySummary>("/api/dashboard/weekly-summary")
      return data
    } catch (e) {
      return null
    }
  },

  generateWeeklySummary: async (): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>("/api/dashboard/weekly-summary")
    return data
  }
}
