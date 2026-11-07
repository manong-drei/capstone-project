import {
  BarChart3,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  History,
  LayoutDashboard,
  List,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { ROUTES } from "./routes";

export const DASHBOARD_NAVIGATION = {
  patient: [
    { label: "Dashboard", icon: LayoutDashboard, path: ROUTES.PATIENT_DASHBOARD },
    { label: "My queue", icon: List, path: ROUTES.PATIENT_MY_QUEUE },
    { label: "Appointment history", icon: CalendarDays, path: ROUTES.PATIENT_APPOINTMENT_HISTORY },
  ],
  doctor: [
    { key: "home", label: "Dashboard", icon: LayoutDashboard, path: ROUTES.DOCTOR_DASHBOARD },
    { key: "analytics", label: "Analytics", icon: BarChart3, path: ROUTES.DOCTOR_ANALYTICS },
    { key: "history", label: "Patient History", icon: ClipboardList, path: ROUTES.DOCTOR_PATIENT_HISTORY },
  ],
  staff: [
    { label: "Dashboard", icon: LayoutDashboard, path: ROUTES.STAFF_DASHBOARD },
    { label: "Walk-in registration", icon: UserPlus, path: ROUTES.STAFF_WALK_IN },
    { label: "Account recovery", icon: ShieldCheck, path: ROUTES.STAFF_ACCOUNT_RECOVERY },
  ],
  admin: [
    { key: "overview", label: "Dashboard", icon: LayoutDashboard, path: ROUTES.ADMIN_DASHBOARD },
    { key: "management", label: "Management", icon: UsersRound, path: ROUTES.ADMIN_DOCTORS },
    { key: "reports", label: "Analytics", icon: ChartNoAxesCombined, path: ROUTES.ADMIN_ANALYTICS },
    { key: "activity", label: "Activity", icon: History, path: ROUTES.ADMIN_NOTIFICATIONS },
  ],
};
