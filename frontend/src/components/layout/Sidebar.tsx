import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Lightbulb,
  Clock,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/memory', icon: Brain, label: 'Memory' },
  { to: '/insights', icon: Lightbulb, label: 'Insights' },
  { to: '/timeline', icon: Clock, label: 'Timeline' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col',
        'bg-[hsl(var(--sidebar))] border-r border-[hsl(var(--sidebar-border))]'
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center h-16 px-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--sidebar-primary))] flex items-center justify-center flex-shrink-0">
            <Brain className="w-4 h-4 text-[hsl(var(--sidebar-primary-foreground))]" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-serif text-lg font-semibold text-[hsl(var(--sidebar-foreground))] whitespace-nowrap"
            >
              Second Brain
            </motion.span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]',
                isActive && 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  isActive
                    ? 'text-[hsl(var(--sidebar-primary))]'
                    : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--sidebar-foreground))]'
                )}
              />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    'text-sm font-medium whitespace-nowrap',
                    isActive ? 'text-[hsl(var(--sidebar-primary))]' : ''
                  )}
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 w-0.5 h-6 rounded-r-full bg-[hsl(var(--sidebar-primary))]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center justify-center w-full py-2 rounded-lg transition-colors',
            'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--sidebar-foreground))]',
            'hover:bg-[hsl(var(--sidebar-accent))]'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
