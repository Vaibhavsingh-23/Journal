import { PageHeader } from '@/components/common/PageHeader';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import { Moon, Sun, Bell, Mail, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Moon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[hsl(var(--accent))] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[hsl(var(--foreground))]">{title}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'w-11 h-6 rounded-full transition-colors relative',
        checked ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]'
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title="Settings"
        description="Manage your preferences and account."
      />

      {/* Account */}
      <motion.div variants={item} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 mb-6">
        <h2 className="font-serif text-base font-medium text-[hsl(var(--foreground))] mb-4">
          Account
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
              <User className="w-6 h-6 text-[hsl(var(--primary-foreground))]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">{user?.userName || 'User'}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={item} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 mb-6">
        <h2 className="font-serif text-base font-medium text-[hsl(var(--foreground))] mb-2">
          Appearance
        </h2>
        <SettingRow
          icon={theme === 'dark' ? Moon : Sun}
          title="Dark Mode"
          description="Switch between dark and light themes"
        >
          <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
        </SettingRow>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={item} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 mb-6">
        <h2 className="font-serif text-base font-medium text-[hsl(var(--foreground))] mb-2">
          Notifications
        </h2>
        <div className="divide-y divide-[hsl(var(--border))]">
          <SettingRow
            icon={Bell}
            title="Weekly Summary"
            description="Receive a weekly reflection on your journal entries"
          >
            <Toggle checked={true} onChange={() => {}} />
          </SettingRow>
          <SettingRow
            icon={Mail}
            title="Email Notifications"
            description="Get summaries delivered to your inbox"
          >
            <Toggle checked={false} onChange={() => {}} />
          </SettingRow>
          <SettingRow
            icon={Calendar}
            title="Summary Day"
            description="Which day to generate your weekly summary"
          >
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Monday</span>
          </SettingRow>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={item} className="rounded-xl border border-red-500/20 bg-[hsl(var(--card))] p-6">
        <h2 className="font-serif text-base font-medium text-red-400 mb-2">
          Danger Zone
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
          Once you delete your account, there is no going back. All your journal entries, memories, and insights will be permanently removed.
        </p>
        <button className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
          Delete Account
        </button>
      </motion.div>
    </motion.div>
  );
}
