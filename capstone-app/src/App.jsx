import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { ROUTES } from "./constants/routes";
import { ROLES } from "./constants/roles";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

/**
 * ProtectedRoute
 * Redirects to /login if not authenticated.
 * Redirects to / if the user's role is not in allowedRoles.
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Prevent flash of redirect while session is being restored
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
}

/**
 * RoleRedirect
 * After login, sends each role to their correct dashboard.
 */
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

  const destinations = {
    [ROLES.PATIENT]: ROUTES.PATIENT_DASHBOARD,
    [ROLES.DOCTOR]: ROUTES.DOCTOR_DASHBOARD,
    [ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
    [ROLES.STAFF]: ROUTES.ADMIN_DASHBOARD, // ← staff currently shares admin dashboard
  };

  return <Navigate to={destinations[user.role] ?? ROUTES.HOME} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path={ROUTES.HOME} element={<LandingPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        {/* Role-based redirect (e.g. after login) */}
        <Route path="/dashboard" element={<RoleRedirect />} />

        {/* Protected: Patient */}
        <Route
          path={ROUTES.PATIENT_DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected: Doctor */}
        <Route
          path={ROUTES.DOCTOR_DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected: Admin */}
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
