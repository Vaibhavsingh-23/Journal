// =============================================================================
// Mock Data — Second Brain
// =============================================================================
// Rich sample data for all pages. Replace with real API calls later.
// =============================================================================

import type {
  JournalEntry,
  Memory,
  Insight,
  TimelineEvent,
  SearchResult,
  WeeklySummary,
  UserProgress,
  User,
  GraphData,
  Entity,
} from '../types/models';

// ── User ─────────────────────────────────────────────────────────────────────

export const mockUser: User = {
  id: 'u_001',
  userName: 'Vaibhav',
  email: 'vaibhav@example.com',
  roles: ['USER'],
  preferences: {
    weeklySummaryEnabled: true,
    weeklySummaryDay: 1,
    emailNotificationsEnabled: false,
  },
};

// ── Journal Entries ──────────────────────────────────────────────────────────

export const mockJournalEntries: JournalEntry[] = [
  {
    id: 'j_001',
    title: 'The clarity that comes after stillness',
    content:
      'Spent the morning in complete silence — no phone, no music, just the sound of rain on the window. It struck me how rarely I give myself permission to just exist without input. The ideas that surfaced were surprisingly sharp. I mapped out the entire data pipeline architecture in my head before even touching my laptop. There is something powerful about letting the subconscious work without interruption.',
    date: '2026-07-17T08:30:00Z',
    mood: 'CALM',
    emotions: 'CURIOSITY,HOPE',
    aiSummary:
      'Morning silence led to a breakthrough in thinking about the data pipeline. Reflection on the value of stillness and uninterrupted thought.',
    motivationalThought:
      'Silence is not the absence of something — it is the presence of everything.',
    sentimentScore: 0.82,
    analysisCompleted: true,
  },
  {
    id: 'j_002',
    title: 'Why I keep returning to the same problem',
    content:
      'Third time this week I have found myself thinking about the memory consolidation algorithm. Not because it is broken, but because it feels like there is a more elegant approach hiding just beneath the surface. Talked to Rahul about it — he suggested looking at how the brain actually does this during sleep. The connection between biological memory and what we are building is fascinating.',
    date: '2026-07-16T14:20:00Z',
    mood: 'MOTIVATED',
    emotions: 'CURIOSITY,PRIDE',
    aiSummary:
      'Recurring fascination with the memory consolidation problem. Conversation with Rahul sparked ideas about bio-inspired approaches.',
    motivationalThought:
      'The best solutions are often the ones that feel inevitable in hindsight.',
    sentimentScore: 0.75,
    analysisCompleted: true,
  },
  {
    id: 'j_003',
    title: 'A difficult conversation, handled differently',
    content:
      'Had a tough conversation with the product lead about scope creep. In the past, I would have either avoided it or been too blunt. This time I framed it as shared constraints rather than blame. She actually agreed and we cut two features that were not essential. Small victory, but it felt significant. Growth is noticing the difference in how you handle recurring situations.',
    date: '2026-07-15T17:45:00Z',
    mood: 'GRATEFUL',
    emotions: 'PRIDE,HOPE',
    aiSummary:
      'Navigated a difficult product scope conversation with a new approach. Recognized personal growth in conflict handling.',
    motivationalThought: 'Growth is not dramatic — it is the quiet shift in how you respond.',
    sentimentScore: 0.68,
    analysisCompleted: true,
  },
  {
    id: 'j_004',
    title: 'The weight of unfinished things',
    content:
      'I keep a mental list of things I have started but not finished. Today it felt heavier than usual. The side project, the book I am halfway through, the workout plan I designed and abandoned. I know perfectionism is the enemy here — not laziness. Writing this down helps me see that the pattern is not about discipline. It is about fear of committing fully to one path.',
    date: '2026-07-14T21:10:00Z',
    mood: 'ANXIOUS',
    emotions: 'FRUSTRATION,GUILT',
    aiSummary:
      'Reflected on incomplete projects and recognized the underlying pattern as perfectionism and commitment anxiety rather than laziness.',
    motivationalThought:
      'Finishing one thing teaches you more than starting ten.',
    sentimentScore: -0.15,
    analysisCompleted: true,
  },
  {
    id: 'j_005',
    title: 'Sunday morning, slow and deliberate',
    content:
      'Made pour-over coffee for the first time in weeks. The ritual of it — heating water, measuring grounds, the slow pour — felt meditative. Read two chapters of Designing Data-Intensive Applications. No screens until 10am. This is the version of my weekends I want to protect.',
    date: '2026-07-13T09:00:00Z',
    mood: 'CALM',
    emotions: 'HAPPINESS,NOSTALGIA',
    aiSummary:
      'A deliberate slow morning with coffee ritual and reading. Commitment to protecting screen-free weekend time.',
    motivationalThought: 'Rituals are how we tell ourselves what matters.',
    sentimentScore: 0.88,
    analysisCompleted: true,
  },
  {
    id: 'j_006',
    title: 'What I learned from breaking the build',
    content:
      'Pushed a migration script to staging without testing the rollback path. It corrupted the user_progress table and took 45 minutes to fix. Nobody was angry — the team was supportive — but I was frustrated with myself. The lesson is clear: never trust a migration you cannot reverse. Added a pre-flight checklist to the deployment doc.',
    date: '2026-07-12T16:30:00Z',
    mood: 'CONFUSED',
    emotions: 'FRUSTRATION,PRIDE',
    aiSummary:
      'A staging incident led to a 45-minute recovery. Turned the mistake into a systematic improvement by creating a deployment checklist.',
    motivationalThought: 'Every system failure is a documentation opportunity.',
    sentimentScore: 0.12,
    analysisCompleted: true,
  },
  {
    id: 'j_007',
    title: 'The team dinner that changed my perspective',
    content:
      'We had a team dinner after the sprint review. Sat next to Priya, who I do not usually talk to much. Turns out she is building a personal knowledge graph in her spare time — almost exactly what our Memory Engine does. Her approach to entity resolution is completely different from ours. We are going to pair on it next week. Connections happen when you least expect them.',
    date: '2026-07-11T20:00:00Z',
    mood: 'EXCITED',
    emotions: 'SURPRISE,CURIOSITY',
    aiSummary:
      'Unexpected conversation with Priya revealed parallel work on knowledge graphs. Planning a collaboration session on entity resolution approaches.',
    motivationalThought: 'The most valuable connections are the ones you were not looking for.',
    sentimentScore: 0.91,
    analysisCompleted: true,
  },
  {
    id: 'j_008',
    title: 'Running in the rain',
    content:
      'Ran 5K in the rain today. Did not plan it — just looked outside and decided to go. Something about running when the world tells you to stay inside feels defiant in a good way. My pace was actually better than usual. Maybe discomfort sharpens focus. Applied the same energy to the afternoon coding session and knocked out three tickets.',
    date: '2026-07-10T07:15:00Z',
    mood: 'MOTIVATED',
    emotions: 'HAPPINESS,PRIDE',
    aiSummary:
      'Spontaneous rain run improved both mood and productivity. Drew parallels between physical discomfort and mental sharpness.',
    motivationalThought: 'Comfort is the enemy of momentum.',
    sentimentScore: 0.85,
    analysisCompleted: true,
  },
];

