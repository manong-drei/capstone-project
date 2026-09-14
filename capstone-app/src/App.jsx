// src/App.jsx
// ─── CHANGES from previous version ───────────────────────────────────────────
//   1. Import StaffDashboard
//   2. Add STAFF_DASHBOARD destination in RoleRedirect (was pointing to admin)
//   3. Add protected /staff route
// ─────────────────────────────────────────────────────────────────────────────

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { ROUTES } from "./constants/routes";
import { ROLES } from "./constants/roles";
import LandingPage from "./pages/LandingPage";

// Pages
const LoginPage = lazy(() => import("./pages/LoginPage"));
//import RegisterPage from "./pages/RegisterPage";
const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const StaffDashboard = lazy(() => import("./pages/StaffDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const GeneralQueueMonitor = lazy(() => import("./pages/GeneralQueueMonitor"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
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

  if (
    user.must_change_password &&
    window.location.pathname !== ROUTES.CHANGE_PASSWORD
  )
    return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

  const destinations = {
    [ROLES.PATIENT]: ROUTES.PATIENT_DASHBOARD,
    [ROLES.DOCTOR]: ROUTES.DOCTOR_DASHBOARD,
    [ROLES.STAFF]: ROUTES.STAFF_DASHBOARD,
    [ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
  };

  return <Navigate to={destinations[user.role] ?? ROUTES.HOME} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
        {/* Public routes */}
        <Route path={ROUTES.HOME} element={<LandingPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        {/*<Route path={ROUTES.REGISTER} element={<RegisterPage />} />*/}

        {/* Role-based redirect */}
        <Route path="/dashboard" element={<RoleRedirect />} />

        {/* Protected: Forced password change */}
        <Route
          path={ROUTES.CHANGE_PASSWORD}
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

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

        {/* Protected: Staff  ← NEW */}
        <Route
          path={ROUTES.STAFF_DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
              <StaffDashboard />
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

        {/* General Queue Monitor — staff/admin only kiosk display */}
        <Route
          path={ROUTES.GENERAL_QUEUE_MONITOR}
          element={
            <ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.ADMIN]}>
              <GeneralQueueMonitor />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
