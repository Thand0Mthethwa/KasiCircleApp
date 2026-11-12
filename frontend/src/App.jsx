import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppShell from './components/AppShell';

// Pages
import Onboarding from './pages/Onboarding';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import JobForm from './pages/JobForm';
import MyJobApplications from './pages/MyJobApplications';
import Explore from './pages/Explore';
import BusinessDetail from './pages/BusinessDetail';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import BusinessProfile from './pages/BusinessProfile';
import BusinessReviews from './pages/BusinessReviews';
import Notifications from './pages/Notifications';
import AdminReports from './pages/AdminReports';
import Workers from './pages/Workers';
import WorkerDetail from './pages/WorkerDetail';
import WorkerProfile from './pages/WorkerProfile';
import NotFound from './pages/NotFound';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kasi-green"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kasi-green"></div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/welcome" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/home" replace />;
  return children;
}

// Public Route Component (redirects to home if already authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToWelcome = () => navigate('/welcome', { replace: true });
    window.addEventListener('kasicircle:unauthorized', redirectToWelcome);
    return () => window.removeEventListener('kasicircle:unauthorized', redirectToWelcome);
  }, [navigate]);

  return (
    <Routes>
      {/* Splash/Onboarding Routes */}
      <Route path="/" element={<Navigate to="/onboarding" replace />} />
      <Route
        path="/onboarding"
        element={
          <PublicRoute>
            <Onboarding />
          </PublicRoute>
        }
      />
      <Route
        path="/welcome"
        element={
          <PublicRoute>
            <Welcome />
          </PublicRoute>
        }
      />

      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Main App Routes */}
      <Route path="/home" element={<Home />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/businesses" element={<Explore />} />
      <Route path="/businesses/:id" element={<BusinessDetail />} />
      <Route path="/workers" element={<Workers />} />
      <Route path="/workers/:id" element={<WorkerDetail />} />
      <Route
        path="/worker-profile"
        element={
          <ProtectedRoute>
            <WorkerProfile />
          </ProtectedRoute>
        }
      />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:id" element={<JobDetail />} />
      <Route
        path="/jobs/new"
        element={<ProtectedRoute><JobForm /></ProtectedRoute>}
      />
      <Route
        path="/jobs/:id/edit"
        element={<ProtectedRoute><JobForm /></ProtectedRoute>}
      />
      <Route
        path="/my-applications"
        element={<ProtectedRoute><MyJobApplications /></ProtectedRoute>}
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminRoute>
            <AdminReports />
          </AdminRoute>
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
        path="/business-profile"
        element={
          <ProtectedRoute>
            <BusinessProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business-reviews"
        element={
          <ProtectedRoute>
            <BusinessReviews />
          </ProtectedRoute>
        }
      />

      {/* Catch all - 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </AuthProvider>
  );
}

export default App;
