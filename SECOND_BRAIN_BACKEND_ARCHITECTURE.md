# Second Brain — Backend Architecture

> **Generated:** 2026-07-17
> **Scope:** Complete reverse-engineering of `backend/` (Spring Boot) and `ai-service/` (FastAPI/Python)
> **Methodology:** Every statement is grounded in actual source code. Gaps and missing implementations are explicitly documented.

---

## Table of Contents

1. [System Overview & Topology](#1-system-overview--topology)
2. [Technology Stack](#2-technology-stack)
3. [Domain Model & Entity Map](#3-domain-model--entity-map)
4. [Authentication & Security](#4-authentication--security)
5. [API Inventory — Spring Boot](#5-api-inventory--spring-boot)
6. [API Inventory — AI Service (FastAPI)](#6-api-inventory--ai-service-fastapi)
7. [Service Layer — Spring Boot](#7-service-layer--spring-boot)
8. [AI Integration — Gemini (Spring Boot)](#8-ai-integration--gemini-spring-boot)
9. [Embedding & Vector Search](#9-embedding--vector-search)
10. [RAG Pipeline](#10-rag-pipeline)
11. [Cognitive Pipeline — Capture Engine](#11-cognitive-pipeline--capture-engine)
12. [Cognitive Pipeline — Memory Engine](#12-cognitive-pipeline--memory-engine)
13. [Cognitive Pipeline — Insight Engine](#13-cognitive-pipeline--insight-engine)
14. [Cognitive Orchestrator](#14-cognitive-orchestrator)
15. [Memory Retrieval Pipeline](#15-memory-retrieval-pipeline)
16. [Background Jobs & Scheduling](#16-background-jobs--scheduling)
17. [Data Migration & Lifecycle](#17-data-migration--lifecycle)
18. [Configuration & Environment](#18-configuration--environment)
19. [Error Handling & Resilience](#19-error-handling--resilience)
20. [MongoDB Collections & Indexes](#20-mongodb-collections--indexes)
21. [Inter-Service Communication](#21-inter-service-communication)
22. [Known Gaps & Architectural Risks](#22-known-gaps--architectural-risks)

---

## 1. System Overview & Topology

The Second Brain is a **two-service architecture**:

```
┌─────────────────────┐     REST (JSON)      ┌─────────────────────┐
│   Spring Boot        │ ──────────────────▶  │   FastAPI (Python)   │
│   (Port 8080)        │                      │   (Port 8001)        │
│                      │                      │                      │
│  • Auth (JWT)        │                      │  • Embedding (Gemini)│
│  • Journal CRUD      │                      │  • RAG Pipeline      │
│  • User Management   │                      │  • Capture Pipeline  │
│  • Weekly Summaries  │                      │  • Memory Engine     │
│  • Dashboard         │                      │  • Insight Engine    │
│  • Admin             │                      │  • Cognitive Orch.   │
│  • Gemini Analysis   │                      │  • Retrieval Gateway │
└────────┬─────────────┘                      └────────┬─────────────┘
         │                                             │
         │  MongoDB Atlas                              │  MongoDB Atlas (same)
         │  (journaldb)                                │  Pinecone Cloud
         ▼                                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MongoDB Atlas (Cluster0)                       │
│                      Database: journaldb                            │
│                                                                     │
│  Collections (Spring):         Collections (Python):                │
│  • users                       • knowledge_objects                  │
│  • journal_entries             • entities                           │
│  • user_progress               • memory_fragments                  │
│  • weekly_summaries            • memories                          │
│                                • insights                          │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│   Pinecone Cloud     │
│   Index: journal-    │
│   entries            │
│   Dim: 1024          │
└─────────────────────┘
```

### Deployment

- Both services are deployed on **Render** (free tier).
- Frontend: `https://journal-frontend-v45t.onrender.com`
- Spring Backend: `https://journal-backend.onrender.com`
- AI Service: Separate Render service (URL configured via `AI_SERVICE_URL`).

### Communication Pattern

- **Frontend → Spring Boot:** All user-facing requests go through Spring Boot at context path `/journal`.
- **Spring Boot → FastAPI:** Spring Boot delegates AI work to FastAPI via `RestTemplate` (HTTP POST). The call is **async** (via `@Async` annotation on `AiEmbeddingService.embedEntry`).
- **FastAPI → MongoDB:** Direct pymongo connection to the same Atlas cluster. FastAPI reads journal entries directly from MongoDB for bulk embedding.
- **FastAPI → Pinecone:** Direct Pinecone client for vector upsert/query.
- **FastAPI → Gemini:** Direct `google-genai` SDK calls for embeddings and generative AI.

---

## 2. Technology Stack

### Spring Boot (Java)

| Component | Technology | Version Notes |
|---|---|---|
| Framework | Spring Boot 3.x | Jakarta EE namespace |
| Database | MongoDB Atlas | Via Spring Data MongoDB |
| Auth | JWT (JJWT 0.12.x) | HS256, Bearer tokens |
| AI | Gemini API | Via `RestTemplate` HTTP calls |
| HTTP Client | Apache HttpClient5 | Pooled connections (50 max, 20/route) |
| Scheduling | `@Scheduled` | Cron-based weekly summaries |
| Async | `@Async` | For non-blocking AI embedding calls |
| Email | Spring Mail | SMTP via Gmail |
| API Docs | SpringDoc/Swagger | `/journal/swagger-ui.html` |
| Build | Maven/Gradle | Lombok for boilerplate reduction |

### FastAPI (Python)

| Component | Technology | Notes |
|---|---|---|
| Framework | FastAPI | With uvicorn ASGI server |
| Embedding Model | `gemini-embedding-001` | 1024 dimensions, via `langchain_google_genai` |
| Generative AI | `google-genai` SDK | Gemini 2.5-flash / 2.0-flash-lite / 2.5-flash-lite |
| Vector DB | Pinecone | Cloud-hosted, `journal-entries` index |
| Document DB | pymongo | Direct MongoDB driver (same Atlas cluster) |
| Structured Output | Pydantic v2 | `model_dump()`, `BaseModel` throughout |

---

## 3. Domain Model & Entity Map

### Spring Boot Entities

#### `User` (MongoDB collection: `users`)

| Field | Type | Notes |
|---|---|---|
| `id` | `ObjectId` | Auto-generated |
| `userName` | `String` | Unique, used as JWT subject |
| `password` | `String` | BCrypt-hashed |
| `email` | `String` | For email notifications |
| `roles` | `List<String>` | Default: `["USER"]`, also `"ADMIN"` |
| `journalEntryIds` | `List<ObjectId>` | **Legacy.** References to owned entries. Partially replaced by `JournalEntry.userId`. |
| `preferences` | `UserPreferences` (embedded) | Weekly summary config |

#### `UserPreferences` (embedded in `User`)

| Field | Type | Default |
|---|---|---|
| `weeklySummaryEnabled` | `Boolean` | `false` |
| `weeklySummaryDay` | `Integer` | `1` (Monday) |
| `emailNotificationsEnabled` | `Boolean` | `false` |

#### `JournalEntry` (MongoDB collection: `journal_entries`)

| Field | Type | Notes |
|---|---|---|
| `id` | `ObjectId` | Auto-generated |
| `title` | `String` | User-provided |
| `content` | `String` | Main journal text |
| `date` | `LocalDateTime` | Entry timestamp |
| `mood` | `String` | AI-detected (e.g., "HAPPY", "SAD") |
| `emotions` | `String` | AI-detected emotion tags |
| `aiSummary` | `String` | Gemini-generated summary |
| `motivationalThought` | `String` | Gemini-generated motivational quote |
| `sentimentScore` | `Double` | AI sentiment [-1.0, 1.0] |
| `analysisCompleted` | `Boolean` | `true` after Gemini finishes |
| `userId` | `ObjectId` | Owner reference (backfilled by migration) |

**Enum: `Mood`** — `HAPPY`, `SAD`, `ANXIOUS`, `ANGRY`, `CALM`, `EXCITED`, `GRATEFUL`, `CONFUSED`, `MOTIVATED`, `NEUTRAL`

**Enum: `Emotion`** — `HAPPINESS`, `SADNESS`, `ANGER`, `FEAR`, `SURPRISE`, `DISGUST`, `LOVE`, `HOPE`, `GUILT`, `PRIDE`, `SHAME`, `CURIOSITY`, `FRUSTRATION`, `JEALOUSY`, `LONELINESS`, `BOREDOM`, `NOSTALGIA`

#### `UserProgress` (MongoDB collection: `user_progress`)

| Field | Type | Notes |
|---|---|---|
| `id` | `ObjectId` | Auto-generated |
| `userId` | `ObjectId` | One-to-one with User |
| `currentStreak` | `int` | Dynamically calculated on write |
| `longestStreak` | `int` | All-time maximum |
| `totalEntries` | `int` | Lifetime count |
| `weeklyEntryCount` | `int` | Current week (Mon–Sun) |
| `lastEntryDate` | `LocalDate` | Date-only of last entry |
| `lastEntryAt` | `LocalDateTime` | Full timestamp of last entry |

#### `WeeklySummary` (MongoDB collection: `weekly_summaries`)

| Field | Type | Notes |
|---|---|---|
| `id` | `ObjectId` | Auto-generated |
| `userId` | `ObjectId` | Owner reference |
| `weekStartDate` | `LocalDate` | Monday of the summarized week |
| `weekEndDate` | `LocalDate` | Sunday of the summarized week |
| `daysWritten` | `int` | How many days had entries |
| `dominantMood` | `String` | Most frequent mood that week |
| `type` | `String` | `"BASIC"` or `"AI_REFLECTION"` |
| `summaryText` | `String` | Either stats-based or AI-generated |
| `reflectionText` | `String` | AI narrative reflection |
| `trend` | `String` | `"IMPROVING"`, `"DECLINING"`, `"MIXED"` |
| `suggestion` | `String` | AI suggestion for next week |
| `generatedAt` | `LocalDateTime` | When the summary was created |
| `emailSent` | `boolean` | Whether the email notification was sent |

### Python AI Service Domain Models

#### `KnowledgeObject` (collection: `knowledge_objects`)

| Field | Type | Notes |
|---|---|---|
| `id` | `str` | Format: `ko_{capture_id}` |
| `user_id` | `str` | Owner reference |
| `provenance` | `Provenance` | Capture traceability |
| `summary` | `str` | AI-generated summary |
| `entities` | `List[Entity]` | Resolved entities |
| `observations` | `List[Observation]` | Extracted observations |
| `metadata` | `Dict` | Confidence scores, model info |
| `created_at` | `str` | ISO-8601 |

#### `Entity` (collection: `entities`)

| Field | Type | Notes |
|---|---|---|
| `id` | `str` | Format: `ent_{uuid}` |
| `name` | `str` | Canonical (lowercased) name |
| `entity_type` | `EntityType` | PERSON, PROJECT, TECHNOLOGY, COMPANY, BOOK, SKILL, PLACE, CONCEPT, UNKNOWN |
| `aliases` | `List[str]` | Original forms before canonicalization |
| `user_id` | `str` | Owner |
| `created_at` | `str` | ISO-8601 |
| `updated_at` | `str` | ISO-8601 |

#### `Observation` (embedded in KnowledgeObject)

| Field | Type | Notes |
|---|---|---|
| `id` | `str` | Format: `obs_raw_{index}` |
| `type` | `ObservationType` | STATE, ACTION, RELATIONSHIP, EMOTION, GOAL, DECISION, EVENT |
| `perspective` | `Perspective` | EXPLICIT, INFERRED, EXTERNAL |
| `description` | `str` | Human-readable |
| `confidence` | `Confidence` | LOW, MEDIUM, HIGH |
| `timestamp` | `str` | ISO-8601 |

#### `MemoryFragment` (collection: `memory_fragments`)

| Field | Type | Notes |
|---|---|---|
| `id` | `str` | Unique fragment ID |
| `user_id` | `str` | Owner |
| `knowledge_object_id` | `str` | Source KO (unique constraint) |
| `capture_id` | `str` | Root capture for traceability |
| `content` | `str` | Synthesized narrative |
| `entity_ids` | `List[str]` | Canonical entity IDs |
| `created_at` | `str` | ISO-8601, immutable |

#### `Memory` (collection: `memories`)

| Field | Type | Notes |
|---|---|---|
| `id` | `str` | Format: `mem_{uuid}` |
| `user_id` | `str` | Owner |
| `memory_type` | `MemoryType` | EPISODIC, SEMANTIC, RELATIONAL, PROJECT, GOAL |
| `status` | `MemoryStatus` | EMERGING, ACTIVE, ARCHIVED, CONSOLIDATED |
| `pending_insight_generation` | `bool` | Dirty flag for insight pipeline |
| `title` | `str` | AI-generated evolving title |
| `summary` | `str` | AI-generated evolving summary |
| `timeline` | `List[str]` | Chronological summary points |
| `fragment_ids` | `List[str]` | References to MemoryFragments |
| `entity_ids` | `List[str]` | Canonical entities |
| `created_at` | `str` | ISO-8601 |
| `updated_at` | `str` | ISO-8601 |

#### `Insight` (collection: `insights`)

| Field | Type | Notes |
|---|---|---|
| `id` | `str` | UUID |
| `user_id` | `str` | Owner |
| `title` | `str` | Pattern title |
| `description` | `str` | Detailed explanation |
| `type` | `InsightType` | TREND, HABIT, BEHAVIOUR, EMOTIONAL, RELATIONSHIP, GOAL_PROGRESS, CONTRADICTION, OPPORTUNITY |
| `status` | `InsightStatus` | CANDIDATE, VALIDATED, ACTIVE, ARCHIVED, SUPERSEDED |
| `confidence` | `InsightConfidence` | LOW, MEDIUM, HIGH |
| `importance` | `int` | 1-10 scale |
| `version` | `int` | Mutation tracking |
| `supporting_memory_ids` | `List[str]` | Evidence (supporting) |
| `contradicting_memory_ids` | `List[str]` | Evidence (contradicting) |
| `affected_entity_ids` | `List[str]` | Involved entities |
| `evidence` | `List[InsightEvidence]` | Detailed provenance chain |
| `created_at` | `str` | ISO-8601 |
| `updated_at` | `str` | ISO-8601 |

---

## 4. Authentication & Security

### Flow

```
POST /journal/public/create-user   →  Register (username + password + email)
POST /journal/public/login         →  Authenticate → JWT token returned
GET  /journal/**                   →  JWT in Authorization header required
```

### Implementation

| Component | File | Responsibility |
|---|---|---|
| `SpringSecurity` | `SecurityConfig.java` | Configures filter chain, CORS, CSRF disabled |
| `JwtTokenProvider` | `JwtTokenProvider.java` | Token generation (HS256), validation, parsing |
| `JwtAuthenticationFilter` | `JwtAuthenticationFilter.java` | `OncePerRequestFilter` — extracts Bearer token, sets `SecurityContext` |
| `UserDetailsServiceImpl` | `UserDetailsServiceImpl.java` | Loads `UserDetails` from MongoDB by username |

### Security Configuration

- **CORS:** Allowed origins: `localhost:5173`, `localhost:5500`, `localhost:8080`, and production Render URLs.
- **CSRF:** Disabled (stateless JWT).
- **Public Endpoints:** `/public/**`, `/api-docs/**`, `/swagger-ui/**`, `/actuator/**`, `/health`.
- **All other endpoints:** Require valid JWT in `Authorization: Bearer <token>` header.
- **Password Encoding:** BCrypt via `BCryptPasswordEncoder`.

### JWT Details

| Property | Value | Source |
|---|---|---|
| Algorithm | HS256 | `Keys.hmacShaKeyFor()` |
| Secret | `${JWT_SECRET}` (min 256-bit) | `application.yml` |
| Expiry | `${JWT_EXPIRY_MS}` (default 24h) | `application.yml` |
| Subject | Username | Set in `JwtTokenProvider.generateToken()` |
| Token Type | `Bearer` | Returned in `AuthResponse.tokenType` |

### Login Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "john",
  "tokenType": "Bearer",
  "expiresAt": "2026-07-18T12:00:00Z"
}
```

### Registration Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "john",
  "tokenType": "Bearer",
  "expiresAt": "2026-07-18T12:00:00Z"
}
```

Registration auto-logs-in the user by returning a token immediately.

---

## 5. API Inventory — Spring Boot

All endpoints are prefixed with `/journal` (context path).

### Public Endpoints (No Auth Required)

| Method | Path | Controller | Description |
|---|---|---|---|
| `POST` | `/public/create-user` | `PublicController` | Register a new user. Body: `CreateUserRequest {userName, password, email}`. Returns `AuthResponse`. |
| `POST` | `/public/login` | `PublicController` | Authenticate. Body: `LoginRequest {username, password}`. Returns `AuthResponse`. |
| `GET` | `/health` | `HealthController` | Liveness check. Returns `{"status": "UP"}`. |

### Journal Endpoints (Auth Required)

| Method | Path | Controller | Description |
|---|---|---|---|
| `GET` | `/journal` | `JournalEntryController` | Get paginated entries for authenticated user. Params: `page` (default 0), `size` (default 10). Returns `Page<JournalEntryDTO>`. |
| `GET` | `/journal/id/{id}` | `JournalEntryController` | Get single entry by ObjectId. Returns `JournalEntryDTO`. |
| `POST` | `/journal` | `JournalEntryController` | Create new entry. Body: `JournalEntry {title, content}`. Returns saved `JournalEntryDTO`. Triggers async AI analysis + embedding. |
| `PUT` | `/journal/id/{id}` | `JournalEntryController` | Update entry by ObjectId. Body: `JournalEntry {title, content}`. Returns updated `JournalEntryDTO`. |
| `DELETE` | `/journal/id/{id}` | `JournalEntryController` | Delete entry by ObjectId. Returns `true/false`. |

### User Endpoints (Auth Required)

| Method | Path | Controller | Description |
|---|---|---|---|
| `GET` | `/user` | `UserController` | Get authenticated user details. Returns `User` (sans password). |
| `PUT` | `/user` | `UserController` | Update user profile. Body: `User`. Returns updated `User`. |
| `DELETE` | `/user` | `UserController` | Delete account and all associated data (entries, progress, summaries). |
| `PUT` | `/user/preferences` | `UserController` | Update preferences. Body: `UserPreferencesUpdateRequest`. |
| `GET` | `/user/progress` | `UserController` | Get user progress/streaks. Returns `UserProgressDTO`. |

### Dashboard Endpoints (Auth Required)

| Method | Path | Controller | Description |
|---|---|---|---|
| `GET` | `/dashboard/latest-summary` | `DashboardController` | Get most recent weekly summary. Returns `WeeklySummaryDashboardDTO` or `204 No Content`. |
| `POST` | `/dashboard/generate-summary` | `DashboardController` | Manually trigger weekly summary generation. Returns generated `WeeklySummary`. |

### Admin Endpoints (ADMIN Role Required)

| Method | Path | Controller | Description |
|---|---|---|---|
| `GET` | `/admin/all-users` | `AdminController` | List all users. |
| `POST` | `/admin/create-admin-user` | `AdminController` | Create user with ADMIN role. |

---

## 6. API Inventory — AI Service (FastAPI)

All endpoints are prefixed with `/ai`.

### Core Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Service info + endpoint listing |
| `GET` | `/ai/health` | Liveness check |
| `POST` | `/ai/embed/entry` | Embed single journal entry into Pinecone. Triggers cognitive pipeline in background. |
| `POST` | `/ai/embed/all` | Bulk-embed all entries for a user from MongoDB. |
| `POST` | `/ai/query` | RAG query — answer question from journal context. Uses Memory Retrieval first, falls back to Document RAG. |

### Debug Endpoints (Developer-Only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/ai/debug/knowledge?user_id=` | Inspect stored KnowledgeObjects |
| `GET` | `/ai/debug/memories?user_id=` | Inspect stored Memories |
| `GET` | `/ai/debug/insights?user_id=` | Inspect stored Insights |
| `GET` | `/ai/debug/pipeline?user_id=` | View dirty memories pending insight generation |
| `GET` | `/ai/debug/health?user_id=` | Diagnostic pipeline health with counts |

### Request/Response Schemas

**`POST /ai/embed/entry`**
```json
// Request
{
  "entry_id": "667...",   // MongoDB ObjectId string
  "text": "Today I ...",
  "user_id": "665...",
  "date": "2026-06-20"   // ISO-8601
}

// Response
{
  "status": "embedded",
  "entry_id": "667..."
}
```

**`POST /ai/query`**
```json
// Request
{
  "user_id": "665...",
  "question": "What made me happy last month?"
}

// Response
{
  "answer": "Based on your entries...",
  "sources": ["June 15, 2026", "June 20, 2026"],
  "engine": "MEMORY"  // or "RAG"
}
```

---

## 7. Service Layer — Spring Boot

### `JournalEntryService`

**File:** `service/JournalEntryService.java`

Core orchestrator for journal CRUD. Critical behaviors:

1. **`saveEntry(entry, username)`** — Saves entry to MongoDB, links it to user's `journalEntryIds` list, stamps `userId` on entry. Then triggers:
   - `geminiService.analyzeEntry(entry)` — **async** AI analysis
   - `aiEmbeddingService.embedEntry(entry)` — **async** vector embedding
   - `userProgressCommandService.updateOnNewEntry(user)` — streak recalculation

2. **`getEntriesForUser(username, pageable)`** — Paginated query via `JournalEntryRepository.findByUserIdOrderByDateDesc()`.

3. **`deleteEntry(id, username)`** — Removes entry, updates user's `journalEntryIds` list.

4. **`updateEntry(id, newEntry, username)`** — Replaces title/content, re-triggers AI analysis.

### `UserService`

**File:** `service/UserService.java`

- **User creation:** Hashes password with BCrypt, assigns `["USER"]` role, generates JWT immediately.
- **User deletion:** Cascade deletes all journal entries, progress records, and weekly summaries.
- **`findUsersForWeeklySummary(dayOfWeek)`** — Delegates to `UserRepository.findByPreferencesWeeklySummaryEnabledTrueAndPreferencesWeeklySummaryDay()`.

### `GeminiService`

**File:** `service/GeminiService.java`

- Makes synchronous HTTP POST to `Gemini API` (via Spring's `RestTemplate`).
- **`analyzeJournalEntry(content)`** — Sends structured prompt to Gemini requesting: `mood`, `emotions`, `summary`, `motivationalThought`, `sentimentScore`. Parses JSON response into `JournalAnalysis` DTO.
- **`generateWeeklyReflection(weeklySignal)`** — Sends weekly mood/sentiment signal. Expects `WeeklyAiReflection` response with `reflectionText`, `trend`, `suggestion`.
- **Prompt Design:** Strict JSON-only output requested. Sentiment score constrained to -1.0 to 1.0.
- **Error Handling:** Returns `null` on any failure — caller must handle gracefully.

### `AiEmbeddingService`

**File:** `service/AiEmbeddingService.java`

- **`@Async`** — All methods run in a separate thread pool.
- **`embedEntry(entry)`** — Calls Python AI service at `POST {ai.service.url}/ai/embed/entry`. 
- **Retry Logic:** Uses exponential backoff (1s, 2s, 4s) with 3 max retries to handle Render cold starts.
- **Error Handling:** Logs failures but never throws — embedding is best-effort.

### `WeeklySummaryCommandService`

**File:** `service/WeeklySummaryCommandService.java`

- **`generateWeeklySummary(user)`** — Calculates week boundaries (Mon–Sun), queries journal entries, computes dominant mood, builds `WeeklySummaryBaseData`.
- If `hasEntries == true` and `daysWritten >= 3`: requests AI reflection from Gemini → produces `AI_REFLECTION` type summary.
- If `daysWritten < 3`: produces `BASIC` type (stats-only, no AI call).
- Sends email notification if `emailNotificationsEnabled` is true.

### `UserProgressCommandService`

**File:** `service/UserProgressCommandService.java`

- **`updateOnNewEntry(user)`** — Recalculates streak from scratch by sorting all journal entry dates. Handles timezone edge cases.
- **Streak Logic:** A streak is consecutive calendar days with at least one entry. Writing multiple entries in one day counts as one day.
- **`@Async`** — Streak calculation runs in background.

### `EmailService` / `EmailDeliveryService`

- **`EmailService`** — Constructs email body (HTML template for weekly summaries).
- **`EmailDeliveryService`** — Handles SMTP delivery via Spring Mail. Catches exceptions to prevent email failures from breaking the summary pipeline.

---

## 8. AI Integration — Gemini (Spring Boot)

### Journal Analysis Flow

```
JournalEntryService.saveEntry()
  └── @Async GeminiService.analyzeJournalEntry(content)
        ├── Builds structured prompt
        ├── POST to Gemini API (RestTemplate)
        ├── Parses JSON → JournalAnalysis DTO
        └── Updates JournalEntry with:
              mood, emotions, aiSummary, motivationalThought,
              sentimentScore, analysisCompleted = true
```

### Gemini Request/Response DTOs

**`GeminiRequest`** — Wraps content in the Gemini API's nested `contents[].parts[].text` structure. Factory method: `GeminiRequest.create(prompt)`.

**`GeminiResponse`** — Mirrors Gemini's `candidates[].content.parts[].text` structure. Helper: `getGeneratedText()` extracts the first candidate's first part's text.

### Configuration

| Property | Source | Default |
|---|---|---|
| `gemini.api.key` | `${GEMINI_API_KEY}` | `dummy_key` |
| `gemini.api.url` | `${GEMINI_API_URL}` | `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent` |

---

## 9. Embedding & Vector Search

### Architecture

```
Spring Boot                          Python AI Service              Pinecone
    │                                      │                           │
    │  POST /ai/embed/entry               │                           │
    │  { entry_id, text, user_id, date }  │                           │
    │ ────────────────────────────────────▶│                           │
    │                                      │  embed_query(text)        │
    │                                      │──▶ Gemini Embedding API   │
    │                                      │◀── vector[1024]           │
    │                                      │                           │
    │                                      │  upsert(id, vector, meta) │
    │                                      │──────────────────────────▶│
    │                                      │                           │
    │  { "status": "embedded" }            │                           │
    │ ◀────────────────────────────────────│                           │
```

### Embedding Model

- **Model:** `gemini-embedding-001` (via `langchain_google_genai.GoogleGenerativeAIEmbeddings`)
- **Dimensions:** 1024
- **Task Type:** `retrieval_document`

### Pinecone Storage

- **Index:** `journal-entries`
- **Vector ID:** MongoDB `ObjectId` string of the journal entry
- **Metadata stored:** `{ user_id, date (ISO-8601), text }`
- **Operations:** Upsert (safe for re-embedding)

### Bulk Embedding

`POST /ai/embed/all` reads directly from MongoDB (collection `journal_entries` or `entries`), iterates all entries for a user, and embeds each one sequentially. Handles both `ObjectId` and `string` userId formats.

---

## 10. RAG Pipeline

### Query Flow (`POST /ai/query`)

The query endpoint uses a **two-tier retrieval strategy** via the `RetrievalGateway`:

```
User Question
    │
    ▼
RetrievalGateway
    │
    ├── Attempt 1: Memory Retrieval Engine
    │       │
    │       ├── Stage 1: Question Analysis (Gemini → structured QuestionAnalysis)
    │       ├── Stage 2: Memory Candidate Discovery (MongoDB query)
    │       ├── Stage 3: Memory Ranking (deterministic scoring)
    │       ├── Stage 4: Evidence Retrieval (Fragments → KnowledgeObjects)
    │       ├── Stage 5: Context Assembly (structured context)
    │       └── Stage 6: LLM Reasoning (Gemini → grounded answer)
    │
    │  If Memory Retrieval returns no evidence or "insufficient information":
    │
    └── Fallback: Document RAG (rag_service.py)
            │
            ├── Embed question → vector
            ├── Pinecone query (top-5, filtered by user_id)
            ├── Build context from matched documents
            └── Gemini generative answer with model fallback chain
```

### Document RAG Details (`rag_service.py`)

- **Semantic Search:** Pinecone query with `user_id` filter, top-5 results.
- **Context Building:** Each result formatted as `"Entry from {date}:\n{text}"`.
- **Generation:** Prompt enforces warm/personal tone, no markdown, max 3-4 sentences.
- **Model Fallback Chain:** `gemini-2.5-flash` → `gemini-2.0-flash-lite` → `gemini-2.5-flash-lite`. Falls to next model on 429/quota errors.

### Response Annotation

Every response includes an `"engine"` field:
- `"MEMORY"` — answered from structured memory retrieval
- `"RAG"` — answered from document-level vector search
- `"ERROR"` — both engines failed

---

## 11. Cognitive Pipeline — Capture Engine

### Purpose

Transforms raw journal text into structured `KnowledgeObject` containing entities and observations.

### Pipeline Stages

```
Raw Text (from embed/entry)
    │
    ▼
ExtractionService._call_gemini()
    │  Gemini 2.5-flash (structured output, temp=0.2)
    │  Response schema: LLMExtraction
    │
    ├── summary: str
    ├── overall_confidence: LOW|MEDIUM|HIGH
    ├── entities: [{name, entity_type, confidence}]
    └── observations: [{type, perspective, description, confidence}]
    │
    ▼
ExtractionService._map_to_knowledge_object()
    │  Maps LLM output → canonical domain models
    │  Assigns temporary IDs (ko_{capture_id}, obs_raw_{i})
    │  Entity IDs left empty (resolved later)
    │
    ▼
CapturePipeline.process_capture()
    │
    ├── 1. Validate (non-empty text)
    ├── 2. Extract (ExtractionService)
    ├── 3. Persist unresolved KO (KnowledgeRepository.save())
    ├── 4. Resolve entities (ResolutionService)
    │       ├── Case-insensitive name matching per user
    │       ├── Existing entity? Reuse + add alias
    │       └── New entity? Mint ent_{uuid} + persist
    ├── 5. Persist resolved KO (KnowledgeRepository.update())
    └── 6. Return final KnowledgeObject
```

### Idempotency

- **KnowledgeRepository:** Unique index on `provenance.capture_id` prevents duplicate KOs.
- **EntityRepository:** Unique compound index on `(user_id, name)` prevents duplicate entities.
- **Retry:** ExtractionService retries once on Gemini failure.

---

## 12. Cognitive Pipeline — Memory Engine

### Purpose

Groups `KnowledgeObjects` into evolving `Memory` stories composed of immutable `MemoryFragment` records.

### Pipeline Stages

```
KnowledgeObject (from Capture Pipeline)
    │
    ▼
MemoryFormationEngine.process_knowledge_object()
    │
    ├── 1. Create MemoryFragment from KO
    │       { id, user_id, ko_id, capture_id, content=ko.summary, entity_ids }
    │
    ├── 2. Persist Fragment (MemoryFragmentRepository — unique per KO)
    │
    ├── 3. process_fragment() — the core memory formation logic:
    │       │
    │       ├── Stage 1: Candidate Discovery
    │       │   └── Find ACTIVE memories with shared entities (MongoDB)
    │       │
    │       ├── Stage 2: Candidate Ranking (deterministic)
    │       │   └── Score by: shared_entities×10 + fragment_count + recency
    │       │   └── Top 3 candidates proceed
    │       │
    │       ├── Stage 3: LLM Story Evaluation (Gemini, temp=0.1)
    │       │   └── For each candidate: "Does this fragment continue this story?"
    │       │   └── Returns: {attach, confidence, reasoning, updated_summary}
    │       │
    │       └── Stage 4: Decision & Execution
    │           ├── If confidence >= 0.75 AND attach=true:
    │           │   └── Attach fragment to existing Memory
    │           │       (update summary, timeline, entity_ids)
    │           └── Else:
    │               └── Create NEW Memory (EMERGING status)
    │                   (LLM generates title + summary)
    │
    └── Return list of modified Memories (for dirty marking)
```

### Memory Lifecycle

| Status | Meaning |
|---|---|
| `EMERGING` | Newly created, still solidifying |
| `ACTIVE` | Currently relevant, frequently updated |
| `ARCHIVED` | Historical, no longer active |
| `CONSOLIDATED` | Merged into a higher-order memory |

### Key Constraint

> **⚠ Architectural Gap:** The `CognitiveOrchestrator` calls `self.memory_engine.process_knowledge_object(knowledge_object)`, but the `MemoryFormationEngine` only exposes `process_fragment(fragment)`. The `process_knowledge_object` method is **not implemented** in the current codebase. This call will fail at runtime unless there's a `__getattr__` or dynamic method that handles it. See [Known Gaps](#22-known-gaps--architectural-risks).

---

## 13. Cognitive Pipeline — Insight Engine

### Purpose

Detects patterns across multiple Memories and surfaces validated insights to the user.

### Three-Phase Architecture

```
Phase 1: Candidate Generation (deterministic — no LLM)
    │
    ▼
Phase 2: Validation (LLM guard — Gemini 1.5-flash)
    │
    ▼
Phase 3: Consolidation (lifecycle management)
```

### Phase 1: Candidate Generation (`CandidateGenerationService`)

Processes only `ACTIVE` memories. Uses deterministic heuristics:

| Detection | Criteria | Min Memories | InsightType |
|---|---|---|---|
| Relationships | RELATIONAL memories with same entities | ≥ 3 | `RELATIONSHIP` |
| Goal Progress | GOAL memories with same entities | ≥ 2 | `GOAL_PROGRESS` |
| Trends | PROJECT/SEMANTIC memories spanning >7 days | ≥ 3 | `TREND` |
| Habits | EPISODIC memories clustered within ≤14 days | ≥ 4 | `HABIT` |
| Contradictions | SEMANTIC memories spanning >30 days | ≥ 2 | `CONTRADICTION` |
| Opportunities | Any memories with ≥3 co-occurrences of entity pair | ≥ 3 | `OPPORTUNITY` |

**Scoring Formula:** `score = (mem_count/5)×0.5 + (time_span/30)×0.3 + entity_density×0.2` (normalized to [0,1])

**Deduplication:** Candidates with same type + same entity set are merged (union of memory IDs, highest score wins).

### Phase 2: Validation (`InsightValidationService`)

- **LLM:** `gemini-1.5-flash` (via legacy `google.generativeai` SDK, not the newer `google.genai`)
- **Purpose:** Strictly validate — never invent facts.
- **Decision Thresholds:**

| Condition | Result |
|---|---|
| Contradicting memories found | **Rejected** |
| Confidence < 0.50 | **Rejected**: Weak evidence |
| Confidence ≥ 0.50 and < 0.70 | **Held**: Needs more evidence |
| Confidence ≥ 0.70 | **Approved** |

- **Output:** Refined title, description, supporting/contradicting memory IDs.

### Phase 3: Consolidation (`InsightConsolidationService`)

Manages the full insight lifecycle against existing active insights:

```
Validated Candidate
    │
    ├── If validation rejected → REJECTED (no-op)
    │
    ├── If CONTRADICTION type AND existing insight uses contradicting memories
    │   → SUPERSEDE existing insight + CREATE new
    │
    ├── If no equivalent existing insight found
    │   → CREATE new ACTIVE insight
    │
    ├── If exactly 1 equivalent found (>50% entity overlap + >30% memory overlap)
    │   → UPDATE existing (bump version, append evidence)
    │
    └── If multiple equivalents found
        → MERGE (keep highest confidence as base, SUPERSEDE others)
```

### Insight Lifecycle States

| Status | Meaning |
|---|---|
| `CANDIDATE` | Initial state (unused in current flow) |
| `VALIDATED` | Passed LLM validation (unused — jumps to ACTIVE) |
| `ACTIVE` | Live, surfaced to user |
| `ARCHIVED` | Evidence evaporated |
| `SUPERSEDED` | Replaced by newer/merged insight |

---

## 14. Cognitive Orchestrator

**File:** `orchestration/cognitive_orchestrator.py`

The master orchestrator runs **asynchronously** as a FastAPI `BackgroundTask` triggered by `POST /ai/embed/entry`.

### Full Pipeline Flow

```
POST /ai/embed/entry
    │
    ├── Synchronous: Embed into Pinecone (embedding_service)
    │
    └── Async Background Task: CognitiveOrchestrator.run_pipeline()
        │
        ├── Phase 1: Capture Pipeline
        │   └── ExtractionService → KnowledgeRepository → ResolutionService
        │   └── On failure: log error, return (preserves embedding)
        │
        ├── Phase 2: Memory Formation
        │   └── MemoryFormationEngine.process_knowledge_object()
        │   └── Mark modified memories as dirty (pending_insight_generation=true)
        │   └── On failure: log error, return (preserves capture)
        │
        └── Phase 3: Insight Engine (processes ALL dirty memories for user)
            └── For each dirty memory:
                ├── CandidateGenerationService.generate_candidates()
                ├── InsightValidationService.validate() per candidate
                ├── InsightConsolidationService.consolidate() per approved candidate
                └── Clear dirty flag on successfully processed memories
            └── Failed candidates leave dirty flag → retry on next entry
```

### Failure Isolation

Each phase is isolated. A failure in Phase 2 does not roll back Phase 1. A failure in Phase 3 (per-candidate) leaves dirty flags on affected memories for automatic retry on the next journal entry.

---

## 15. Memory Retrieval Pipeline

**Entry Point:** `RetrievalGateway.answer_question()` (called from `POST /ai/query`)

### Strategy: Memory First, RAG Fallback

```
Question
    │
    ├──▶ MemoryRetrievalEngine.retrieve_answer()
    │       │
    │       ├── Stage 1: QuestionAnalysisService.analyze()
    │       │   └── Gemini 2.5-flash (structured output, temp=0.1)
    │       │   └── Returns: QuestionAnalysis { intent, entities, temporal_constraints, memory_types, keywords }
    │       │   └── Graceful degradation: returns generic analysis if Gemini fails
    │       │
    │       ├── Stage 2: Candidate Discovery (MongoDB)
    │       │   └── Query ACTIVE memories for user
    │       │   └── Filter by memory_type and entity overlap
    │       │   └── Hard limit: 10 candidates
    │       │
    │       ├── Stage 3: MemoryRanker.rank() (deterministic)
    │       │   └── Score: shared_entities×15 + keyword_overlap×5 + type_match×10 + fragment_count×2
    │       │   └── Top 3 proceed
    │       │
    │       ├── Stage 4: Evidence Retrieval
    │       │   └── Memory → MemoryFragments → KnowledgeObjects (full provenance trace)
    │       │
    │       ├── Stage 5: ContextBuilder.build_context()
    │       │   └── RetrievalContext { memory_summaries, recent_timeline, entities, observations, references }
    │       │
    │       └── Stage 6: LLM Reasoning (Gemini 1.5-flash, temp=0.3)
    │           └── Strict grounding prompt — never hallucinate
    │
    ├── If Memory has evidence AND answer is not "insufficient information":
    │   └── Return { answer, sources, engine: "MEMORY" }
    │
    └── Else: Fallback to Document RAG (rag_service.ask_journal())
        └── Return { answer, sources, engine: "RAG" }
```

---

## 16. Background Jobs & Scheduling

### Weekly Summary Cron

**File:** `scheduler/WeeklySummaryCron.java`

- **Schedule:** `0 0 9 * * *` at timezone `Asia/Kolkata` (9 AM IST daily)
- **Logic:** Checks current day of week → finds users whose `preferences.weeklySummaryDay` matches → generates summary for each user.
- **Error Isolation:** Each user's summary generation is wrapped in try-catch. One user's failure doesn't block others.

### Async Operations

| Operation | Annotation | Triggered By |
|---|---|---|
| Journal AI Analysis | `@Async` | `JournalEntryService.saveEntry()` |
| Vector Embedding | `@Async` | `JournalEntryService.saveEntry()` |
| User Progress Update | `@Async` | `JournalEntryService.saveEntry()` |
| Cognitive Pipeline | `BackgroundTasks` (FastAPI) | `POST /ai/embed/entry` |

### Startup Tasks

| Task | Trigger | File |
|---|---|---|
| Journal Entry Migration | `@EventListener(ApplicationReadyEvent.class)` | `JournalEntryMigrationService.java` |

---

## 17. Data Migration & Lifecycle

### Journal Entry Migration (`JournalEntryMigrationService`)

**Purpose:** Backfills the `userId` field on `JournalEntry` documents that predate the field's introduction.

**Behavior:**
1. Counts entries with `userId == null`.
2. If 0, skips immediately (idempotent).
3. Otherwise, iterates all users → for each `journalEntryId` → stamps `userId = user.id` via `MongoTemplate.updateFirst()`.
4. Logs summary: migrated / already done / not found.

**Safety:** Idempotent. Skips already-migrated entries. Safe to run multiple times.

### User Deletion Cascade

When a user is deleted via `DELETE /journal/user`, the following cascade occurs:

1. Delete all `JournalEntry` documents by userId
2. Delete `UserProgress` document by userId
3. Delete all `WeeklySummary` documents by userId
4. Delete the `User` document

**⚠ Gap:** Python-side data (knowledge_objects, entities, memory_fragments, memories, insights) is **NOT** cascade-deleted. See [Known Gaps](#22-known-gaps--architectural-risks).

---

## 18. Configuration & Environment

### Spring Boot (`application.yml`)

| Property | Env Variable | Default |
|---|---|---|
| MongoDB URI | `SPRING_DATA_MONGODB_URI` | Atlas cluster connection string |
| MongoDB Database | `SPRING_DATA_MONGODB_DATABASE` | `journaldb` |
| Server Port | `SERVER_PORT` | `8080` |
| Context Path | `SERVER_SERVLET_CONTEXT_PATH` | `/journal` |
| Gemini API Key | `GEMINI_API_KEY` | `dummy_key` |
| Gemini API URL | `GEMINI_API_URL` | Gemini 2.5-flash endpoint |
| AI Service URL | `AI_SERVICE_URL` | `http://localhost:8001` |
| JWT Secret | `JWT_SECRET` | 256-bit placeholder |
| JWT Expiry | `JWT_EXPIRY_MS` | `86400000` (24h) |
| Mail Host | `SPRING_MAIL_HOST` | `smtp.gmail.com` |
| Mail Port | `SPRING_MAIL_PORT` | `587` |

### Python AI Service (`.env`)

| Variable | Purpose |
|---|---|
| `GOOGLE_API_KEY` / `GEMINI_API_KEY` | Gemini API authentication |
| `MONGO_URI` | MongoDB Atlas connection |
| `MONGO_DB_NAME` | Database name (`journaldb`) |
| `CHROMA_PERSIST_PATH` | Legacy ChromaDB path (not actively used — migrated to Pinecone) |
| `PINECONE_API_KEY` | Pinecone authentication |
| `PINECONE_INDEX` | `journal-entries` |
| `HOST` | `0.0.0.0` |
| `PORT` | `8001` |

---

## 19. Error Handling & Resilience

### Spring Boot — `GlobalExceptionHandler`

| HTTP Status | Exception | Notes |
|---|---|---|
| `400` | `MethodArgumentNotValidException` | Field-level validation errors (e.g., blank username) |
| `401` | `UsernameNotFoundException` | Invalid credentials |
| `409` | `UserAlreadyExistsException` | Duplicate username on registration |
| `500` | `RuntimeException` (catch-all) | "An internal error occurred." Stack trace logged, never exposed. |

### Error Response Format

```json
{
  "timestamp": "2026-07-17T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "userName": "Username is required",
    "password": "Password must be at least 6 characters"
  }
}
```

### Python AI Service

- **Global Exception Handler:** Catches all unhandled exceptions, returns `500` with generic message.
- **Per-Route Error Handling:** Routes catch specific errors (empty input → 400, service error → 500).
- **Cognitive Pipeline:** Each phase is independently try-caught. Failure in one phase logs the error but preserves data from earlier phases.
- **Gemini Quota Handling:** RAG service has a 3-model fallback chain for 429 errors.
- **Memory Retrieval:** Question analysis degrades gracefully to generic analysis on Gemini failure.

### Resilience Patterns

| Pattern | Where | Implementation |
|---|---|---|
| Exponential Backoff | `AiEmbeddingService` | 1s, 2s, 4s retry delays for cold starts |
| Model Fallback Chain | `rag_service._generate_with_fallback()` | 3 Gemini models tried sequentially on quota errors |
| Best-Effort AI | `JournalEntryService` | AI analysis failure doesn't block entry save |
| Dirty Flag Retry | `CognitiveOrchestrator` | Failed insight candidates leave dirty flags for next cycle |
| Idempotent Upsert | `embedding_service` | Pinecone upsert safely overwrites existing vectors |
| Idempotent Migration | `JournalEntryMigrationService` | Skips already-migrated entries |

---

## 20. MongoDB Collections & Indexes

### Spring Boot Collections

| Collection | Managed By | Key Indexes |
|---|---|---|
| `users` | Spring Data | `userName` (unique, implicit) |
| `journal_entries` | Spring Data | `userId + date DESC` (for pagination), `userId` |
| `user_progress` | Spring Data | `userId` (unique 1:1) |
| `weekly_summaries` | Spring Data | `userId + generatedAt DESC` |

### Python AI Service Collections

| Collection | Managed By | Key Indexes |
|---|---|---|
| `knowledge_objects` | `MongoKnowledgeRepository` | `id` (unique), `provenance.capture_id` (unique) |
| `entities` | `MongoEntityRepository` | `id` (unique), `(user_id, name)` (unique compound) |
| `memory_fragments` | `MongoMemoryFragmentRepository` | `id` (unique), `knowledge_object_id` (unique), `capture_id`, `user_id` |
| `memories` | `MongoMemoryRepository` | `id` (unique), `user_id`, `status`, `memory_type` |
| `insights` | `MongoInsightRepository` | `id` (unique), `user_id`, `status`, `type`, `affected_entity_ids`, `supporting_memory_ids`, `importance`, `updated_at`, compound: `(user_id, status)`, `(user_id, type)` |

---

## 21. Inter-Service Communication

### Spring Boot → Python AI Service

| Trigger | Method | Endpoint | Async? |
|---|---|---|---|
| New journal entry | `AiEmbeddingService.embedEntry()` | `POST /ai/embed/entry` | Yes (`@Async`) |
| Manual bulk embed | Not exposed via API | `POST /ai/embed/all` | N/A |
| RAG query | Not directly called from Spring | `POST /ai/query` | N/A |

### RestTemplate Configuration

| Setting | Value |
|---|---|
| Max Total Connections | 50 |
| Max Per Route | 20 |
| Connect Timeout | 10 seconds |
| Read Timeout | 30 seconds |
| Expired Connection Eviction | Enabled |

### Python AI Service → External APIs

| Target | Client | Purpose |
|---|---|---|
| Gemini Embedding API | `langchain_google_genai` | Vector embedding generation |
| Gemini Generative API | `google.genai` (SDK) | RAG answers, extraction, memory evaluation |
| Gemini Generative API | `google.generativeai` (legacy SDK) | Insight validation only |
| Pinecone | `pinecone` client | Vector upsert/query |
| MongoDB Atlas | `pymongo` | Direct reads/writes for AI collections |

**⚠ SDK Inconsistency:** The insight validation service uses the legacy `google.generativeai` SDK (`genai.configure()` + `GenerativeModel`), while all other services use the newer `google.genai` SDK (`genai.Client`). This is a maintenance risk.

---

## 22. Known Gaps & Architectural Risks

### Critical

| # | Gap | Impact | Evidence |
|---|---|---|---|
| 1 | **`process_knowledge_object()` not implemented** | The `CognitiveOrchestrator` calls `self.memory_engine.process_knowledge_object(knowledge_object)` (line 76), but `MemoryFormationEngine` only exposes `process_fragment(fragment)`. This will raise `AttributeError` at runtime, **breaking the entire cognitive pipeline** (Phases 2 and 3 will never execute). | `cognitive_orchestrator.py:76` vs `memory_formation_engine.py` |
| 2 | **No cascade delete for Python-side data** | Deleting a user via Spring Boot does not clean up `knowledge_objects`, `entities`, `memory_fragments`, `memories`, or `insights`. Orphaned data accumulates. | `UserService.deleteUser()` only deletes Spring collections |
| 3 | **Dual ownership model for journal entries** | Entries are tracked in both `User.journalEntryIds` (list) AND `JournalEntry.userId` (field). Migration backfills `userId` but doesn't remove the legacy list. Both must be kept in sync. | `JournalEntryMigrationService.java`, `JournalEntryService.java` |

### Moderate

| # | Gap | Impact | Evidence |
|---|---|---|---|
| 4 | **Two different Gemini SDKs in Python** | `insight_validation_service.py` uses `google.generativeai` (legacy), while everything else uses `google.genai` (new). Different configuration patterns, potential version conflicts. | `insight_validation_service.py:14` vs `extraction_service.py:20` |
| 5 | **No authentication on FastAPI endpoints** | All Python AI endpoints are unprotected. Anyone with the URL can embed entries, query journals, or inspect debug data for any user_id. | `main.py` — no auth middleware |
| 6 | **Hardcoded CORS origins** | Both services have hardcoded allowed origins. Adding a new frontend deployment requires code changes. | `SecurityConfig.java`, `main.py` |
| 7 | **No rate limiting** | Neither service implements rate limiting. Free-tier Gemini quota errors are handled reactively (fallback chain) rather than proactively. | Entire codebase |
| 8 | **`InsightValidationService.validate()` method name mismatch** | `CognitiveOrchestrator` calls `self.insight_val.validate(candidate)` but the actual method is named `validate_candidate(candidate, memories)` and requires a `memories` parameter that the orchestrator doesn't provide. | `cognitive_orchestrator.py:120` vs `insight_validation_service.py:38` |

### Low

| # | Gap | Impact | Evidence |
|---|---|---|---|
| 9 | **ChromaDB references remain** | Config and docs reference ChromaDB (`CHROMA_PERSIST_PATH`), but the system has fully migrated to Pinecone. Dead configuration. | `.env:21` |
| 10 | **No pagination for Python-side queries** | Debug endpoints return all records without limits. Memory/insight retrieval also fetches all active records. Could be problematic at scale. | `debug_routes.py`, `memory_repository.py:find_active()` |
| 11 | **`auto-index-creation: false` in Spring** | Spring Data MongoDB auto-index creation is disabled. Indexes must be managed manually or by the migration service. | `application.yml:10` |
| 12 | **Email credentials not configured by default** | `SPRING_MAIL_USERNAME` and `SPRING_MAIL_PASSWORD` have no defaults — weekly summary emails will fail silently if not set. | `application.yml:14-15` |
| 13 | **No frontend API endpoints for Memories/Insights/Knowledge** | Spring Boot has no controller endpoints to serve the Python-side cognitive data (memories, insights, entities) to the frontend. The frontend would need to call the Python service directly or a new Spring proxy layer would need to be built. | No controller for these domains exists |

---

## Appendix A: File Inventory

### Spring Boot (`backend/src/main/java/com/example/`)

```
├── JournalApplication.java              # Main class (@SpringBootApplication, @EnableAsync, @EnableScheduling)
├── config/
│   ├── RestTemplateConfig.java           # HttpClient5 pooled RestTemplate
│   └── SecurityConfig.java              # Spring Security + CORS + JWT filter chain
├── controller/
│   ├── AdminController.java             # Admin user management
│   ├── DashboardController.java         # Weekly summary dashboard
│   ├── HealthController.java            # /health endpoint
│   ├── JournalEntryController.java      # Journal CRUD
│   ├── PublicController.java            # Registration + Login
│   └── UserController.java             # User profile + preferences + progress
├── dto/
│   ├── AuthResponse.java               # JWT login response
│   ├── CreateUserRequest.java           # Registration request
│   ├── GeminiRequest.java              # Gemini API request wrapper
│   ├── GeminiResponse.java             # Gemini API response parser
│   ├── JournalAnalysis.java            # AI analysis result DTO
│   ├── JournalEntryDTO.java            # Frontend-safe journal entry
│   ├── LoginRequest.java               # Login request
│   ├── UserPreferencesUpdateRequest.java # Preferences update
│   ├── UserProgressDTO.java            # Progress/streak data
│   ├── WeeklyAiReflection.java         # AI weekly reflection
│   ├── WeeklySummaryBaseData.java       # Weekly summary computation data
│   └── WeeklySummaryDashboardDTO.java   # Dashboard summary view
├── entity/
│   ├── Emotion.java                     # Enum: 17 emotions
│   ├── JournalEntry.java               # MongoDB document
│   ├── Mood.java                        # Enum: 10 moods
│   ├── User.java                        # MongoDB document + UserPreferences
│   ├── UserProgress.java               # MongoDB document
│   └── WeeklySummary.java              # MongoDB document
├── exception/
│   ├── GlobalExceptionHandler.java      # @RestControllerAdvice
│   └── UserAlreadyExistsException.java  # 409 Conflict
├── mapper/
│   └── JournalEntryMapper.java         # Entity → DTO conversion
├── migration/
│   └── JournalEntryMigrationService.java # userId backfill on startup
├── repository/
│   ├── JournalEntryRepository.java      # MongoRepository
│   ├── UserProgressRepository.java      # MongoRepository
│   ├── UserRepository.java             # MongoRepository
│   └── WeeklySummaryRepository.java     # MongoRepository
├── scheduler/
│   └── WeeklySummaryCron.java           # Daily 9AM IST cron
├── security/
│   ├── JwtAuthenticationFilter.java     # Bearer token filter
│   └── JwtTokenProvider.java           # JWT generation/validation
└── service/
    ├── AiEmbeddingService.java          # @Async Python AI service client
    ├── DashboardService.java            # Dashboard query orchestrator
    ├── EmailDeliveryService.java        # SMTP delivery
    ├── EmailService.java               # Email body construction
    ├── GeminiService.java              # Gemini API client (RestTemplate)
    ├── JournalEntryService.java        # Core journal CRUD orchestrator
    ├── UserDetailsServiceImpl.java      # Spring Security UserDetailsService
    ├── UserProgressCommandService.java  # Streak calculation (@Async)
    ├── UserProgressReadService.java     # Progress query
    ├── UserService.java                # User CRUD + cascade delete
    ├── WeeklySummaryCommandService.java # Summary generation logic
    ├── WeeklySummaryDashboardQueryService.java # Dashboard summary query
    └── WeeklySummaryQueryService.java   # Summary data aggregation
```

### Python AI Service (`ai-service/`)

```
├── main.py                              # FastAPI app + lifespan + CORS + routers
├── dependencies.py                      # FastAPI Depends() factories
├── .env                                 # Environment configuration
├── routes/
│   ├── journal_routes.py               # /ai/embed/entry, /ai/embed/all, /ai/query
│   └── debug_routes.py                 # /ai/debug/* inspection endpoints
├── services/
│   ├── embedding_service.py            # Gemini embedding + Pinecone upsert
│   └── rag_service.py                  # Document RAG pipeline
├── capture/
│   ├── __init__.py
│   ├── capture_pipeline.py             # Orchestrates Extract → Persist → Resolve
│   ├── idempotency.py                  # IdempotencyManager protocol (interface only)
│   ├── versioning.py                   # Schema/Prompt/Pipeline version constants
│   ├── domain/
│   │   ├── __init__.py
│   │   ├── entity.py                   # Entity domain model
│   │   ├── knowledge_object.py         # KnowledgeObject + Provenance
│   │   └── observation.py              # Observation domain model
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── entity_repository.py        # EntityRepository protocol + MongoEntityRepository
│   │   └── knowledge_repository.py     # KnowledgeRepository protocol + MongoKnowledgeRepository
│   └── services/
│       ├── __init__.py
│       ├── extraction_service.py       # Gemini structured extraction
│       └── resolution_service.py       # Entity resolution (name matching + minting)
├── memory/
│   ├── domain/
│   │   └── memory.py                   # Memory + MemoryFragment domain models
│   ├── repositories/
│   │   ├── exceptions.py               # Repository exception hierarchy
│   │   ├── memory_fragment_repository.py # MemoryFragmentRepository + Mongo impl
│   │   └── memory_repository.py        # MemoryRepository + Mongo impl
│   ├── retrieval/
│   │   ├── __init__.py
│   │   ├── context_builder.py          # Stage 5: Context assembly
│   │   ├── memory_ranker.py            # Stage 3: Deterministic ranking
│   │   ├── memory_retrieval_engine.py  # Full 6-stage retrieval orchestrator
│   │   ├── question_analysis_service.py # Stage 1: Question analysis (Gemini)
│   │   ├── retrieval_gateway.py        # Memory-first + RAG fallback gateway
│   │   └── retrieval_models.py         # Pydantic models for all 6 stages
│   └── services/
│       └── memory_formation_engine.py  # 4-stage memory formation pipeline
├── insight/
│   ├── __init__.py
│   ├── domain/
│   │   ├── __init__.py
│   │   ├── candidate.py                # InsightCandidate domain model
│   │   ├── consolidation.py            # ConsolidationResult domain model
│   │   ├── insight.py                  # Insight domain model (full lifecycle)
│   │   └── validation.py              # InsightValidationResult domain model
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── insight_repository.py       # InsightRepository + Mongo impl
│   └── services/
│       ├── __init__.py
│       ├── candidate_generation_service.py  # Deterministic pattern detection
│       ├── insight_consolidation_service.py # Lifecycle management (CRUD/merge/supersede)
│       └── insight_validation_service.py    # LLM validation guard
├── orchestration/
│   └── cognitive_orchestrator.py       # Master pipeline: Capture → Memory → Insight
└── utils/
    ├── __init__.py
    └── datetime_utils.py               # ISO-8601 parsing/normalization
```
