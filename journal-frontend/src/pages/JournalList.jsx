import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, Smile, Frown, Meh, Sparkles } from 'lucide-react';
import { journalService } from '../api/services';
import Navbar from '../components/Navbar';

export default function JournalList() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEntries();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = entries.filter(
                (entry) =>
                    entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    entry.content?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredEntries(filtered);
        } else {
            setFilteredEntries(entries);
        }
    }, [searchQuery, entries]);

    const loadEntries = async () => {
        try {
            const data = await journalService.getAllEntries();
            // Sort by date descending
            const sorted = (data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
            setEntries(sorted);
            setFilteredEntries(sorted);
        } catch (error) {
            console.error('Failed to load entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMoodIcon = (mood) => {
        const moodLower = mood?.toLowerCase() || '';
        if (moodLower.includes('happy') || moodLower.includes('joy')) {
            return <Smile className="w-5 h-5 text-green-500" />;
        } else if (moodLower.includes('sad') || moodLower.includes('down')) {
            return <Frown className="w-5 h-5 text-blue-500" />;
        } else {
            return <Meh className="w-5 h-5 text-yellow-500" />;
        }
    };

    const getSentimentColor = (score) => {
        if (score >= 0.5) return 'text-green-600 dark:text-green-400';
        if (score >= 0) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            My Journal
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/journal/new')}
                        className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Entry</span>
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search entries..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Entries Grid */}
                {filteredEntries.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {searchQuery ? 'No entries found matching your search.' : 'No journal entries yet.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => navigate('/journal/new')}
                                className="text-primary-600 dark:text-primary-400 hover:underline"
                            >
                                Create your first entry
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEntries.map((entry) => {
                            // Handle different ID formats from backend
                            const entryId = typeof entry.id === 'string' ? entry.id : entry.id?.timestamp || entry.id?.$oid;
                            return (
                                <div
                                    key={entryId || Math.random()}
                                    onClick={() => navigate(`/journal/${entryId}`)}
                                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer group"
                                >
                                    {/* Date & Mood */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(entry.date).toLocaleDateString()}</span>
                                        </div>
                                        {entry.mood && getMoodIcon(entry.mood)}
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {entry.title || 'Untitled Entry'}
                                    </h3>

                                    {/* Content Preview */}
                                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                        {entry.content}
                                    </p>

                                    {/* AI Summary */}
                                    {entry.aiSummary && (
                                        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 mb-4">
                                            <div className="flex items-start space-x-2">
                                                <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-primary-700 dark:text-primary-300 line-clamp-2">
                                                    {entry.aiSummary}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sentiment Score */}
                                    {entry.sentimentScore !== null && entry.sentimentScore !== undefined && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Sentiment:</span>
                                            <span className={`font-semibold ${getSentimentColor(entry.sentimentScore)}`}>
                                                {(entry.sentimentScore * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
