import { aiClient } from "./axios"

export interface InsightEvidence {
  memory_id?: string
  journal_id?: string
  text_snippet: string
}

export interface Insight {
  id: string
  user_id: string
  type: string
  title: string
  description: string
  confidence_score: number
  evidence: InsightEvidence[]
  is_active: boolean
  created_at: string
}

export const insightApi = {
  getInsights: async (userId: string): Promise<Insight[]> => {
    const { data } = await aiClient.get<Insight[]>(`/ai/debug/insights?user_id=${userId}`)
    return data
  }
}
