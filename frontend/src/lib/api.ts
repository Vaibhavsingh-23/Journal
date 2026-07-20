// =============================================================================
// API Client — Second Brain
// =============================================================================
// Axios instance + query functions.
// =============================================================================

import axios from 'axios';
import type {
  JournalEntry,
  Memory,
  Insight,
  TimelineEvent,
  WeeklySummary,
  UserProgress,
  GraphData,
  SearchResult,
} from '../types/models';

// ── Axios Instances ──────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/journal',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const aiApi = axios.create({
  baseURL: import.meta.env.VITE_AI_API_URL || 'http://localhost:8001/ai',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get auth state from localStorage
function getAuthState() {
  const stored = localStorage.getItem('second-brain-auth');
  if (stored) {
    try {
      return JSON.parse(stored).state;
    } catch {
      return null;
    }
  }
  return null;
}

// Attach JWT token if available
api.interceptors.request.use((config) => {
  const state = getAuthState();
  if (state?.token) {
    config.headers.Authorization = `Bearer ${state.token}`;
  }
  return config;
});

// ── Query Functions ──────────────────────────────────────────────────────────

export async function fetchJournalEntries(): Promise<JournalEntry[]> {
  const res = await api.get('/journal?size=100'); // Fetch latest 100
  return res.data.content || [];
}

export async function fetchJournalEntry(id: string): Promise<JournalEntry | undefined> {
  const res = await api.get(`/journal/id/${id}`);
  return res.data;
}

export async function fetchMemories(): Promise<Memory[]> {
  const state = getAuthState();
  const userId = state?.user?.id;
  if (!userId) return [];
  const res = await aiApi.get(`/debug/memories?user_id=${userId}`);
  return res.data || [];
}

export async function fetchInsights(): Promise<Insight[]> {
  const state = getAuthState();
  const userId = state?.user?.id;
  if (!userId) return [];
  const res = await aiApi.get(`/debug/insights?user_id=${userId}`);
  return res.data || [];
}

export async function fetchTimeline(): Promise<TimelineEvent[]> {
  // Synthesize timeline from journals, memories, and insights
  const [journals, memories, insights] = await Promise.all([
    fetchJournalEntries().catch(() => [] as JournalEntry[]),
    fetchMemories().catch(() => [] as Memory[]),
    fetchInsights().catch(() => [] as Insight[])
  ]);

  const timeline: TimelineEvent[] = [];

  journals.forEach(j => {
    timeline.push({
      id: `tl_j_${j.id}`,
      type: 'JOURNAL',
      title: j.title,
      description: j.aiSummary || j.content.substring(0, 100) + '...',
      date: j.date,
      relatedId: j.id
    });
  });

  memories.forEach(m => {
    timeline.push({
      id: `tl_m_${m.id}`,
      type: 'MEMORY',
      title: m.title,
      description: m.summary,
      date: m.createdAt,
      relatedId: m.id
    });
  });

  insights.forEach(i => {
    timeline.push({
      id: `tl_i_${i.id}`,
      type: 'INSIGHT',
      title: i.title,
      description: i.description,
      date: i.createdAt,
      relatedId: i.id
    });
  });

  // Sort by date descending
  return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function fetchWeeklySummary(): Promise<WeeklySummary | null> {
  const res = await api.get('/api/dashboard/weekly-summary');
  return res.data || null;
}

export async function fetchUserProgress(): Promise<UserProgress> {
  const res = await api.get('/api/dashboard/progress');
  return res.data;
}

export async function fetchGraphData(): Promise<GraphData> {
  const state = getAuthState();
  const userId = state?.user?.id;
  if (!userId) return { nodes: [], links: [] };
  
  const res = await aiApi.get(`/debug/graph?user_id=${userId}`);
  return res.data || { nodes: [], links: [] };
}

export async function searchJournal(question: string): Promise<SearchResult[]> {
  if (!question.trim()) return [];
  const state = getAuthState();
  const userId = state?.user?.id;
  if (!userId) return [];
  
  const res = await aiApi.post('/query', { user_id: userId, question });
  return [{
    id: 'sr_0',
    answer: res.data.answer || 'No answer generated.',
    sources: res.data.sources || [],
    engine: res.data.engine || 'RAG'
  }];
}
