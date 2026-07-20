import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { Sun, Moon, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function TopBar() {
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className={cn(
        'h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-sm',
        'flex items-center justify-between px-6 sticky top-0 z-30'
      )}
    >
      {/* Left — Page context / breadcrumb area */}
      <div />

      {/* Right — Actions */}
      <div className="flex items-center gap-3">
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
