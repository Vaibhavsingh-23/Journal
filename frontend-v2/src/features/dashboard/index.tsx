import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../context/AuthContext"
import { dashboardApi } from "../../services/api/dashboard"
import { journalApi } from "../../services/api/journal"
import { memoryApi } from "../../services/api/memory"
import { insightApi } from "../../services/api/insight"
import { timelineApi } from "../../services/api/timeline"
import { SectionHeader } from "../../components/common/SectionHeader"
import { HeroCard } from "../../components/common/HeroCard"
import { JournalCard } from "../../components/common/JournalCard"
import { QuoteCard } from "../../components/common/QuoteCard"
import { MemoryCard } from "../../components/common/MemoryCard"
import { InsightCard } from "../../components/common/InsightCard"
import { StatisticCard } from "../../components/common/StatisticCard"
import { TimelinePreview } from "../../components/common/TimelinePreview"
import { Body } from "../../components/ui/Typography"
import { Link } from "react-router-dom"

export function Dashboard() {
  const { user } = useAuth()

  // Queries
  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ["dashboard", "progress"],
    queryFn: dashboardApi.getProgress,
  })

  const { data: weeklySummary, isLoading: loadingSummary } = useQuery({
    queryKey: ["dashboard", "weeklySummary"],
    queryFn: dashboardApi.getWeeklySummary,
  })

  const { data: journals, isLoading: loadingJournals } = useQuery({
    queryKey: ["journals", { page: 0, size: 1 }],
    queryFn: () => journalApi.getEntries(0, 1),
  })

  const { data: memories, isLoading: loadingMemories } = useQuery({
    queryKey: ["memories", user?.id],
    queryFn: () => memoryApi.getMemories(user!.id),
    enabled: !!user?.id
  })

  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ["insights", user?.id],
    queryFn: () => insightApi.getInsights(user!.id),
    enabled: !!user?.id
  })

  const { data: timelineEvents, isLoading: loadingTimeline } = useQuery({
    queryKey: ["timeline", user?.id],
    queryFn: () => timelineApi.getTimelineEvents(user!.id),
    enabled: !!user?.id
  })

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const isLoading = loadingProgress || loadingSummary || loadingJournals || loadingMemories || loadingInsights || loadingTimeline
  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Body className="text-secondary-foreground italic text-lg">Gathering your thoughts...</Body>
      </div>
    )
  }

  const lastJournal = journals?.content?.[0]
  const recentMemories = memories?.slice(0, 3) || []
  const recentInsights = insights?.slice(0, 3) || []
  const recentTimeline = timelineEvents?.slice(0, 3).map(t => ({
    id: t.id,
    type: t.type.toLowerCase() as "journal" | "memory" | "insight",
    title: t.title,
    timestamp: t.date,
    preview: t.summary
  })) || []

  return (
    <div className="flex flex-col space-y-16 pb-24 animate-fade-in">
      <section>
        <HeroCard 
          name={user?.username || "Writer"}
          date={currentDate}
          prompt="What is on your mind today?"
          imageUrl="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {lastJournal ? (
          <JournalCard 
            title={lastJournal.title}
            previewText={lastJournal.summary || lastJournal.content.substring(0, 150) + "..."}
            updatedAt={new Date(lastJournal.createdAt || lastJournal.date).toLocaleDateString()}
          />
        ) : (
          <div className="p-8 border border-border rounded-2xl flex flex-col items-center justify-center text-center">
            <Body className="text-secondary-foreground mb-4">You haven't written any journals yet.</Body>
            <Link to="/journal" className="px-6 py-2 bg-foreground text-background rounded-full font-medium">Start Writing</Link>
          </div>
        )}

        {weeklySummary ? (
          <QuoteCard quote={weeklySummary.summaryText} />
        ) : (
          <QuoteCard quote="Your weekly summary will appear here once you write a few entries." />
        )}
      </section>

      {recentMemories.length > 0 && (
        <section>
          <SectionHeader>Recent Memories</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentMemories.map((memory, index) => (
              <MemoryCard 
                key={memory.id}
                title={memory.title}
                date={memory.date_range.start + " - " + memory.date_range.end}
                sentence={memory.summary}
                thumbnailUrl={"https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop"} // Default placeholder since memory API doesn't have images yet
                index={index}
              />
            ))}
          </div>
        </section>
      )}

      {recentInsights.length > 0 && (
        <section>
          <SectionHeader>Insights</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentInsights.map((insight, index) => (
              <InsightCard 
                key={insight.id}
                text={insight.title + ": " + insight.description}
                index={index}
              />
            ))}
          </div>
        </section>
      )}

      {progress && (
        <section>
          <SectionHeader>Writing Statistics</SectionHeader>
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            <StatisticCard label="Current Streak" value={progress.currentStreak} index={0} />
            <StatisticCard label="Total Journals" value={progress.totalEntries} index={1} />
            <StatisticCard label="This Week" value={progress.weeklyEntryCount} index={2} />
          </div>
        </section>
      )}

      {recentTimeline.length > 0 && (
        <section>
          <SectionHeader>Timeline Preview</SectionHeader>
          <div className="max-w-2xl">
            <TimelinePreview events={recentTimeline} />
          </div>
        </section>
      )}
    </div>
  )
}