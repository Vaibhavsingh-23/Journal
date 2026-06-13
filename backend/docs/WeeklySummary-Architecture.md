# 📓 Weekly Summary Feature — Backend Architecture Doc

> A complete explanation of how the Weekly Summary feature works in the Journal backend,
> covering services, entities, DTOs, and how they all talk to each other.

---

## 📁 File: `WeeklySummaryCommandService.java`

This is the **core orchestrator** for the Weekly Summary feature. It decides what kind of summary to generate and coordinates all other services.

### Full Line-by-Line Breakdown

#### Package & Imports
```java
package com.example.service;
```
Declares this class belongs to the `service` layer.

```java
import com.example.dto.WeeklyAiReflection;       // carries AI response (text, trend, suggestion)
import com.example.dto.WeeklySummaryBaseData;     // carries raw weekly data (entries, mood, days)
import com.example.entity.*;                       // all entity classes
import com.example.repository.WeeklySummaryRepository; // MongoDB repository
```

#### Class-Level Injections (`@Autowired`)

| Field | Purpose |
|---|---|
| `WeeklySummaryQueryService` | Reads last 7 days of journal data (CQRS read-side) |
| `WeeklySummaryRepository` | Saves the final `WeeklySummary` to MongoDB |
| `GeminiService` | Calls Google Gemini AI to generate reflection |
| `UserService` | Updates `lastWeeklySummaryDate` on the User |
| `EmailDeliveryService` | Sends email if user is eligible |

---

#### Main Method: `generateWeeklySummary(User user)`

##### Step 1 — Idempotency Check
```java
if (user.getLastWeeklySummaryDate() != null &&
        user.getLastWeeklySummaryDate().isEqual(LocalDate.now())) {
    return;
}
```
If a summary was already generated **today** → skip. Prevents duplicate summaries if cron fires twice.

##### Step 2 — Fetch Read-Side Data
```java
WeeklySummaryBaseData base =
        weeklySummaryQueryService.fetchWeeklyBaseData(user.getObjectId());
```
Calls the Query Service to get: journal entries, days written, and dominant mood for the past 7 days.

##### Step 3 — Build Base `WeeklySummary` Object
```java
summary.setUserId(user.getObjectId());
summary.setWeekStartDate(LocalDate.now().minusDays(7));
summary.setWeekEndDate(LocalDate.now());
summary.setGeneratedAt(LocalDateTime.now());
summary.setDeliveryStatus(WeeklySummaryDeliveryStatus.DASHBOARD_ONLY);
```
Creates a new `WeeklySummary` entity with metadata (dates, user ID, delivery status).

##### Case A — No Entries This Week
```java
if (!base.isHasEntries()) {
    summary.setType(WeeklySummaryType.MOTIVATION);
    summary.setSummaryText("You didn't write anything last week...");
    ...
    weeklySummaryRepository.save(summary);
    userService.saveUser(user);
    emailDeliveryService.deliverIfEligible(user, summary);
    return;
}
```
If the user wrote **zero entries** → save a motivational message and return early.

##### Case B — AI Reflection (Happy Path)
```java
String weeklySignal = buildWeeklySignal(base.getJournalEntries());
WeeklyAiReflection aiReflection = geminiService.generateWeeklyReflection(weeklySignal);
summary.setType(WeeklySummaryType.AI_REFLECTION);
summary.setSummaryText(aiReflection.getReflectionText());
summary.setTrend(aiReflection.getTrend());
summary.setSuggestion(aiReflection.getSuggestion());
```
Builds a text signal from all entries → sends to Gemini AI → populates summary with AI response.

##### Case C — Deterministic Fallback (if AI fails)
```java
summary.setType(WeeklySummaryType.SUMMARY);
summary.setSummaryText(
    String.format("You wrote on %d days this week. Your overall mood was mostly %s.",
        base.getDaysWritten(), base.getDominantMood())
);
```
If Gemini throws any exception → silently use a simple hardcoded message. Feature **never breaks**.

---

#### Helper Method: `buildWeeklySignal(List<JournalEntry> entries)`

Builds a plain-text prompt for Gemini:
```
User wrote 3 entries last week.
- 2025-02-13: Mood=happy, Sentiment=0.85, Summary="Had a great day at work"
- 2025-02-14: Mood=anxious, Sentiment=0.3, Summary="Worried about exam"
```

---

## 👤 `User.java` — The Entity

```java
@Document(collection = "users")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
    @Id private ObjectId _id;
    private String userName;
    private String password;
    private String email;
    private List<String> roles;
    private List<JournalEntry> journalEntries;
    private UserPreferences preferences;
    private LocalDate lastWeeklySummaryDate;  // used for idempotency check
}
```

