import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { JournalCard } from '@/components/common/JournalCard';
import { InsightCard } from '@/components/common/InsightCard';
import { mockJournalEntries, mockInsights, mockUserProgress, mockWeeklySummary } from '@/data/mock';
import { Flame, BookOpen, Brain, Lightbulb, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';

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
  const progress = mockUserProgress;
  const summary = mockWeeklySummary;
  const recentEntries = mockJournalEntries.slice(0, 4);
  const recentInsights = mockInsights.slice(0, 3);

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
        <StatCard icon={Flame} label="Current Streak" value={`${progress.currentStreak} days`} subtitle={`Best: ${progress.longestStreak} days`} />
        <StatCard icon={BookOpen} label="Total Entries" value={progress.totalEntries} subtitle={`${progress.weeklyEntryCount} this week`} />
        <StatCard icon={Brain} label="Active Memories" value={6} subtitle="2 emerging" />
        <StatCard icon={Lightbulb} label="Insights Found" value={mockInsights.length} subtitle="3 high confidence" />
      </motion.div>

      {/* Weekly Summary */}
      {summary && (
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
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentEntries.map((entry) => (
            <JournalCard key={entry.id} entry={entry} onClick={() => navigate('/journal')} />
          ))}
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
