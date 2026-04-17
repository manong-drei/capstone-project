// src/App.jsx
// ─── CHANGES from previous version ───────────────────────────────────────────
//   1. Import StaffDashboard
//   2. Add STAFF_DASHBOARD destination in RoleRedirect (was pointing to admin)
//   3. Add protected /staff route
// ─────────────────────────────────────────────────────────────────────────────

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
import StaffDashboard from "./pages/StaffDashboard"; // ← NEW
import AdminDashboard from "./pages/AdminDashboard";

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
    [ROLES.STAFF]: ROUTES.STAFF_DASHBOARD, // ← CHANGED (was ADMIN_DASHBOARD)
    [ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
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

        {/* Role-based redirect */}
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

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
