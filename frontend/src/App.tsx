import React, { useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './context/store';
import { MainLayout } from './components/layout/MainLayout';

// Lazy loaded pages
const Login = lazy(() =>
  import('./pages/Login').then((m) => ({ default: m.Login }))
);

const Register = lazy(() =>
  import('./pages/Register').then((m) => ({ default: m.Register }))
);

const ForgotPassword = lazy(() =>
  import('./pages/ForgotPassword').then((m) => ({
    default: m.ForgotPassword,
  }))
);

const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard }))
);

const Attendance = lazy(() =>
  import('./pages/Attendance').then((m) => ({ default: m.Attendance }))
);

const Assignments = lazy(() =>
  import('./pages/Assignments').then((m) => ({ default: m.Assignments }))
);

const Notes = lazy(() =>
  import('./pages/Notes').then((m) => ({ default: m.Notes }))
);

const StudyTimer = lazy(() =>
  import('./pages/StudyTimer').then((m) => ({ default: m.StudyTimer }))
);

const Settings = lazy(() =>
  import('./pages/Settings').then((m) => ({ default: m.Settings }))
);

const PerformanceCenter = lazy(() =>
  import('./pages/PerformanceCenter').then((m) => ({
    default: m.PerformanceCenter,
  }))
);

const ForecastEngine = lazy(() =>
  import('./pages/ForecastEngine').then((m) => ({
    default: m.ForecastEngine,
  }))
);

const Scheduler = lazy(() =>
  import('./pages/Scheduler').then((m) => ({
    default: m.Scheduler,
  }))
);

// Loading screen
const PageLoader: React.FC = () => (
  <div className="h-full w-full min-h-[40vh] flex flex-col items-center justify-center gap-2.5">
    <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent animate-spin rounded-full shadow-glow-brand" />
    <span className="text-[9px] text-muted-foreground font-extrabold uppercase tracking-widest animate-pulse">
      Loading action module...
    </span>
  </div>
);

// Protected Route
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const token = typeof window !== 'undefined' ? localStorage.getItem('studiq_access_token') : null;

  return isAuthenticated && token ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace />
  );
};

function App() {
  const initAuth = useAppStore((state) => state.initAuth);
  const isLoading = useAppStore((state) => state.isLoading);
  const isAuthenticated = useAppStore(
    (state) => state.isAuthenticated
  );

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent animate-spin rounded-full shadow-glow-brand" />
        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider animate-pulse">
          Initializing STUDIQ OS...
        </span>
      </div>
    );
  }

  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* Public Routes */}
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/register"
            element={
              !isAuthenticated ? (
                <Register />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="notes" element={<Notes />} />
            <Route path="timer" element={<StudyTimer />} />
            <Route
              path="performance"
              element={<PerformanceCenter />}
            />
            <Route
              path="sgpa-calculator"
              element={<ForecastEngine />}
            />
            <Route
              path="scheduler"
              element={<Scheduler />}
            />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;