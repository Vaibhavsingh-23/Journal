import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Home, User, LogOut, Shield } from 'lucide-react';
import { authService } from '../api/services';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bg-white dark:bg-slate-800 shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
                        <BookOpen className="w-8 h-8" />
                        <span className="text-xl font-bold">Journal AI</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-6">
                        <Link
                            to="/"
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${isActive('/')
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Home className="w-5 h-5" />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            to="/journal"
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${isActive('/journal')
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                                }`}
                        >
                            <BookOpen className="w-5 h-5" />
                            <span>Journal</span>
                        </Link>

                        <Link
                            to="/profile"
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${isActive('/profile')
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                                }`}
                        >
                            <User className="w-5 h-5" />
                            <span>Profile</span>
                        </Link>

                        {/* Admin Link - Only for admins */}
                        {authService.isAdmin() && (
                            <Link
                                to="/admin"
                                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${isActive('/admin')
                                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <Shield className="w-5 h-5" />
                                <span>Admin</span>
                            </Link>
                        )}

                        {/* User Info & Logout */}
                        <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-300 dark:border-slate-600">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {currentUser?.username}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
