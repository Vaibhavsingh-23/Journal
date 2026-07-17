export interface TimelineEvent {
  id: string
  type: string
  title: string
  timestamp?: string
  preview?: string
  date?: string
  summary?: string
  tags?: string[]
  imageUrl?: string
}

export interface Memory {
  id: string
  title: string
  dateRange: string
  summary: string
  coverImage: string
  category: string
  isFeatured: boolean
  journalCount?: number
  detail?: {
    themes?: string[]
    timeline?: { id: string, title: string, date: string, excerpt: string }[]
    reflectionSnippets?: string[]
  }
  events: {
    id: string
    date: string
    title: string
    excerpt: string
  }[]
}

export interface JournalPreviewType {
  id: string
  title: string
  paragraphs: string[]
  date: string
}

export interface Theme {
  id: string
  name: string
  frequency: string
  trend: string
  description: string
  explanation?: string
}

export interface Pattern {
  id: string
  title: string
  text: string
  description: string
  impact: "positive" | "negative" | "neutral"
}

export interface Suggestion {
  id: string
  title: string
  text?: string
  rationale: string
  actionable: boolean
}

export interface Milestone {
  id: string
  date: string
  title: string
  summary: string
  significance: string
  relatedMemories: string[]
}

export interface Highlight {
  id: string
  title: string
  value: string
  label?: string
  icon: any
}

export interface Rediscovery {
  id: string
  title: string
  date: string
  excerpt: string
  matchReason: string
  text?: string
  actionText?: string
}

export interface ReflectionTimelineItem {
  id: string
  title?: string
  date: string
  summary: string
  sentiment: string
}
