import useLiveData from "@/hooks/useLiveData";
import { useCallback, lazy, Suspense, useEffect, useState } from "react";
import { Navigate, matchPath, useLocation, useNavigate } from "react-router-dom";
import { ChartNoAxesCombined, ClipboardList, History, LayoutDashboard, Stethoscope, UserRoundCog, UsersRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardIdentity } from "@/hooks/useDashboardIdentity";
import { ROUTES } from "@/constants/routes";
import api from "@/services/api";
import * as appointmentService from "@/services/appointmentService";
import StaffNavbar from "@/components/dashboards/staff/StaffNavbar";
import { DashboardSkeleton } from "@/components/common/LoadingState";
import UserManual from "@/components/common/LazyUserManual";
import "./AdminDashboard.css";

const AdminOverviewTab = lazy(() => import("@/components/dashboards/admin/AdminOverviewTab"));
const AdminReportsTab = lazy(() => import("@/components/dashboards/admin/AdminReportsTab"));
const AdminDoctorsTab = lazy(() => import("@/components/dashboards/admin/AdminDoctorsTab"));
const AdminPatientsHistoryTab = lazy(() => import("@/components/dashboards/admin/AdminPatientsHistoryTab"));
const AdminNotificationsTab = lazy(() => import("@/components/dashboards/admin/AdminNotificationsTab"));
const AdminAuditLogsTab = lazy(() => import("@/components/dashboards/admin/AdminAuditLogsTab"));
const AdminLeaveRequestsTab = lazy(() => import("@/components/dashboards/admin/AdminLeaveRequestsTab"));
const AdminStaffTab = lazy(() => import("@/components/dashboards/admin/AdminStaffTab"));

