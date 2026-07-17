import { aiClient } from "./axios"

export interface MemoryFragment {
  id: string
  journal_entry_id: string
  extracted_concept: string
  context: string
  created_at: string
}

export interface Memory {
  id: string
  user_id: string
  title: string
  summary: string
  category: string
  date_range: {
    start: string
    end: string
  }
  fragments: MemoryFragment[]
  created_at: string
  updated_at: string
  pending_insight_generation: boolean
}

export const memoryApi = {
  getMemories: async (userId: string): Promise<Memory[]> => {
    const { data } = await aiClient.get<Memory[]>(`/ai/debug/memories?user_id=${userId}`)
    return data
  }
}
