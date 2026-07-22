import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Search as SearchIcon, Loader2, BookOpen, Brain, Sparkles, Copy, Check, Clock, Filter, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { searchJournal } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const CATEGORIZED_SUGGESTIONS = [
  { category: '🧠 Emotional Reflection', query: 'What triggers my anxiety or calm moods?' },
  { category: '⚡ Productivity', query: 'What makes me most productive in the morning?' },
  { category: '💡 Growth & Learnings', query: 'What important lessons have I learned recently?' },
  { category: '👥 Relationships', query: 'Who have I been spending quality time with?' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MEMORY' | 'RAG'>('ALL');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('second-brain-recent-searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (q: string) => {
    const updated = [q, ...recentSearches.filter((item) => item !== q)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('second-brain-recent-searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const searchMutation = useMutation({
    mutationFn: (q: string) => searchJournal(q),
    onSuccess: () => {
      setHasSearched(true);
    },
    onError: () => {
      toast.error('Search failed. Please ensure the AI service is running.');
    },
  });

  const handleSearch = (customQuery?: string) => {
    const searchTarget = customQuery !== undefined ? customQuery : query;
    if (!searchTarget.trim()) return;
    setQuery(searchTarget);
    saveRecentSearch(searchTarget.trim());
    setHasSearched(true);
    searchMutation.mutate(searchTarget.trim());
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Answer copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const rawResults = searchMutation.data || [];
  const filteredResults = rawResults.filter((res) => {
    if (activeFilter === 'MEMORY') return res.engine === 'MEMORY';
    if (activeFilter === 'RAG') return res.engine !== 'MEMORY';
    return true;
  });

  const isSearching = searchMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Second Brain Search"
        description="Query your personal memories, RAG passages, and cognitive insights using AI."
      />

      {/* Main Search Input Card */}
      <div className="max-w-3xl mx-auto">
        <div className="relative shadow-lg rounded-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Ask anything about your past thoughts, habits, or learnings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-12 pr-32 py-4 text-base rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/50 focus:border-[hsl(var(--ring))]"
          />
          <button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </>
            ) : (
              'Query AI'
            )}
          </button>
        </div>

        {/* Source Engine Filters & Controls */}
        {hasSearched && (
          <div className="flex items-center justify-between mt-4 px-1">
            <div className="flex items-center gap-1.5 bg-[hsl(var(--card))] p-1 rounded-xl border border-[hsl(var(--border))]">
              <Filter className="w-3.5 h-3.5 ml-2 text-[hsl(var(--muted-foreground))]" />
              {(['ALL', 'MEMORY', 'RAG'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    activeFilter === filter
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-xs'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  {filter === 'ALL' ? 'All Engines' : filter === 'MEMORY' ? 'Memory Graph' : 'Journal RAG'}
                </button>
              ))}
            </div>

            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {filteredResults.length} result(s) found
            </span>
          </div>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && !hasSearched && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2.5 text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Recent Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(item)}
                  className="px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-xs text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))]/40 transition-colors flex items-center gap-1.5"
                >
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categorized Prompts */}
        {!hasSearched && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3 text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              <span>Explore Second Brain Prompts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIZED_SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(s.query)}
                  className="text-left p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))]/40 hover:bg-[hsl(var(--accent))]/40 transition-all group"
                >
                  <p className="text-xs font-medium text-[hsl(var(--primary))] mb-1">
                    {s.category}
                  </p>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))] group-hover:translate-x-0.5 transition-transform flex items-center justify-between">
                    <span>"{s.query}"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto py-12 text-center"
          >
            <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))] mx-auto mb-3" />
            <p className="text-sm text-[hsl(var(--muted-foreground))] font-medium">
              Scanning your journal entries and memory graphs...
            </p>
          </motion.div>
        )}

        {!isSearching && filteredResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto space-y-4"
          >
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                {/* Engine Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      result.engine === 'MEMORY' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-blue-400/10 text-blue-400'
                    }`}>
                      {result.engine === 'MEMORY' ? <Brain className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[hsl(var(--foreground))] block">
                        {result.engine === 'MEMORY' ? 'Memory Formation Graph' : 'Journal RAG Vector Engine'}
                      </span>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        AI Synthesis Result
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(result.id, result.answer)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--accent))]/50 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    title="Copy Answer"
                  >
                    {copiedId === result.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === result.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Answer Content */}
                <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed journal-text whitespace-pre-wrap">
                  {result.answer}
                </p>

                {/* Citation Sources */}
                {result.sources && result.sources.length > 0 && (
                  <div className="pt-3 border-t border-[hsl(var(--border))] flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Sources:</span>
                    {result.sources.map((src, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border border-[hsl(var(--border))]"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {!isSearching && hasSearched && filteredResults.length === 0 && searchMutation.isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto text-center py-12"
          >
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
              No results found matching your current filter.
            </p>
            <button
              onClick={() => setActiveFilter('ALL')}
              className="text-xs text-[hsl(var(--primary))] hover:underline font-medium"
            >
              Reset Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
