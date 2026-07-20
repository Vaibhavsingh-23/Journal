// =============================================================================
// Second Brain — Domain Models
// =============================================================================
// Keep all interfaces in this single file for easy alignment with backend DTOs.
// When real backend DTOs arrive, update these types here.
// =============================================================================

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  userName: string;
  email: string;
  roles: string[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  weeklySummaryEnabled: boolean;
  weeklySummaryDay: number; // 1=Monday … 7=Sunday
  emailNotificationsEnabled: boolean;
}

export interface AuthResponse {
  token: string;
  username: string;
  tokenType: string;
  expiresAt: string;
}

// ── Journal ──────────────────────────────────────────────────────────────────

export type Mood =
  | 'HAPPY'
  | 'SAD'
  | 'ANXIOUS'
  | 'ANGRY'
  | 'CALM'
  | 'EXCITED'
  | 'GRATEFUL'
  | 'CONFUSED'
  | 'MOTIVATED'
  | 'NEUTRAL';

export type Emotion =
  | 'HAPPINESS'
  | 'SADNESS'
  | 'ANGER'
  | 'FEAR'
  | 'SURPRISE'
  | 'LOVE'
  | 'HOPE'
  | 'GUILT'
  | 'PRIDE'
  | 'CURIOSITY'
  | 'FRUSTRATION'
  | 'NOSTALGIA';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string; // ISO-8601
  mood: Mood | null;
  emotions: string | null;
  aiSummary: string | null;
  motivationalThought: string | null;
  sentimentScore: number | null; // -1.0 to 1.0
  analysisCompleted: boolean;
}

// ── Memory ───────────────────────────────────────────────────────────────────

export type MemoryType =
  | 'EPISODIC'
  | 'SEMANTIC'
  | 'RELATIONAL'
  | 'PROJECT'
  | 'GOAL';

export type MemoryStatus =
  | 'EMERGING'
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'CONSOLIDATED';

export interface MemoryFragment {
  id: string;
  userId: string;
  knowledgeObjectId: string;
  captureId: string;
  content: string;
  entityIds: string[];
  createdAt: string;
}

export interface Memory {
  id: string;
  userId: string;
  memoryType: MemoryType;
  status: MemoryStatus;
  title: string;
  summary: string;
  timeline: string[];
  fragmentIds: string[];
  entityIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Insight ──────────────────────────────────────────────────────────────────

export type InsightType =
  | 'TREND'
  | 'HABIT'
  | 'BEHAVIOUR'
  | 'EMOTIONAL'
  | 'RELATIONSHIP'
  | 'GOAL_PROGRESS'
  | 'CONTRADICTION'
  | 'OPPORTUNITY';

export type InsightStatus =
  | 'CANDIDATE'
  | 'VALIDATED'
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'SUPERSEDED';

export type InsightConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Insight {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: InsightType;
  status: InsightStatus;
  confidence: InsightConfidence;
  importance: number; // 1-10
  version: number;
  supportingMemoryIds: string[];
  affectedEntityIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Timeline ─────────────────────────────────────────────────────────────────

export type TimelineEventType = 'JOURNAL' | 'MEMORY' | 'INSIGHT' | 'MILESTONE';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  date: string; // ISO-8601
  relatedId: string; // ID of the journal/memory/insight
  metadata?: Record<string, unknown>;
}

// ── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string;
  answer: string;
  sources: string[];
  engine: 'MEMORY' | 'RAG' | 'ERROR';
}

// ── Progress ─────────────────────────────────────────────────────────────────

export interface UserProgress {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  weeklyEntryCount: number;
  lastEntryDate: string | null;
}

// ── Weekly Summary ───────────────────────────────────────────────────────────

export type SummaryType = 'BASIC' | 'AI_REFLECTION';
export type Trend = 'IMPROVING' | 'DECLINING' | 'MIXED';

export interface WeeklySummary {
  id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  daysWritten: number;
  dominantMood: Mood | null;
  type: SummaryType;
  summaryText: string;
  reflectionText: string | null;
  trend: Trend | null;
  suggestion: string | null;
  generatedAt: string;
}

// ── Entity (World Model) ────────────────────────────────────────────────────

export type EntityType =
  | 'PERSON'
  | 'PROJECT'
  | 'TECHNOLOGY'
  | 'COMPANY'
  | 'BOOK'
  | 'SKILL'
  | 'PLACE'
  | 'CONCEPT'
  | 'UNKNOWN';

export interface Entity {
  id: string;
  name: string;
  entityType: EntityType;
  aliases: string[];
}

// ── Graph (for Memory Explorer) ─────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  type: 'memory' | 'entity' | 'insight';
  group: string; // for color grouping
  val?: number; // node size
}

export interface GraphLink {
  source: string;
  target: string;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
