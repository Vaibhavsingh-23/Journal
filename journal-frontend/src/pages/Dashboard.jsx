import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Calendar, Flame, BookOpen, Sparkles, Plus } from 'lucide-react';
import { dashboardService, authService } from '../api/services';
import Navbar from '../components/Navbar';

export default function Dashboard() {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(null);
    const [weeklySummary, setWeeklySummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [progressData, summaryData] = await Promise.all([
                dashboardService.getProgress(),
                dashboardService.getWeeklySummary(),
            ]);
            setProgress(progressData);
            setWeeklySummary(summaryData);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
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

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Track your journaling journey and insights
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

                {/* Progress Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={<Flame className="w-8 h-8" />}
                        title="Current Streak"
                        value={progress?.currentStreak || 0}
                        subtitle="days"
                        color="from-orange-500 to-red-500"
                    />
                    <StatCard
                        icon={<TrendingUp className="w-8 h-8" />}
                        title="Longest Streak"
                        value={progress?.longestStreak || 0}
                        subtitle="days"
                        color="from-green-500 to-emerald-500"
                    />
                    <StatCard
                        icon={<Calendar className="w-8 h-8" />}
                        title="This Week"
                        value={progress?.weeklyEntryCount || 0}
                        subtitle="entries"
                        color="from-blue-500 to-cyan-500"
                    />
                    <StatCard
                        icon={<BookOpen className="w-8 h-8" />}
                        title="Total Entries"
                        value={progress?.totalEntries || 0}
                        subtitle="all time"
                        color="from-purple-500 to-pink-500"
                    />
                </div>

                {/* Weekly Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-xl">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Weekly Summary
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                AI-generated insights from your journal
                            </p>
                        </div>
                    </div>

                    {weeklySummary ? (
                        <>
                            {/* Summary Metadata */}
                            {typeof weeklySummary === 'object' && weeklySummary.weekStartDate && (
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Period</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {new Date(weeklySummary.weekStartDate).toLocaleDateString()} - {new Date(weeklySummary.weekEndDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Days Written</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{weeklySummary.daysWritten || 0}</p>
                                    </div>
                                </div>
                            )}

                            {/* Summary Content */}
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {typeof weeklySummary === 'string'
                                        ? weeklySummary
                                        : weeklySummary?.summaryText || weeklySummary?.summary || weeklySummary?.content || 'No summary available'}
                                </p>
                            </div>
                        </>
                    ) : (
                        /* No Summary Available - Placeholder */
                        <div className="text-center py-8">
                            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6 mb-4">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    You didn't write anything last week. Even a few lines can help clear your mind. Want to start today?
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/journal/new')}
                                className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Write Your First Entry</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Last Entry Date */}
                {progress?.lastEntryDate && (
                    <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Last entry: {new Date(progress.lastEntryDate).toLocaleDateString()}
                    </div>
                )}
            </div>
        </>
    );
}

function StatCard({ icon, title, value, subtitle, color }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
            <div className={`bg-gradient-to-br ${color} p-3 rounded-xl w-fit mb-4`}>
                <div className="text-white">{icon}</div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {title}
            </h3>
            <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {value}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-500">
                    {subtitle}
                </span>
            </div>
        </div>
    );
}
