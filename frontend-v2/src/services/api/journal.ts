import { apiClient } from "./axios"

export interface JournalEntry {
  id: string
  title: string
  content: string
  date: string
  createdAt: string
  mood?: string
  emotions?: string
  summary?: string
  motivationalThought?: string
  sentimentScore?: number
}

export interface PaginatedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

export const journalApi = {
  getEntries: async (page = 0, size = 20): Promise<PaginatedResponse<JournalEntry>> => {
    const { data } = await apiClient.get<PaginatedResponse<JournalEntry>>(`/journal?page=${page}&size=${size}`)
    return data
  },

  getEntry: async (id: string): Promise<JournalEntry> => {
    const { data } = await apiClient.get<JournalEntry>(`/journal/id/${id}`)
    return data
  },

  createEntry: async (entry: { title: string; content: string }): Promise<JournalEntry> => {
    const { data } = await apiClient.post<JournalEntry>("/journal", entry)
    return data
  },

  updateEntry: async (id: string, entry: { title: string; content: string }): Promise<JournalEntry> => {
    const { data } = await apiClient.put<JournalEntry>(`/journal/id/${id}`, entry)
    return data
  },

  deleteEntry: async (id: string): Promise<void> => {
    await apiClient.delete(`/journal/id/${id}`)
  },

  reanalyzeEntry: async (id: string): Promise<JournalEntry> => {
    const { data } = await apiClient.post<JournalEntry>(`/journal/reanalyze/${id}`)
    return data
  }
}
