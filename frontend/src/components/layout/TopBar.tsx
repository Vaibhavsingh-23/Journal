import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useJournalModalStore } from '@/stores/journalModalStore';
import { useSearchModalStore } from '@/stores/searchModalStore';
import { Sun, Moon, LogOut, User, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/journal': 'Journal Entries',
  '/memory': 'Memory Engine',
  '/insights': 'AI Insights',
  '/timeline': 'Personal Timeline',
  '/search': 'Search Second Brain',
  '/settings': 'Settings',
};

export function TopBar() {
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const openWriteModal = useJournalModalStore((s) => s.openModal);
  const openSearchModal = useSearchModalStore((s) => s.openModal);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentTitle = PAGE_TITLES[location.pathname] || 'Second Brain';

  return (
    <header
      className={cn(
        'h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-sm',
        'flex items-center justify-between px-6 sticky top-0 z-30'
      )}
    >
      {/* Left — Page title & Search trigger */}
      <div className="flex items-center gap-6">
        <h1 className="font-serif text-lg font-semibold text-[hsl(var(--foreground))]">
          {currentTitle}
        </h1>

        {/* Global Search trigger bar */}
        <button
          onClick={openSearchModal}
          className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))]/40 transition-colors shadow-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Ask your Second Brain...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-[hsl(var(--accent))] rounded font-mono text-[hsl(var(--muted-foreground))]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-3">
        {/* Flagship "+ Write Entry" Primary Action Button */}
        <button
          onClick={openWriteModal}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-95 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Write Entry</span>
          <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-black/20 text-white rounded font-mono">
            ⌘N
          </kbd>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'p-2 rounded-lg transition-colors',
            'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
            'hover:bg-[hsl(var(--accent))]'
          )}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User area */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
                <User className="w-4 h-4 text-[hsl(var(--primary-foreground))]" />
              </div>
              <span className="text-sm font-medium text-[hsl(var(--foreground))] hidden sm:inline">
                {user.userName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className={cn(
                'p-2 rounded-lg transition-colors',
                'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]',
                'hover:bg-[hsl(var(--accent))]'
              )}
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
