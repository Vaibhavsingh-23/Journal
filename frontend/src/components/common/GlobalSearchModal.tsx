import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, Brain, BookOpen, Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { searchJournal } from '@/lib/api';
import { useSearchModalStore } from '@/stores/searchModalStore';
import { useNavigate } from 'react-router-dom';

const QUICK_PROMPTS = [
  'What made me happy this week?',
  'How has my productivity been recently?',
  'What key learnings have I noted?',
  'Summary of recent emotional trends',
];

export function GlobalSearchModal() {
  const { isOpen, closeModal } = useSearchModalStore();
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const searchMutation = useMutation({
    mutationFn: (q: string) => searchJournal(q),
    onSuccess: () => {
      setHasSearched(true);
    },
  });

  const handleSearch = (textToSearch?: string) => {
    const q = textToSearch !== undefined ? textToSearch : query;
    if (!q.trim()) return;
    setQuery(q);
    setHasSearched(true);
    searchMutation.mutate(q);
  };

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setHasSearched(false);
      searchMutation.reset();
    }
  }, [isOpen]);

  const results = searchMutation.data || [];
  const isSearching = searchMutation.isPending;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-20"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl overflow-hidden"
          >
            {/* Search Input Header */}
            <div className="relative flex items-center px-4 border-b border-[hsl(var(--border))]">
              <Search className="w-5 h-5 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
              <input
                type="text"
                placeholder="Ask your Second Brain anything... (e.g. 'What goals did I set?')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-3 py-4 text-base font-sans text-[hsl(var(--foreground))] bg-transparent border-none outline-none placeholder:text-[hsl(var(--muted-foreground))]"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setHasSearched(false);
                    searchMutation.reset();
                  }}
                  className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleSearch()}
                disabled={isSearching || !query.trim()}
                className="ml-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
              </button>
            </div>

            {/* Content Area */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
              {/* Quick Prompts when clean */}
              {!hasSearched && !isSearching && (
                <div>
                  <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2.5 uppercase tracking-wider">
                    Suggested Questions
                  </p>
                  <div className="space-y-1.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSearch(prompt)}
                        className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--background))]/50 hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--primary))]/30 text-sm text-[hsl(var(--foreground))] transition-colors group"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                          {prompt}
                        </span>
                        <CornerDownLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[hsl(var(--muted-foreground))]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isSearching && (
                <div className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--primary))] mx-auto mb-2" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Retrieving insights from RAG & Memory Engine...
                  </p>
                </div>
              )}

              {/* Search Results */}
              {!isSearching && results.length > 0 && (
                <div className="space-y-3">
                  {results.map((res) => (
                    <div
                      key={res.id}
                      className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/60 p-4 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          res.engine === 'MEMORY' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-blue-400/10 text-blue-400'
                        }`}>
                          {res.engine === 'MEMORY' ? <Brain className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                          {res.engine === 'MEMORY' ? 'Memory Engine Graph' : 'Journal Entry RAG'}
                        </span>
                      </div>
                      <p className="text-sm text-[hsl(var(--foreground))] journal-text leading-relaxed">
                        {res.answer}
                      </p>
                      {res.sources?.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-1 border-t border-[hsl(var(--border))]/50">
                          {res.sources.map((src, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]">
                              {src}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isSearching && hasSearched && results.length === 0 && (
                <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
                  No direct answers found for "{query}". Try rephrasing your question.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
              <div className="flex items-center gap-4">
                <span>Press <kbd className="px-1.5 py-0.5 bg-[hsl(var(--accent))] rounded font-mono text-[10px]">ESC</kbd> to close</span>
              </div>
              <button
                onClick={() => {
                  closeModal();
                  navigate('/search');
                }}
                className="flex items-center gap-1 text-[hsl(var(--primary))] hover:underline font-medium"
              >
                Go to Full Search Page <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
