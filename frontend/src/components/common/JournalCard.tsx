import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { MoodBadge } from './MoodBadge';
import type { JournalEntry } from '@/types/models';

interface JournalCardProps {
  entry: JournalEntry;
  onClick?: () => void;
  className?: string;
}

export function JournalCard({ entry, onClick, className }: JournalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5',
        'hover:border-[hsl(var(--primary))]/20 transition-all duration-300 cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-serif text-base font-medium text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors line-clamp-1">
          {entry.title}
        </h3>
        {entry.mood && <MoodBadge mood={entry.mood} />}
      </div>

      {entry.aiSummary && (
        <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-2 mb-3">
          {entry.aiSummary}
        </p>
      )}

      <div className="flex items-center justify-between">
        <time className="text-xs text-[hsl(var(--muted-foreground))]">
          {format(parseISO(entry.date), 'MMM d, yyyy')}
        </time>
        {entry.sentimentScore !== null && (
          <div className="flex items-center gap-1.5">
            <div className="w-12 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
              <div
                className="h-full rounded-full bg-[hsl(var(--primary))] transition-all"
                style={{ width: `${Math.max(0, (entry.sentimentScore + 1) * 50)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
