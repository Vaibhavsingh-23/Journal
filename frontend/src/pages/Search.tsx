import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { mockSearchResults } from '@/data/mock';
import { Search as SearchIcon, Loader2, BookOpen, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SearchResult } from '@/types/models';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    // Simulate search delay
    await new Promise((r) => setTimeout(r, 800));
    setResults(mockSearchResults);
    setIsSearching(false);
  };

  const suggestions = [
    'What makes me most productive?',
    'How have my mornings been lately?',
    'What have I learned about myself this week?',
    'Who have I been spending time with?',
  ];

  return (
    <div>
      <PageHeader
        title="Search"
        description="Ask your Second Brain anything. It searches your memories and journal entries."
      />

      {/* Search Input */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Ask a question about your experiences..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-12 pr-28 py-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-base placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/50 focus:border-[hsl(var(--ring))]"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Suggestions */}
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 uppercase tracking-wider">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                    setTimeout(handleSearch, 100);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))]/30 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto text-center py-12"
          >
            <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--primary))] mx-auto mb-3" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Searching your memories and journal entries...
            </p>
          </motion.div>
        )}

        {!isSearching && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-4"
          >
            {results.map((result) => (
              <div
                key={result.id}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                    result.engine === 'MEMORY' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-blue-400/10 text-blue-400'
                  }`}>
                    {result.engine === 'MEMORY' ? <Brain className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Answered from {result.engine === 'MEMORY' ? 'Memory Engine' : 'Journal RAG'}
                  </span>
                </div>

                <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed journal-text">
                  {result.answer}
                </p>

                {result.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[hsl(var(--border))]">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">Sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.sources.map((src, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto text-center py-12"
          >
            <p className="text-[hsl(var(--muted-foreground))]">
              No results found. Try rephrasing your question.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
