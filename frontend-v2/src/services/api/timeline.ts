import { journalApi } from "./journal"
import type { JournalEntry } from "./journal"
import { memoryApi } from "./memory"
import type { Memory } from "./memory"
import { insightApi } from "./insight"
import type { Insight } from "./insight"

export type TimelineEventType = 'JOURNAL' | 'MEMORY' | 'INSIGHT' | 'REFLECTION' | 'MILESTONE'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  date: string
  monthGroup: string
  title: string
  summary: string
  tags?: string[]
  imageUrl?: string
  originalData?: any // to hold the raw JournalEntry, Memory, or Insight
}

export const timelineApi = {
  getTimelineEvents: async (userId: string): Promise<TimelineEvent[]> => {
    // 1. Fetch data from all 3 sources simultaneously
    const [journalPage, memories, insights] = await Promise.all([
      journalApi.getEntries(0, 100), // fetching latest 100 journals
      memoryApi.getMemories(userId),
      insightApi.getInsights(userId)
    ])

    const events: TimelineEvent[] = []

    // 2. Map Journals
    journalPage.content.forEach((entry: JournalEntry) => {
      const d = new Date(entry.createdAt || entry.date || new Date())
      events.push({
        id: `j-${entry.id}`,
        type: 'JOURNAL',
        date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        monthGroup: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        title: entry.title,
        summary: entry.summary || entry.content.substring(0, 150) + "...",
        tags: entry.emotions ? entry.emotions.split(',').map(e => e.trim()) : [],
        originalData: entry
      })

      // If there is a reflection/motivational thought, we can add it as a separate Reflection event
      if (entry.motivationalThought) {
        events.push({
          id: `r-${entry.id}`,
          type: 'REFLECTION',
          date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          monthGroup: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          title: "Reflection on: " + entry.title,
          summary: entry.motivationalThought,
          tags: ["Reflection"],
        })
      }
    })

    // 3. Map Memories
    memories.forEach((memory: Memory) => {
      const d = new Date(memory.created_at)
      events.push({
        id: `m-${memory.id}`,
        type: 'MEMORY',
        date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        monthGroup: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        title: memory.title,
        summary: memory.summary,
        tags: [memory.category],
        originalData: memory
      })
    })

    // 4. Map Insights
    insights.forEach((insight: Insight) => {
      const d = new Date(insight.created_at)
      events.push({
        id: `i-${insight.id}`,
        type: 'INSIGHT',
        date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        monthGroup: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        title: insight.title,
        summary: insight.description,
        tags: [insight.type],
        originalData: insight
      })
    })

    // 5. Sort chronologically (newest first)
    events.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    return events
  }
}
