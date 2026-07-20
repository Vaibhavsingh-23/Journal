import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, subtitle, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5',
        'hover:border-[hsl(var(--primary))]/20 transition-colors duration-300',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[hsl(var(--primary))]" />
        </div>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-[hsl(var(--foreground))] tracking-tight">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
}