### Where does `getLastWeeklySummaryDate()` come from?
- The **field** `lastWeeklySummaryDate` is declared in `User.java`.
- The **getter/setter** is **auto-generated** by Lombok's `@Data` annotation — you didn't write it manually.
- `user` itself is passed as a **method parameter** from the Cron job.

---

## ⏰ `WeeklySummaryCron.java` — The Trigger

```java
@Scheduled(cron = "0 0 9 * * *")  // every day at 9AM
public void generateWeeklySummaries() {
    int today = DayOfWeek.from(LocalDate.now()).getValue();
    List<User> eligibleUsers = userService.findUsersForWeeklySummary(today);

    for (User user : eligibleUsers) {
        weeklySummaryCommandService.generateWeeklySummary(user);
    }
}
```
Fires at **9AM daily**, fetches all eligible users, and calls `generateWeeklySummary()` for each.

---

## 🗺️ Full Architecture Flow

```
⏰ WeeklySummaryCron  (fires every 9AM)
         │
         ▼
  UserService.findUsersForWeeklySummary()
         │  returns List<User>
         ▼
  for each user:
         │
         ▼
  WeeklySummaryCommandService.generateWeeklySummary(user)
         │
         ├── [idempotency check] → skip if already done today
         │
         ├── asks ──▶ WeeklySummaryQueryService.fetchWeeklyBaseData()
         │               └── queries MongoDB → returns WeeklySummaryBaseData (DTO)
         │
         ├── if no entries → Case A (MOTIVATION message)
         │
         ├── if entries exist:
         │       ├── asks ──▶ GeminiService.generateWeeklyReflection()
         │       │               └── calls Gemini AI → returns WeeklyAiReflection (DTO)
         │       │                   └── Case B: AI_REFLECTION
         │       └── if Gemini fails → Case C: SUMMARY (deterministic fallback)
         │
         ├── saves ──▶ WeeklySummaryRepository → MongoDB
         ├── updates ──▶ UserService.saveUser(user) → lastWeeklySummaryDate = today
         └── sends ──▶ EmailDeliveryService.deliverIfEligible(user, summary)
```

---

## 📦 Entity vs DTO — What's the Difference?

| Concept | Entity | DTO |
|---|---|---|
| Stored in MongoDB? | ✅ Yes | ❌ No |
| Annotation | `@Document` | `@Data` only |
| Lifespan | Permanent | Temporary (one operation) |
| Examples | `User`, `WeeklySummary`, `JournalEntry` | `WeeklySummaryBaseData`, `WeeklyAiReflection` |

> **Simple rule:** Entity → goes to database. DTO → carries data between services.

---

## ⚙️ Command vs Query Service (CQRS Pattern)

| Command Service | Query Service |
|---|---|
| **Writes** (saves, updates) | **Reads** (fetches, queries) |
| `WeeklySummaryCommandService` | `WeeklySummaryQueryService` |
| `UserProgressCommandService` | `UserProgressReadService` |

> **Simple rule:** Command = changes something. Query = just looks.

---

## 📋 One-Line Summary of Each File

| File | One Line |
|---|---|
| `WeeklySummaryCron` | ⏰ Fires every 9AM, loops through all eligible users |
| `WeeklySummaryCommandService` | 🏗️ Orchestrates and saves the weekly summary |
| `WeeklySummaryQueryService` | 🔍 Fetches last 7 days of journal entries from MongoDB |
| `WeeklySummaryBaseData` (DTO) | 📦 Carries raw data: entries, mood, daysWritten |
| `WeeklyAiReflection` (DTO) | 📦 Carries AI response: text, trend, suggestion |
| `WeeklySummary` (Entity) | 💾 Final document saved to MongoDB |
| `GeminiService` | 🤖 Calls Google Gemini AI API |
| `EmailDeliveryService` | 📧 Sends email if user has email enabled |
| `UserService` | 👤 Updates user's lastWeeklySummaryDate |
| `User` (Entity) | 👤 MongoDB user document with all user fields |

---

## 🔑 Rule: When Does One Service Talk to Another?

Services talk to each other **only when they need something they don't own:**

```
WeeklySummaryCommandService needs...
   ├── READ data?        → calls WeeklySummaryQueryService
   ├── AI text?          → calls GeminiService
   ├── Save user date?   → calls UserService
   └── Send email?       → calls EmailDeliveryService
```

Each service owns **one responsibility**. If it needs something outside → it calls the service that owns it.
