import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Bell, Mail, Calendar, User, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserProfile, updateUserPreferences, deleteAccount } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

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

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'w-11 h-6 rounded-full transition-colors relative disabled:opacity-50',
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
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [weeklySummary, setWeeklySummary] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [summaryDay, setSummaryDay] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchUserProfile,
  });

  useEffect(() => {
    if (profile?.preferences) {
      setWeeklySummary(!!profile.preferences.weeklySummaryEnabled);
      setEmailNotifications(!!profile.preferences.emailNotificationsEnabled);
      setSummaryDay(profile.preferences.weeklySummaryDay || 1);
    }
  }, [profile]);

  // Preference mutation
  const updatePrefsMutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: () => {
      toast.success('Preferences updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update preferences.');
    },
  });

  // Account deletion mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success('Your account has been deleted.');
      logout();
      navigate('/login');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete account. Please try again.');
    },
  });

  const handleToggleWeeklySummary = () => {
    const nextVal = !weeklySummary;
    setWeeklySummary(nextVal);
    updatePrefsMutation.mutate({ weeklySummaryEnabled: nextVal });
  };

  const handleToggleEmailNotifications = () => {
    const nextVal = !emailNotifications;
    setEmailNotifications(nextVal);
    updatePrefsMutation.mutate({ emailNotificationsEnabled: nextVal });
  };

  const handleDayChange = (day: number) => {
    setSummaryDay(day);
    updatePrefsMutation.mutate({ weeklySummaryDay: day });
  };

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
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                {profile?.username || authUser?.userName || 'User'}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {profile?.email || authUser?.email || 'user@example.com'}
              </p>
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
          Notifications & Email Scheduling
        </h2>
        {isLoading ? (
          <div className="py-6 text-center text-xs text-[hsl(var(--muted-foreground))] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading preferences...
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            <SettingRow
              icon={Bell}
              title="Weekly Summary"
              description="Receive an automated AI weekly reflection on your entries"
            >
              <Toggle
                checked={weeklySummary}
                onChange={handleToggleWeeklySummary}
                disabled={updatePrefsMutation.isPending}
              />
            </SettingRow>
            <SettingRow
              icon={Mail}
              title="Email Delivery"
              description="Get your weekly summaries delivered directly to your inbox"
            >
              <Toggle
                checked={emailNotifications}
                onChange={handleToggleEmailNotifications}
                disabled={updatePrefsMutation.isPending}
              />
            </SettingRow>
            <SettingRow
              icon={Calendar}
              title="Summary Schedule Day"
              description="Which day of the week to generate and deliver your weekly reflection"
            >
              <select
                value={summaryDay}
                onChange={(e) => handleDayChange(Number(e.target.value))}
                disabled={updatePrefsMutation.isPending}
                className="px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </SettingRow>
          </div>
        )}
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={item} className="rounded-xl border border-red-500/20 bg-[hsl(var(--card))] p-6">
        <h2 className="font-serif text-base font-medium text-red-400 mb-2">
          Danger Zone
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
          Once you delete your account, there is no going back. All your journal entries, memories, and insights will be permanently removed.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
        >
          Delete Account
        </button>
      </motion.div>

      {/* Account Deletion Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-red-500/30 bg-[hsl(var(--card))] p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <h3 className="font-serif text-lg font-semibold">Delete Account Permanently?</h3>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed mb-6">
                This action is irreversible. Your account and all associated journal entries, AI memories, and insights will be permanently deleted from the database.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete My Account'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
