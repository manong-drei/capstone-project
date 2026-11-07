// src/App.jsx
// ─── CHANGES from previous version ───────────────────────────────────────────
//   1. Import StaffDashboard
//   2. Add STAFF_DASHBOARD destination in RoleRedirect (was pointing to admin)
//   3. Add protected /staff route
// ─────────────────────────────────────────────────────────────────────────────

import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { ACCOUNT_ROUTES, ROUTES } from "./constants/routes";
import { ROLES } from "./constants/roles";
import { PageLoading } from "./components/common/LoadingState";

// Pages
const CinematicLandingPage = lazy(
  () => import("./components/pages/cinematic-landing-page"),
);
const LoginPage = lazy(() => import("./pages/LoginPage"));
//import RegisterPage from "./pages/RegisterPage";
const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const StaffDashboard = lazy(() => import("./pages/StaffDashboard"));
const StaffPatientProfile = lazy(() => import("./pages/StaffPatientProfile"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const GeneralQueueMonitor = lazy(() => import("./pages/GeneralQueueMonitor"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoading />;
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

  return <Navigate to={ACCOUNT_ROUTES[user.role]?.dashboard ?? ROUTES.LOGIN} replace />;
}

function AppRoutes() {
  return (
      <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* Public routes */}
          <Route path={ROUTES.HOME} element={<CinematicLandingPage />} />
          <Route
            path={ROUTES.EXPERIMENTAL}
            element={<Navigate to={ROUTES.HOME} replace />}
          />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          {/*<Route path={ROUTES.REGISTER} element={<RegisterPage />} />*/}

          {/* Role-based redirect */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleRedirect />
              </ProtectedRoute>
            }
          />

          {/* Protected: Forced password change */}
          <Route
            path={ROUTES.CHANGE_PASSWORD}
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          {Object.entries(ACCOUNT_ROUTES).map(([role, { profile }]) => (
            <Route
              key={role}
              path={profile}
              element={<ProtectedRoute allowedRoles={[role]}><MyProfile /></ProtectedRoute>}
            />
          ))}

          {/* Protected: Patient */}
          <Route
            path={ROUTES.PATIENT_CHANGE_PASSWORD}
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={`${ROUTES.PATIENT_DASHBOARD}/*`}
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected: Doctor */}
          <Route
            path={`${ROUTES.DOCTOR_DASHBOARD}/*`}
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected: Staff  ← NEW */}
          <Route
            path={`${ROUTES.STAFF_DASHBOARD}/*`}
            element={
              <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.STAFF_PATIENT_PROFILE}
            element={
              <ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.ADMIN]}>
                <StaffPatientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.DOCTOR_PATIENT_PROFILE}
            element={
              <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
                <StaffPatientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_PATIENT_PROFILE}
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <StaffPatientProfile />
              </ProtectedRoute>
            }
          />

          {/* Protected: Admin */}
          <Route
            path={`${ROUTES.ADMIN_DASHBOARD}/*`}
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
  );
}

const router = createBrowserRouter([{ path: "*", element: <AppRoutes /> }]);

export default function App() {
  return <RouterProvider router={router} />;
}
