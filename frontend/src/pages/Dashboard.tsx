import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { JournalCard } from '@/components/common/JournalCard';
import { InsightCard } from '@/components/common/InsightCard';
import { Flame, BookOpen, Brain, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { fetchUserProgress, fetchWeeklySummary, fetchJournalEntries, fetchInsights } from '@/lib/api';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['progress'],
    queryFn: fetchUserProgress,
  });

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['summary'],
    queryFn: fetchWeeklySummary,
  });

  const { data: entries, isLoading: isLoadingEntries } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: fetchJournalEntries,
  });

  const { data: insights, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['insights'],
    queryFn: fetchInsights,
  });

  const recentEntries = entries?.slice(0, 4) || [];
  const recentInsights = insights?.slice(0, 3) || [];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Greeting */}
      <motion.div variants={item} className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-[hsl(var(--foreground))] tracking-tight">
          {greeting()}, {user?.userName || 'there'}
        </h1>
        <p className="mt-1.5 text-[hsl(var(--muted-foreground))] text-sm">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={Flame} 
          label="Current Streak" 
          value={isLoadingProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : `${progress?.currentStreak || 0} days`} 
          subtitle={`Best: ${progress?.longestStreak || 0} days`} 
        />
        <StatCard 
          icon={BookOpen} 
          label="Total Entries" 
          value={isLoadingProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : progress?.totalEntries || 0} 
          subtitle={`${progress?.weeklyEntryCount || 0} this week`} 
        />
        <StatCard 
          icon={Brain} 
          label="Active Memories" 
          value={6} // Keep mocked as count isn't in progress API
          subtitle="2 emerging" 
        />
        <StatCard 
          icon={Lightbulb} 
          label="Insights Found" 
          value={isLoadingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : insights?.length || 0} 
          subtitle="3 high confidence" 
        />
      </motion.div>

      {/* Weekly Summary */}
      {isLoadingSummary ? (
        <div className="h-40 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] animate-pulse mb-8" />
      ) : summary ? (
        <motion.div
          variants={item}
          className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-lg font-medium text-[hsl(var(--foreground))]">
                Weekly Reflection
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                {summary.weekStartDate} — {summary.weekEndDate} · {summary.daysWritten} days written
              </p>
            </div>
            {summary.trend && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400">
                {summary.trend}
              </span>
            )}
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed mb-4 journal-text">
            {summary.reflectionText || summary.summaryText}
          </p>
          {summary.suggestion && (
            <div className="p-3 rounded-lg bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/10">
              <p className="text-sm text-[hsl(var(--foreground))]">
                <span className="font-medium text-[hsl(var(--primary))]">Suggestion: </span>
                {summary.suggestion}
              </p>
            </div>
          )}
        </motion.div>
      ) : null}

      {/* Recent Entries */}
      <motion.div variants={item} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-medium text-[hsl(var(--foreground))]">
            Recent Entries
          </h2>
          <button
            onClick={() => navigate('/journal')}
            className="flex items-center gap-1 text-sm text-[hsl(var(--primary))] hover:underline"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {isLoadingEntries ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-[hsl(var(--card))] animate-pulse rounded-xl" />
            <div className="h-32 bg-[hsl(var(--card))] animate-pulse rounded-xl" />
          </div>
        ) : recentEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentEntries.map((entry) => (
              <JournalCard key={entry.id} entry={entry} onClick={() => navigate('/journal')} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No entries yet.</p>
        )}
      </motion.div>

      {/* Recent Insights */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-medium text-[hsl(var(--foreground))]">
            Latest Insights
          </h2>
          <button
            onClick={() => navigate('/insights')}
            className="flex items-center gap-1 text-sm text-[hsl(var(--primary))] hover:underline"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {isLoadingInsights ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-[hsl(var(--card))] animate-pulse rounded-xl" />
            <div className="h-32 bg-[hsl(var(--card))] animate-pulse rounded-xl" />
            <div className="h-32 bg-[hsl(var(--card))] animate-pulse rounded-xl" />
          </div>
        ) : recentInsights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No insights discovered yet.</p>
        )}
      </motion.div>
    </motion.div>
  );
}