// ── Memories ─────────────────────────────────────────────────────────────────

export const mockMemories: Memory[] = [
  {
    id: 'mem_001',
    userId: 'u_001',
    memoryType: 'EPISODIC',
    status: 'ACTIVE',
    title: 'Morning stillness practice',
    summary:
      'A recurring pattern of finding clarity and creative breakthroughs through deliberate morning silence and screen-free rituals.',
    timeline: [
      'Practiced silence with rain sounds',
      'Made pour-over coffee ritual',
      'Read without screens until 10am',
    ],
    fragmentIds: ['f_001', 'f_005'],
    entityIds: ['ent_coffee', 'ent_morning_ritual'],
    createdAt: '2026-07-13T09:00:00Z',
    updatedAt: '2026-07-17T08:30:00Z',
  },
  {
    id: 'mem_002',
    userId: 'u_001',
    memoryType: 'PROJECT',
    status: 'ACTIVE',
    title: 'Memory consolidation algorithm',
    summary:
      'An evolving exploration of how to improve the memory consolidation system, drawing inspiration from biological sleep-based memory formation.',
    timeline: [
      'First thought about improvement',
      'Discussed with Rahul',
      'Connected to bio-inspired approach',
    ],
    fragmentIds: ['f_002'],
    entityIds: ['ent_rahul', 'ent_memory_engine', 'ent_second_brain'],
    createdAt: '2026-07-14T10:00:00Z',
    updatedAt: '2026-07-16T14:20:00Z',
  },
  {
    id: 'mem_003',
    userId: 'u_001',
    memoryType: 'RELATIONAL',
    status: 'ACTIVE',
    title: 'Growing connection with Priya',
    summary:
      'An unexpected professional connection discovered through a team dinner. Priya is working on parallel knowledge graph research.',
    timeline: [
      'Met at team dinner',
      'Discovered shared interest in knowledge graphs',
      'Planned collaboration on entity resolution',
    ],
    fragmentIds: ['f_007'],
    entityIds: ['ent_priya', 'ent_knowledge_graph'],
    createdAt: '2026-07-11T20:00:00Z',
    updatedAt: '2026-07-11T20:00:00Z',
  },
  {
    id: 'mem_004',
    userId: 'u_001',
    memoryType: 'SEMANTIC',
    status: 'ACTIVE',
    title: 'Perfectionism as commitment avoidance',
    summary:
      'A growing self-awareness that unfinished projects stem from perfectionism and fear of commitment rather than lack of discipline.',
    timeline: [
      'Noticed pattern of unfinished projects',
      'Reframed from laziness to fear',
      'Writing helped clarify the root cause',
    ],
    fragmentIds: ['f_004'],
    entityIds: ['ent_perfectionism', 'ent_self_growth'],
    createdAt: '2026-07-14T21:10:00Z',
    updatedAt: '2026-07-14T21:10:00Z',
  },
  {
    id: 'mem_005',
    userId: 'u_001',
    memoryType: 'GOAL',
    status: 'ACTIVE',
    title: 'Conflict resolution growth',
    summary:
      'Tracking improvement in handling difficult conversations — from avoidance to constructive framing.',
    timeline: [
      'Handled scope creep conversation with product lead',
      'Used shared constraints framing instead of blame',
      'Successfully cut two non-essential features',
    ],
    fragmentIds: ['f_003'],
    entityIds: ['ent_product_lead', 'ent_communication'],
    createdAt: '2026-07-15T17:45:00Z',
    updatedAt: '2026-07-15T17:45:00Z',
  },
  {
    id: 'mem_006',
    userId: 'u_001',
    memoryType: 'EPISODIC',
    status: 'ACTIVE',
    title: 'Physical discomfort sharpens focus',
    summary:
      'Running in adverse conditions correlates with higher afternoon productivity. A pattern of using physical challenge to reset mental state.',
    timeline: [
      'Ran 5K in rain spontaneously',
      'Better-than-usual pace',
      'Completed three tickets in afternoon',
    ],
    fragmentIds: ['f_008'],
    entityIds: ['ent_running', 'ent_productivity'],
    createdAt: '2026-07-10T07:15:00Z',
    updatedAt: '2026-07-10T07:15:00Z',
  },
];

