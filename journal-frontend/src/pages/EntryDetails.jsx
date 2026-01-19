import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, RefreshCw, Calendar, Sparkles, Heart, Save, X } from 'lucide-react';
import { journalService } from '../api/services';
import Navbar from '../components/Navbar';

export default function EntryDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ title: '', content: '' });
    const [reanalyzing, setReanalyzing] = useState(false);

    useEffect(() => {
        loadEntry();
    }, [id]);

    const loadEntry = async () => {
        try {
            const data = await journalService.getEntryById(id);
            setEntry(data);
            setEditData({ title: data.title || '', content: data.content || '' });
        } catch (error) {
            console.error('Failed to load entry:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            try {
                await journalService.deleteEntry(id);
                navigate('/journal');
            } catch (error) {
                console.error('Failed to delete entry:', error);
                alert('Failed to delete entry');
            }
        }
    };

    const handleReanalyze = async () => {
        setReanalyzing(true);
        try {
            await journalService.reanalyzeEntry(id);
            await loadEntry();
        } catch (error) {
            console.error('Failed to reanalyze entry:', error);
            alert('Failed to reanalyze entry');
        } finally {
            setReanalyzing(false);
        }
    };

    const handleSaveEdit = async () => {
        try {
            await journalService.updateEntry(id, {
                ...entry,
                title: editData.title,
                content: editData.content,
            });
            setIsEditing(false);
            await loadEntry();
        } catch (error) {
            console.error('Failed to update entry:', error);
            alert('Failed to update entry');
        }
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

    if (!entry) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <p className="text-center text-gray-600 dark:text-gray-400">Entry not found</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/journal')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-5 h-5" />
                            <span>{new Date(entry.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                    onClick={handleReanalyze}
                                    disabled={reanalyzing}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                                    title="Reanalyze with AI"
                                >
                                    <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${reanalyzing ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-6">
                    {isEditing ? (
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={editData.title}
                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                className="w-full text-3xl font-bold px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                            <textarea
                                value={editData.content}
                                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                                rows={15}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                            />
                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditData({ title: entry.title || '', content: entry.content || '' });
                                    }}
                                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Cancel</span>
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-200"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Save</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                {entry.title || 'Untitled Entry'}
                            </h1>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {entry.content}
                            </p>
                        </>
                    )}
                </div>

                {/* AI Analysis */}
                {!isEditing && entry.analysisCompleted && (
                    <div className="space-y-6">
                        {/* AI Summary */}
                        {entry.aiSummary && (
                            <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-2xl p-6">
                                <div className="flex items-center space-x-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Summary</h2>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300">{entry.aiSummary}</p>
                            </div>
                        )}

                        {/* Mood & Emotions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {entry.mood && (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Mood</h3>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{entry.mood}</p>
                                </div>
                            )}
                            {entry.emotions && (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Emotions</h3>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{entry.emotions}</p>
                                </div>
                            )}
                        </div>

                        {/* Sentiment Score */}
                        {entry.sentimentScore !== null && entry.sentimentScore !== undefined && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Sentiment Score</h3>
                                <div className="flex items-center space-x-4">
                                    <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-4">
                                        <div
                                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.max(0, Math.min(100, (entry.sentimentScore + 1) * 50))}%` }}
                                        />
                                    </div>
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {(entry.sentimentScore * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Motivational Thought */}
                        {entry.motivationalThought && (
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6">
                                <div className="flex items-center space-x-2 mb-3">
                                    <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Motivational Thought</h2>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 italic">{entry.motivationalThought}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
