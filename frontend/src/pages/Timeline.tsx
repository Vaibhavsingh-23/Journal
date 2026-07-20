import { PageHeader } from '@/components/common/PageHeader';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { BookOpen, Brain, Lightbulb, Trophy, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TimelineEventType } from '@/types/models';
import { useQuery } from '@tanstack/react-query';
import { fetchTimeline } from '@/lib/api';

const typeIcons: Record<TimelineEventType, typeof BookOpen> = {
  JOURNAL: BookOpen,
  MEMORY: Brain,
  INSIGHT: Lightbulb,
  MILESTONE: Trophy,
};

const typeColors: Record<TimelineEventType, string> = {
  JOURNAL: 'text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10',
  MEMORY: 'text-emerald-400 bg-emerald-400/10',
  INSIGHT: 'text-purple-400 bg-purple-400/10',
  MILESTONE: 'text-amber-400 bg-amber-400/10',
};

const filterOptions: { label: string; value: TimelineEventType | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Journal', value: 'JOURNAL' },
  { label: 'Memory', value: 'MEMORY' },
  { label: 'Insight', value: 'INSIGHT' },
  { label: 'Milestone', value: 'MILESTONE' },
];

export default function Timeline() {
  const [filter, setFilter] = useState<TimelineEventType | 'ALL'>('ALL');

  const { data: allEvents = [], isLoading } = useQuery({
    queryKey: ['timeline'],
    queryFn: fetchTimeline,
  });

  const events = useMemo(() => {
    return filter === 'ALL'
      ? allEvents
      : allEvents.filter((e) => e.type === filter);
  }, [allEvents, filter]);

  // Group by date
  const grouped = useMemo(() => {
    return events.reduce<Record<string, typeof events>>((acc, event) => {
      if (!event.date) return acc;
      try {
        const dateKey = format(parseISO(event.date), 'MMMM d, yyyy');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
      } catch (e) {
        // Fallback for invalid dates
      }
      return acc;
    }, {});
  }, [events]);

  return (
    <div>
      <PageHeader
        title="Timeline"
        description="A chronological view of your journey."
      />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-8">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === opt.value
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[hsl(var(--border))]" />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--muted-foreground))]" />
          </div>
        ) : events.length === 0 ? (
          <div className="pl-12 py-8">
            <p className="text-[hsl(var(--muted-foreground))]">No timeline events found.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateLabel, dateEvents]) => (
            <div key={dateLabel} className="mb-8">
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-[39px] flex justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--primary))] ring-4 ring-[hsl(var(--background))]" />
                </div>
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))]">{dateLabel}</h3>
              </div>

              <div className="space-y-3 pl-[51px]">
                {dateEvents.map((event, i) => {
                  const Icon = typeIcons[event.type];
                  const colorClass = typeColors[event.type];

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:border-[hsl(var(--primary))]/20 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', colorClass)}>
                              {event.type}
                            </span>
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                              {format(parseISO(event.date), 'h:mm a')}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm text-[hsl(var(--foreground))] mt-1">
                            {event.title}
                          </h4>
                          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