// ── Insights ─────────────────────────────────────────────────────────────────

export const mockInsights: Insight[] = [
  {
    id: 'ins_001',
    userId: 'u_001',
    title: 'Silence fuels your best thinking',
    description:
      'Across multiple entries, your most creative and productive days begin with intentional silence or screen-free mornings. This is not coincidental — it is a pattern worth protecting.',
    type: 'HABIT',
    status: 'ACTIVE',
    confidence: 'HIGH',
    importance: 9,
    version: 2,
    supportingMemoryIds: ['mem_001'],
    affectedEntityIds: ['ent_morning_ritual'],
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: '2026-07-17T00:00:00Z',
  },
  {
    id: 'ins_002',
    userId: 'u_001',
    title: 'You are becoming better at difficult conversations',
    description:
      'Your approach to conflict has shifted from avoidance toward constructive framing. The scope conversation with the product lead is a clear example of this growth.',
    type: 'GOAL_PROGRESS',
    status: 'ACTIVE',
    confidence: 'MEDIUM',
    importance: 8,
    version: 1,
    supportingMemoryIds: ['mem_005'],
    affectedEntityIds: ['ent_communication'],
    createdAt: '2026-07-16T00:00:00Z',
    updatedAt: '2026-07-16T00:00:00Z',
  },
  {
    id: 'ins_003',
    userId: 'u_001',
    title: 'Physical activity directly boosts your coding output',
    description:
      'Entries show a consistent pattern: days with morning exercise are followed by higher-than-average afternoon productivity. The rain run → three tickets correlation is the latest data point.',
    type: 'TREND',
    status: 'ACTIVE',
    confidence: 'HIGH',
    importance: 7,
    version: 1,
    supportingMemoryIds: ['mem_006'],
    affectedEntityIds: ['ent_running', 'ent_productivity'],
    createdAt: '2026-07-12T00:00:00Z',
    updatedAt: '2026-07-12T00:00:00Z',
  },
  {
    id: 'ins_004',
    userId: 'u_001',
    title: 'Perfectionism is your hidden blocker',
    description:
      'Multiple reflections point to a pattern where projects stall not from lack of ability, but from fear of imperfect completion. Naming this pattern is the first step to overcoming it.',
    type: 'EMOTIONAL',
    status: 'ACTIVE',
    confidence: 'MEDIUM',
    importance: 8,
    version: 1,
    supportingMemoryIds: ['mem_004'],
    affectedEntityIds: ['ent_perfectionism'],
    createdAt: '2026-07-14T00:00:00Z',
    updatedAt: '2026-07-14T00:00:00Z',
  },
  {
    id: 'ins_005',
    userId: 'u_001',
    title: 'Unexpected connections lead to your best collaborations',
    description:
      'The Priya connection at the team dinner mirrors past breakthroughs that came from unplanned conversations. Your best ideas emerge at the intersection of different perspectives.',
    type: 'RELATIONSHIP',
    status: 'ACTIVE',
    confidence: 'MEDIUM',
    importance: 6,
    version: 1,
    supportingMemoryIds: ['mem_003'],
    affectedEntityIds: ['ent_priya', 'ent_knowledge_graph'],
    createdAt: '2026-07-12T00:00:00Z',
    updatedAt: '2026-07-12T00:00:00Z',
  },
];

