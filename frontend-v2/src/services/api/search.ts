import { aiClient } from "./axios"

export interface SemanticSearchResult {
  answer: string
  sources: Array<{
    text: string
    score: number
    metadata: any
  }>
  engine_used: string
}

export const searchApi = {
  query: async (userId: string, question: string): Promise<SemanticSearchResult> => {
    const { data } = await aiClient.post<SemanticSearchResult>("/ai/query", {
      user_id: userId,
      question
    })
    return data
  }
}
