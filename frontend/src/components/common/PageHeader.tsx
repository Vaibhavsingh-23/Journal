import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex items-start justify-between mb-8', className)}
    >
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[hsl(var(--foreground))] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-[hsl(var(--muted-foreground))] text-sm max-w-lg">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </motion.div>
  );
}
