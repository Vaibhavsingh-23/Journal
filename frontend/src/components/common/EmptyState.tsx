import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center',
        'rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))]/50',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
      </div>
      <h3 className="font-serif text-lg font-medium text-[hsl(var(--foreground))] mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm mb-6">
        {description}
      </p>
      {action}
    </motion.div>
  );
}
