import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { JournalCard } from '@/components/common/JournalCard';
import { MoodBadge } from '@/components/common/MoodBadge';
import { Plus, Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import type { JournalEntry } from '@/types/models';
import { useQuery } from '@tanstack/react-query';
import { fetchJournalEntries } from '@/lib/api';
import { useJournalModalStore } from '@/stores/journalModalStore';

export default function Journal() {
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const openModal = useJournalModalStore((s) => s.openModal);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: fetchJournalEntries,
  });

  const filtered = useMemo(() => {
    return entries.filter(
      (e) =>
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.content?.toLowerCase().includes(search.toLowerCase())
    );
  }, [entries, search]);

  return (
    <div>
      <PageHeader title="Journal" description="Your thoughts, captured and understood.">
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </PageHeader>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          placeholder="Search your entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
        />
      </div>

      <div className="flex gap-6">
        {/* Entry List */}
        <div className="flex-1 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          ) : (
            <>
              <AnimatePresence>
                {filtered.map((entry) => (
                  <JournalCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => setSelectedEntry(entry)}
                  />
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[hsl(var(--muted-foreground))]">No entries found</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedEntry && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-[400px] flex-shrink-0 hidden lg:block"
            >
              <div className="sticky top-24 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-[hsl(var(--foreground))]">
                      {selectedEntry.title}
                    </h2>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      {selectedEntry.date ? format(parseISO(selectedEntry.date), 'EEEE, MMMM d, yyyy · h:mm a') : 'Unknown Date'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="p-1 rounded hover:bg-[hsl(var(--accent))]"
                  >
                    <X className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  </button>
                </div>

                {selectedEntry.mood && (
                  <div className="flex items-center gap-2 mb-4">
                    <MoodBadge mood={selectedEntry.mood as any} size="md" />
                    {selectedEntry.emotions && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {selectedEntry.emotions.split(',').join(' · ')}
                      </span>
                    )}
                  </div>
                )}

                <div className="journal-text text-sm text-[hsl(var(--foreground))] leading-relaxed mb-6 whitespace-pre-wrap">
                  {selectedEntry.content}
                </div>

                {selectedEntry.motivationalThought && (
                  <div className="p-4 rounded-lg bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/10">
                    <p className="text-sm italic text-[hsl(var(--foreground))] journal-text">
                      "{selectedEntry.motivationalThought}"
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
