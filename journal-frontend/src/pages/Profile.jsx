import { useState, useEffect } from 'react';
import { User, Mail, Settings, Save, AlertCircle } from 'lucide-react';
import { userService, authService } from '../api/services';
import Navbar from '../components/Navbar';

export default function Profile() {
    const currentUser = authService.getCurrentUser();
    const [preferences, setPreferences] = useState({
        email: '',
        weeklySummaryEnabled: true,
        weeklySummaryDay: 1,
        emailNotificationsEnabled: true,
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            await userService.updatePreferences(preferences);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPreferences({
            ...preferences,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value,
        });
    };

    const weekDays = [
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' },
        { value: 7, label: 'Sunday' },
    ];

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Profile Settings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your account and preferences
                    </p>
                </div>

                {/* User Info Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-4 rounded-full">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {currentUser?.username}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">User Account</p>
                        </div>
                    </div>
                </div>

                {/* Preferences Form */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
                    <div className="flex items-center space-x-3 mb-6">
                        <Settings className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Preferences
                        </h2>
                    </div>

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400">
                            Preferences updated successfully!
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={preferences.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    placeholder="your.email@example.com"
                                />
                            </div>
                        </div>

                        {/* Weekly Summary */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Weekly Summary</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Receive AI-generated weekly summaries of your journal
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="weeklySummaryEnabled"
                                        checked={preferences.weeklySummaryEnabled}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                </label>
                            </div>

                            {preferences.weeklySummaryEnabled && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Summary Day
                                    </label>
                                    <select
                                        name="weeklySummaryDay"
                                        value={preferences.weeklySummaryDay}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    >
                                        {weekDays.map((day) => (
                                            <option key={day.value} value={day.value}>
                                                {day.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Email Notifications */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Receive email notifications for important updates
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="emailNotificationsEnabled"
                                    checked={preferences.emailNotificationsEnabled}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-5 h-5" />
                                <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