// ── Timeline ─────────────────────────────────────────────────────────────────

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'tl_001',
    type: 'JOURNAL',
    title: 'The clarity that comes after stillness',
    description: 'Morning silence led to a breakthrough in data pipeline thinking.',
    date: '2026-07-17T08:30:00Z',
    relatedId: 'j_001',
  },
  {
    id: 'tl_002',
    type: 'INSIGHT',
    title: 'Silence fuels your best thinking',
    description: 'Pattern detected: screen-free mornings correlate with creative output.',
    date: '2026-07-17T00:00:00Z',
    relatedId: 'ins_001',
  },
  {
    id: 'tl_003',
    type: 'JOURNAL',
    title: 'Why I keep returning to the same problem',
    description: 'Recurring fascination with memory consolidation algorithm.',
    date: '2026-07-16T14:20:00Z',
    relatedId: 'j_002',
  },
  {
    id: 'tl_004',
    type: 'MEMORY',
    title: 'Memory consolidation algorithm',
    description: 'Bio-inspired approach discussion with Rahul.',
    date: '2026-07-16T14:20:00Z',
    relatedId: 'mem_002',
  },
  {
    id: 'tl_005',
    type: 'JOURNAL',
    title: 'A difficult conversation, handled differently',
    description: 'Scope creep conversation with product lead.',
    date: '2026-07-15T17:45:00Z',
    relatedId: 'j_003',
  },
  {
    id: 'tl_006',
    type: 'INSIGHT',
    title: 'You are becoming better at difficult conversations',
    description: 'Goal progress detected in conflict resolution skills.',
    date: '2026-07-16T00:00:00Z',
    relatedId: 'ins_002',
  },
  {
    id: 'tl_007',
    type: 'JOURNAL',
    title: 'The weight of unfinished things',
    description: 'Reflected on perfectionism as root cause of incomplete projects.',
    date: '2026-07-14T21:10:00Z',
    relatedId: 'j_004',
  },
  {
    id: 'tl_008',
    type: 'JOURNAL',
    title: 'Sunday morning, slow and deliberate',
    description: 'Pour-over coffee ritual and screen-free morning.',
    date: '2026-07-13T09:00:00Z',
    relatedId: 'j_005',
  },
  {
    id: 'tl_009',
    type: 'MILESTONE',
    title: '7-day writing streak',
    description: 'You wrote every day for a full week. Consistency builds insight.',
    date: '2026-07-17T00:00:00Z',
    relatedId: '',
  },
  {
    id: 'tl_010',
    type: 'JOURNAL',
    title: 'The team dinner that changed my perspective',
    description: 'Met Priya, discovered shared knowledge graph interest.',
    date: '2026-07-11T20:00:00Z',
    relatedId: 'j_007',
  },
  {
    id: 'tl_011',
    type: 'JOURNAL',
    title: 'Running in the rain',
    description: 'Spontaneous run led to high-productivity afternoon.',
    date: '2026-07-10T07:15:00Z',
    relatedId: 'j_008',
  },
];

