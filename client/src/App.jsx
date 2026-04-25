import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// ─── Unified Layout ───────────────────────────────────────
import AppShell from './components/layout/AppShell';

// ─── Auth Pages ───────────────────────────────────────────
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// ─── Shared Pages ──────────────────────────────────────────
import UnifiedProfile from './pages/shared/Profile';

// ─── Citizen Pages ────────────────────────────────────────
import CitizenDashboard from './pages/citizen/Dashboard';
import NewTicket from './pages/citizen/NewTicket';
import CitizenTicketDetail from './pages/citizen/TicketDetail';

// ─── Admin Pages ──────────────────────────────────────────
import AdminDashboard from './pages/admin/Dashboard';
import AdminTickets from './pages/admin/Tickets';
import AdminTicketDetail from './pages/admin/TicketDetail';
import AdminUsers from './pages/admin/Users';
import AdminDepartments from './pages/admin/Departments';
import AdminEscalations from './pages/admin/Escalations';
import GlobalMap from './pages/admin/GlobalMap';

// ─── Worker Pages ─────────────────────────────────────────
import WorkerDashboard from './pages/worker/Dashboard';
import WorkerExecution from './pages/worker/WorkerExecution';
import TaskHistory from './pages/worker/TaskHistory';

// ─── Officer Pages ────────────────────────────────────────
import OfficerDashboard from './pages/officer/Dashboard';
import InterventionQueue from './pages/officer/InterventionQueue';
import OfficerTicketDetail from './pages/officer/TicketDetail';

// ─── Shared & Error Pages ──────────────────────────────────
import Unauthorized403 from './pages/errors/Unauthorized403';
import NotFound404 from './pages/errors/NotFound404';
import ServerError500 from './pages/errors/ServerError500';

// ─── Guards ───────────────────────────────────────────────
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // Force email verification for citizens
  if (user.role === 'CITIZEN' && !user.emailVerified) {
    return <Navigate to="/verify-otp" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

const RoleBasedRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const map = {
    CITIZEN: '/citizen',
    ADMIN: '/admin',
    DEPT_WORKER: '/worker',
    OFFICER: '/officer',
  };
  return <Navigate to={map[user.role] || '/unauthorized'} replace />;
};

// ─── App ──────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/app" element={<RoleBasedRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized403 />} />
          <Route path="/500" element={<ServerError500 />} />

          {/* Citizen — protected, unified in AppShell */}
          <Route element={<ProtectedRoute allowedRoles={['CITIZEN']} />}>
            <Route element={<AppShell />}>
              <Route path="/citizen" element={<CitizenDashboard />} />
              <Route path="/citizen/tickets/new" element={<NewTicket />} />
              <Route path="/citizen/tickets/:id" element={<CitizenTicketDetail />} />
              <Route path="/citizen/profile" element={<UnifiedProfile />} />
            </Route>
          </Route>

          {/* Admin — protected, unified in AppShell */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<AppShell />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/map" element={<GlobalMap />} />
              <Route path="/admin/tickets" element={<AdminTickets />} />
              <Route path="/admin/tickets/:id" element={<AdminTicketDetail />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/departments" element={<AdminDepartments />} />
              <Route path="/admin/escalations" element={<AdminEscalations />} />
              <Route path="/admin/profile" element={<UnifiedProfile />} />
            </Route>
          </Route>

          {/* Worker — protected, unified in AppShell */}
          <Route element={<ProtectedRoute allowedRoles={['DEPT_WORKER']} />}>
            <Route element={<AppShell />}>
              <Route path="/worker" element={<WorkerDashboard />} />
              <Route path="/worker/history" element={<TaskHistory />} />
              <Route path="/worker/tickets/:id" element={<WorkerExecution />} />
              <Route path="/worker/profile" element={<UnifiedProfile />} />
            </Route>
          </Route>

          {/* Officer — protected, unified in AppShell */}
          <Route element={<ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']} />}>
            <Route element={<AppShell />}>
              <Route path="/officer" element={<OfficerDashboard />} />
              <Route path="/officer/interventions" element={<InterventionQueue />} />
              <Route path="/officer/tickets/:id" element={<OfficerTicketDetail />} />
              <Route path="/officer/profile" element={<UnifiedProfile />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound404 />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
