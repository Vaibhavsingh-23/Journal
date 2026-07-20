import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { Insight, InsightType } from '@/types/models';
import { TrendingUp, Repeat, Heart, Target, GitBranch, Lightbulb, AlertTriangle, Sparkles } from 'lucide-react';

const typeConfig: Record<InsightType, { icon: typeof TrendingUp; color: string; label: string }> = {
  TREND: { icon: TrendingUp, color: 'text-blue-400 bg-blue-400/10', label: 'Trend' },
  HABIT: { icon: Repeat, color: 'text-emerald-400 bg-emerald-400/10', label: 'Habit' },
  BEHAVIOUR: { icon: Sparkles, color: 'text-purple-400 bg-purple-400/10', label: 'Behaviour' },
  EMOTIONAL: { icon: Heart, color: 'text-rose-400 bg-rose-400/10', label: 'Emotional' },
  RELATIONSHIP: { icon: GitBranch, color: 'text-amber-400 bg-amber-400/10', label: 'Relationship' },
  GOAL_PROGRESS: { icon: Target, color: 'text-green-400 bg-green-400/10', label: 'Goal Progress' },
  CONTRADICTION: { icon: AlertTriangle, color: 'text-orange-400 bg-orange-400/10', label: 'Contradiction' },
  OPPORTUNITY: { icon: Lightbulb, color: 'text-yellow-400 bg-yellow-400/10', label: 'Opportunity' },
};

interface InsightCardProps {
  insight: Insight;
  className?: string;
}

export function InsightCard({ insight, className }: InsightCardProps) {
  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5',
        'hover:border-[hsl(var(--primary))]/20 transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', config.color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs font-medium rounded-full px-2 py-0.5', config.color)}>
              {config.label}
            </span>
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              insight.confidence === 'HIGH' ? 'text-emerald-400 bg-emerald-400/10' :
              insight.confidence === 'MEDIUM' ? 'text-amber-400 bg-amber-400/10' :
              'text-zinc-400 bg-zinc-400/10'
            )}>
              {insight.confidence}
            </span>
          </div>
          <h3 className="font-serif text-base font-medium text-[hsl(var(--foreground))] line-clamp-1">
            {insight.title}
          </h3>
        </div>
      </div>

      <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-3">
        {insight.description}
      </p>
    </motion.div>
  );
}