// ── Weekly Summary ───────────────────────────────────────────────────────────

export const mockWeeklySummary: WeeklySummary = {
  id: 'ws_001',
  userId: 'u_001',
  weekStartDate: '2026-07-10',
  weekEndDate: '2026-07-16',
  daysWritten: 7,
  dominantMood: 'CALM',
  type: 'AI_REFLECTION',
  summaryText:
    'You wrote every day this week — a full 7-day streak. Your entries ranged from quiet morning reflections to energetic post-run productivity sessions. The dominant mood was calm, with strong undercurrents of curiosity and motivation.',
  reflectionText:
    'This was a week of connection — with yourself through morning silence, with Rahul through technical dialogue, with Priya through unexpected dinner conversation, and with your own growth patterns through honest self-reflection. The thread connecting all of it: you are learning to trust the process.',
  trend: 'IMPROVING',
  suggestion:
    'Your morning stillness practice is clearly valuable. Consider protecting it as a non-negotiable. Also, the Priya collaboration could be a catalyst — schedule that pairing session before momentum fades.',
  generatedAt: '2026-07-17T09:00:00Z',
};

// ── User Progress ────────────────────────────────────────────────────────────

export const mockUserProgress: UserProgress = {
  currentStreak: 8,
  longestStreak: 14,
  totalEntries: 47,
  weeklyEntryCount: 7,
  lastEntryDate: '2026-07-17',
};

// ── Entities ─────────────────────────────────────────────────────────────────

export const mockEntities: Entity[] = [
  { id: 'ent_rahul', name: 'Rahul', entityType: 'PERSON', aliases: ['Rahul'] },
  { id: 'ent_priya', name: 'Priya', entityType: 'PERSON', aliases: ['Priya'] },
  { id: 'ent_product_lead', name: 'Product Lead', entityType: 'PERSON', aliases: ['PL'] },
  { id: 'ent_memory_engine', name: 'Memory Engine', entityType: 'PROJECT', aliases: [] },
  { id: 'ent_second_brain', name: 'Second Brain', entityType: 'PROJECT', aliases: [] },
  { id: 'ent_knowledge_graph', name: 'Knowledge Graph', entityType: 'TECHNOLOGY', aliases: [] },
  { id: 'ent_running', name: 'Running', entityType: 'SKILL', aliases: ['5K'] },
  { id: 'ent_coffee', name: 'Coffee', entityType: 'CONCEPT', aliases: ['pour-over'] },
  { id: 'ent_morning_ritual', name: 'Morning Ritual', entityType: 'CONCEPT', aliases: [] },
  { id: 'ent_productivity', name: 'Productivity', entityType: 'CONCEPT', aliases: [] },
  { id: 'ent_perfectionism', name: 'Perfectionism', entityType: 'CONCEPT', aliases: [] },
  { id: 'ent_self_growth', name: 'Self Growth', entityType: 'CONCEPT', aliases: [] },
  { id: 'ent_communication', name: 'Communication', entityType: 'SKILL', aliases: [] },
];

// ── Graph Data (for Memory Explorer) ─────────────────────────────────────────

