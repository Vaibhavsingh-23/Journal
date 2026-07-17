import { lazy, Suspense } from "react"
import { createBrowserRouter } from "react-router-dom"
import { AppLayout } from "../components/layout/AppLayout"
import { ProtectedRoute } from "../components/layout/ProtectedRoute"
import { PublicRoute } from "../components/layout/PublicRoute"
import { PageLoader } from "../components/common/PageLoader"
import { ErrorBoundary } from "../components/common/ErrorBoundary"

// Lazy load features for route-based code splitting
const LoginPage = lazy(() => import("../features/auth/LoginPage").then(module => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import("../features/auth/RegisterPage").then(module => ({ default: module.RegisterPage })))
const Dashboard = lazy(() => import("../features/dashboard").then(module => ({ default: module.Dashboard })))
const Journal = lazy(() => import("../features/journal").then(module => ({ default: module.Journal })))
const Reflection = lazy(() => import("../features/reflection").then(module => ({ default: module.Reflection })))
const MemoryExplorer = lazy(() => import("../features/memories").then(module => ({ default: module.MemoryExplorer })))
const Insights = lazy(() => import("../features/insights").then(module => ({ default: module.Insights })))
const Timeline = lazy(() => import("../features/timeline").then(module => ({ default: module.Timeline })))
const Search = lazy(() => import("../features/search").then(module => ({ default: module.Search })))
const Profile = lazy(() => import("../features/profile").then(module => ({ default: module.Profile })))
const Settings = lazy(() => import("../features/settings").then(module => ({ default: module.Settings })))

// Wrap lazy components with Suspense and ErrorBoundary
const withSuspense = (Component: React.ComponentType) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
)

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: "login",
        element: withSuspense(LoginPage),
      },
      {
        path: "register",
        element: withSuspense(RegisterPage),
      },
    ],
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: withSuspense(Dashboard),
          },
          {
            path: "journal",
            element: withSuspense(Journal),
          },
          {
            path: "reflection",
            element: withSuspense(Reflection),
          },
          {
            path: "memories",
            element: withSuspense(MemoryExplorer),
          },
          {
            path: "insights",
            element: withSuspense(Insights),
          },
          {
            path: "timeline",
            element: withSuspense(Timeline),
          },
          {
            path: "search",
            element: withSuspense(Search),
          },
          {
            path: "profile",
            element: withSuspense(Profile),
          },
          {
            path: "settings",
            element: withSuspense(Settings),
          },
        ],
      },
    ],
  },
])