const pages = [
  [ROUTES.ADMIN_DASHBOARD, "overview"], [ROUTES.ADMIN_ANALYTICS, "reports"],
  [ROUTES.ADMIN_DOCTORS, "doctors"], [ROUTES.ADMIN_DOCTOR_RECORDS, "doctors"],
  [ROUTES.ADMIN_LEAVE_REQUESTS, "leave"], [ROUTES.ADMIN_LEAVE_REVIEW, "leave"],
  [ROUTES.ADMIN_PATIENT_HISTORY, "history"], [ROUTES.ADMIN_STAFF_ACCOUNTS, "accounts"],
  [ROUTES.ADMIN_PATIENT_ACCOUNTS, "accounts"], [ROUTES.ADMIN_NOTIFICATIONS, "notifications"],
  [ROUTES.ADMIN_AUDIT_LOGS, "auditlogs"],
];
const navigation = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard, path: ROUTES.ADMIN_DASHBOARD },
  { key: "management", label: "Management", icon: UsersRound, path: ROUTES.ADMIN_DOCTORS },
  { key: "reports", label: "Analytics", icon: ChartNoAxesCombined, path: ROUTES.ADMIN_ANALYTICS },
  { key: "activity", label: "Activity", icon: History, path: ROUTES.ADMIN_NOTIFICATIONS },
];
const managementSections = [
  { key: "doctors", label: "Doctors & leave", icon: Stethoscope, path: ROUTES.ADMIN_DOCTORS },
  { key: "accounts", label: "Accounts", icon: UserRoundCog, path: ROUTES.ADMIN_STAFF_ACCOUNTS },
  { key: "history", label: "Patient history", icon: ClipboardList, path: ROUTES.ADMIN_PATIENT_HISTORY },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { identity } = useDashboardIdentity();
  const activePage = pages.find(([path]) => matchPath(path, pathname))?.[1];
  const management = ["doctors", "leave", "accounts", "history"].includes(activePage);
  const activity = ["notifications", "auditlogs"].includes(activePage);
  const activeGroup = management ? "management" : activity ? "activity" : activePage;
  const [showManual, setShowManual] = useState(false);
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState("");
  const [ovLoading, setOvLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [overviewRetry, setOverviewRetry] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [doctorsError, setDoctorsError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [initialAppointmentsLoading, setInitialAppointmentsLoading] = useState(true);

  const fetchDoctors = useCallback(async (signal) => {
    try {
      const data = await api.get('/doctor', { signal });
      if (!signal?.aborted) { setDoctors(data?.data ?? []); setDoctorsError(''); }
    } catch (error) { if (!signal?.aborted) setDoctorsError(error.message || 'Doctor availability is unavailable.'); }
  }, []);
  useLiveData(fetchDoctors, ['overview', 'doctors', 'leave'].includes(activePage));

  useLiveData(useCallback(async (signal, background) => {
    if (!background) { setOvLoading(true); setApptLoading(true); }
    await Promise.all([
      api.get('/admin/overview', { signal }).then(data => {
        if (!signal.aborted) { setOverview(data); setOverviewError(''); }
      }).catch(error => { if (!signal.aborted) setOverviewError(error.message || 'Dashboard totals are unavailable.'); })
        .finally(() => { if (!signal.aborted) { setOvLoading(false); setInitialLoading(false); } }),
      appointmentService.getAllAppointments({ limit: 5 }, signal).then(response => {
        if (!signal.aborted) { setAppointments(response.data); setAppointmentsError(''); }
      }).catch(error => { if (!signal.aborted) setAppointmentsError(error.message || 'Recent appointments are unavailable.'); })
        .finally(() => { if (!signal.aborted) { setApptLoading(false); setInitialAppointmentsLoading(false); } }),
    ]);
  }, []), activePage === "overview", overviewRetry);

  useEffect(() => { window.scrollTo(0, 0); }, [activePage]);


  const goTo = path => navigate(path);
  const handleLogout = () => { logout(); navigate(ROUTES.LOGIN); };
  if (pathname === ROUTES.ADMIN_ACCOUNTS) return <Navigate to={ROUTES.ADMIN_STAFF_ACCOUNTS} replace />;
  if (pathname === ROUTES.ADMIN_QUEUE) return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  if (!activePage) return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;

  return (
    <div className="ad-root min-h-screen bg-slate-100 font-[Poppins,sans-serif] text-slate-800">
      <UserManual role="admin" isOpen={showManual} onClose={() => setShowManual(false)} />
      <StaffNavbar
        identity={identity}
        onHelp={() => setShowManual(true)}
        onLogout={handleLogout}
        sections={navigation.map((item) => ({
          ...item,
          active: activeGroup === item.key,
          onSelect: () => goTo(item.path),
        }))}
      />

      <main className="mx-auto w-full max-w-[1600px] space-y-4 px-3 py-4 sm:space-y-5 sm:px-4 sm:py-5 lg:px-6">
        {management && <>
          <div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-800"><UsersRound size={22} aria-hidden="true" /></span><div><h1 className="text-xl font-bold text-[#1a3a8f] sm:text-2xl">Management</h1><p className="mt-1 text-xs text-slate-500 sm:text-sm">Doctors, leave, accounts, and patient history in one place.</p></div></div>
          <div role="group" aria-label="Management sections" className="flex flex-wrap gap-1 border-b border-slate-200 pb-3">
            {managementSections.map(item => {
              const selected = item.key === activePage || (item.key === "doctors" && activePage === "leave");
              return <button key={item.key} type="button" aria-pressed={selected} onClick={() => goTo(item.path)} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-blue-600 sm:text-sm ${selected ? "bg-white text-blue-800 shadow-sm" : "text-slate-500 hover:bg-blue-50 hover:text-blue-800"}`}><item.icon size={17} aria-hidden="true" />{item.label}</button>;
            })}
          </div>
        </>}
        {activity && <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-xl font-bold text-[#1a3a8f] sm:text-2xl">Activity</h1><p className="mt-1 text-xs text-slate-500 sm:text-sm">SMS notifications, delivery history, and audit logs.</p></div><label className="grid gap-1 text-xs font-medium text-slate-600">Activity view<select aria-label="Activity view" value={activePage} onChange={event => goTo(event.target.value === "auditlogs" ? ROUTES.ADMIN_AUDIT_LOGS : ROUTES.ADMIN_NOTIFICATIONS)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"><option value="notifications">SMS notifications</option><option value="auditlogs">Audit logs</option></select></label></div>}
        <Suspense fallback={<DashboardSkeleton />}>
          {activePage === "overview" && <AdminOverviewTab identity={identity} overview={overview} ovLoading={ovLoading} initialLoading={initialLoading} overviewError={overviewError} onRetry={() => setOverviewRetry(value => value + 1)} doctors={doctors} doctorsError={doctorsError} recentAppointments={appointments} apptLoading={apptLoading} appointmentsError={appointmentsError} initialAppointmentsLoading={initialAppointmentsLoading} />}
          {activePage === "reports" && <AdminReportsTab />}
          {["doctors", "leave"].includes(activePage) && <div className="space-y-4"><AdminDoctorsTab doctors={doctors} />{doctorsError && <p role="alert" className="text-sm text-red-700">{doctorsError}</p>}<AdminLeaveRequestsTab onChanged={fetchDoctors} /></div>}
          {activePage === "history" && <AdminPatientsHistoryTab />}
          {activePage === "accounts" && <AdminStaffTab />}
          {activePage === "notifications" && <AdminNotificationsTab />}
          {activePage === "auditlogs" && <AdminAuditLogsTab />}
        </Suspense>
      </main>
    </div>
  );
}
