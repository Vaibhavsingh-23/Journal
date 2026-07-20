import { cn } from '@/lib/utils';
import type { Mood } from '@/types/models';

const moodConfig: Record<Mood, { label: string; className: string }> = {
  HAPPY: { label: 'Happy', className: 'bg-mood-happy/15 text-mood-happy' },
  SAD: { label: 'Sad', className: 'bg-mood-sad/15 text-mood-sad' },
  CALM: { label: 'Calm', className: 'bg-mood-calm/15 text-mood-calm' },
  ANXIOUS: { label: 'Anxious', className: 'bg-mood-anxious/15 text-mood-anxious' },
  MOTIVATED: { label: 'Motivated', className: 'bg-mood-motivated/15 text-mood-motivated' },
  EXCITED: { label: 'Excited', className: 'bg-mood-excited/15 text-mood-excited' },
  GRATEFUL: { label: 'Grateful', className: 'bg-mood-grateful/15 text-mood-grateful' },
  ANGRY: { label: 'Angry', className: 'bg-mood-angry/15 text-mood-angry' },
  CONFUSED: { label: 'Confused', className: 'bg-mood-confused/15 text-mood-confused' },
  NEUTRAL: { label: 'Neutral', className: 'bg-mood-neutral/15 text-mood-neutral' },
};

interface MoodBadgeProps {
  mood: Mood;
  size?: 'sm' | 'md';
}

export function MoodBadge({ mood, size = 'sm' }: MoodBadgeProps) {
  const config = moodConfig[mood];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
