import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Sparkles } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createJournalEntry } from '@/lib/api';
import { useJournalModalStore } from '@/stores/journalModalStore';
import { toast } from 'sonner';

const MOODS = ['HAPPY', 'CALM', 'PRODUCTIVE', 'REFLECTIVE', 'ANXIOUS'];

export function NewEntryModal() {
  const { isOpen, closeModal } = useJournalModalStore();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('HAPPY');

  const createMutation = useMutation({
    mutationFn: createJournalEntry,
    onSuccess: () => {
      toast.success('Journal entry saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      setTitle('');
      setContent('');
      setMood('HAPPY');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to save entry. Please try again.';
      toast.error(msg);
    },
  });

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please enter both a title and content for your entry.');
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      mood,
    });
  };

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to save while inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, content, mood]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[hsl(var(--border))]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center text-[hsl(var(--primary))]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="font-serif text-xl font-semibold text-[hsl(var(--foreground))]">
                  Write Journal Entry
                </h2>
              </div>
              <button
                onClick={closeModal}
                disabled={createMutation.isPending}
                className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mood selector */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-wider">
                How are you feeling?
              </label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                      mood === m
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold shadow-sm'
                        : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Form inputs */}
            <input
              type="text"
              placeholder="Give this moment a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-0 py-2 text-xl font-serif text-[hsl(var(--foreground))] bg-transparent border-none outline-none placeholder:text-[hsl(var(--muted-foreground))]"
              autoFocus
            />

            <textarea
              placeholder="Write freely. What's on your mind today?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={9}
              className="w-full px-0 py-2 text-sm text-[hsl(var(--foreground))] bg-transparent border-none outline-none resize-none journal-text placeholder:text-[hsl(var(--muted-foreground))]"
            />

            {/* Modal Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[hsl(var(--border))]">
              <span className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:inline">
                Press <kbd className="px-1.5 py-0.5 bg-[hsl(var(--accent))] rounded font-mono text-[10px]">⌘ + Enter</kbd> to save
              </span>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={createMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Entry'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
