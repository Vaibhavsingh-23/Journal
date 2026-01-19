import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './api/services';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JournalList from './pages/JournalList';
import CreateEntry from './pages/CreateEntry';
import EntryDetails from './pages/EntryDetails';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal"
          element={
            <ProtectedRoute>
              <JournalList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal/new"
          element={
            <ProtectedRoute>
              <CreateEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal/:id"
          element={
            <ProtectedRoute>
              <EntryDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to dashboard or login */}
        <Route
          path="*"
          element={
            authService.isAuthenticated() ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
