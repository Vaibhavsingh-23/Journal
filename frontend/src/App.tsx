import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, Suspense, lazy } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';

// Lazy-loaded routes for code splitting
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Journal = lazy(() => import('@/pages/Journal'));
const Timeline = lazy(() => import('@/pages/Timeline'));
const SearchPage = lazy(() => import('@/pages/Search'));
const Settings = lazy(() => import('@/pages/Settings'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const MemoryExplorer = lazy(() => import('@/pages/Memory'));
const Insights = lazy(() => import('@/pages/Insights'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <ThemeProvider>
        <TooltipProvider>
          <BrowserRouter>
          <Suspense fallback={<div className="flex h-screen items-center justify-center text-[hsl(var(--muted-foreground))]">Loading...</div>}>
            <Routes>
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* App routes (Protected) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/memory" element={<MemoryExplorer />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/timeline" element={<Timeline />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