export const mockGraphData: GraphData = {
  nodes: [
    // Memory nodes
    { id: 'mem_001', label: 'Morning stillness', type: 'memory', group: 'EPISODIC', val: 8 },
    { id: 'mem_002', label: 'Memory consolidation', type: 'memory', group: 'PROJECT', val: 10 },
    { id: 'mem_003', label: 'Connection with Priya', type: 'memory', group: 'RELATIONAL', val: 6 },
    { id: 'mem_004', label: 'Perfectionism pattern', type: 'memory', group: 'SEMANTIC', val: 7 },
    { id: 'mem_005', label: 'Conflict resolution', type: 'memory', group: 'GOAL', val: 6 },
    { id: 'mem_006', label: 'Exercise → focus', type: 'memory', group: 'EPISODIC', val: 7 },
    // Entity nodes
    { id: 'ent_rahul', label: 'Rahul', type: 'entity', group: 'PERSON', val: 4 },
    { id: 'ent_priya', label: 'Priya', type: 'entity', group: 'PERSON', val: 4 },
    { id: 'ent_morning_ritual', label: 'Morning Ritual', type: 'entity', group: 'CONCEPT', val: 5 },
    { id: 'ent_memory_engine', label: 'Memory Engine', type: 'entity', group: 'PROJECT', val: 5 },
    { id: 'ent_knowledge_graph', label: 'Knowledge Graph', type: 'entity', group: 'TECHNOLOGY', val: 4 },
    { id: 'ent_running', label: 'Running', type: 'entity', group: 'SKILL', val: 3 },
    { id: 'ent_productivity', label: 'Productivity', type: 'entity', group: 'CONCEPT', val: 5 },
    { id: 'ent_perfectionism', label: 'Perfectionism', type: 'entity', group: 'CONCEPT', val: 4 },
    { id: 'ent_communication', label: 'Communication', type: 'entity', group: 'SKILL', val: 3 },
    // Insight nodes
    { id: 'ins_001', label: 'Silence fuels thinking', type: 'insight', group: 'HABIT', val: 6 },
    { id: 'ins_003', label: 'Exercise boosts output', type: 'insight', group: 'TREND', val: 5 },
    { id: 'ins_005', label: 'Unexpected connections', type: 'insight', group: 'RELATIONSHIP', val: 4 },
  ],
  links: [
    // Memory ↔ Entity links
    { source: 'mem_001', target: 'ent_morning_ritual', label: 'involves' },
    { source: 'mem_002', target: 'ent_rahul', label: 'discussed with' },
    { source: 'mem_002', target: 'ent_memory_engine', label: 'relates to' },
    { source: 'mem_003', target: 'ent_priya', label: 'involves' },
    { source: 'mem_003', target: 'ent_knowledge_graph', label: 'shared interest' },
    { source: 'mem_004', target: 'ent_perfectionism', label: 'relates to' },
    { source: 'mem_005', target: 'ent_communication', label: 'involves' },
    { source: 'mem_006', target: 'ent_running', label: 'involves' },
    { source: 'mem_006', target: 'ent_productivity', label: 'correlates' },
    // Insight ↔ Memory links
    { source: 'ins_001', target: 'mem_001', label: 'supported by' },
    { source: 'ins_003', target: 'mem_006', label: 'supported by' },
    { source: 'ins_005', target: 'mem_003', label: 'supported by' },
    // Cross links
    { source: 'ent_productivity', target: 'ent_morning_ritual', label: 'connected' },
    { source: 'ent_memory_engine', target: 'ent_knowledge_graph', label: 'related tech' },
  ],
};

// ── Sentiment data for charts ────────────────────────────────────────────────

export const mockSentimentData = [
  { date: 'Jul 10', score: 0.85, mood: 'MOTIVATED' },
  { date: 'Jul 11', score: 0.91, mood: 'EXCITED' },
  { date: 'Jul 12', score: 0.12, mood: 'CONFUSED' },
  { date: 'Jul 13', score: 0.88, mood: 'CALM' },
  { date: 'Jul 14', score: -0.15, mood: 'ANXIOUS' },
  { date: 'Jul 15', score: 0.68, mood: 'GRATEFUL' },
  { date: 'Jul 16', score: 0.75, mood: 'MOTIVATED' },
  { date: 'Jul 17', score: 0.82, mood: 'CALM' },
];

export const mockMoodDistribution = [
  { mood: 'Calm', count: 3, fill: '#7c9a92' },
  { mood: 'Motivated', count: 2, fill: '#c4956a' },
  { mood: 'Grateful', count: 1, fill: '#b8a9c9' },
  { mood: 'Excited', count: 1, fill: '#d4a574' },
  { mood: 'Anxious', count: 1, fill: '#8b7355' },
  { mood: 'Confused', count: 1, fill: '#6b7b8d' },
];

// ── Search mock ──────────────────────────────────────────────────────────────

export const mockSearchResults: SearchResult[] = [
  {
    id: 'sr_001',
    answer:
      'Based on your entries, your morning stillness practice — silence, no screens, and slow rituals like pour-over coffee — consistently leads to your most creative and productive days. You described it as "letting the subconscious work without interruption."',
    sources: ['Jul 17, 2026', 'Jul 13, 2026'],
    engine: 'MEMORY',
  },
];
