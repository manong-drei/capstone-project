import { useState } from "react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import StatusBadge from "@/components/common/StatusBadge";
import StaffManager from "./StaffManager";
import PatientManager from "./PatientManager";
import { DENTAL_SERVICES as SERVICES } from "@/constants/medicalServices";

const BLUE  = "#1a3a8f";
const BLUE2 = "#1e4db7";
const ORANGE = "#f97316";

/* ── Chart data (static placeholders — replace with real API calls later) ── */
const GROUP_NAME_MAP = {
  "Restoration (Tooth Filling)":          "Restoration",
  "Removable Partial Denture (Vitaflex)": "Prosthetics / RPD",
  "Dental Surgery":                       "Dental Surgery",
};
const GROUP_COLORS = {
  General:           ["#60a5fa","#93c5fd","#4ade80","#2d3a8c","#bfdbfe","#dbeafe"],
  Restoration:       ["#c084fc","#a855f7"],
  "Prosthetics / RPD": ["#34d399","#10b981"],
  "Dental Surgery":  ["#fb923c","#f97316","#ea580c"],
};
const PLACEHOLDER_USAGE = {
  CONSULTATION:40, ORAL_PROPHYLAXIS:28, PERMANENT_FILLING:15, TEMPORARY_FILLING:12,
  FLUORIDE:10, SILVER_DIAMINE:5, RPD_UPPER:8, RPD_LOWER:6,
  CLOSED_EXTRACTION:25, OPEN_EXTRACTION:18, ODONTECTOMY:10, SPECIAL_SURGERY:7, OTHERS:4,
};

function buildDeptServices() {
  const grouped = {};
  SERVICES.forEach((s) => {
    const dept = s.group ? (GROUP_NAME_MAP[s.group] ?? s.group) : "General";
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(s);
  });
  const result = {};
  Object.entries(grouped).forEach(([dept, svcs]) => {
    const colors = GROUP_COLORS[dept] ?? ["#60a5fa","#93c5fd","#4ade80","#2d3a8c"];
    result[dept] = svcs.map((s, i) => ({
      name:  s.label,
      value: PLACEHOLDER_USAGE[s.id] ?? 5,
      color: colors[i % colors.length],
    }));
  });
  return result;
}
const departmentServices = buildDeptServices();
const DEPARTMENTS = Object.keys(departmentServices);

const volumeDataMap = {
  Daily:   [{ d:"Mon",v:12 },{ d:"Tue",v:18 },{ d:"Wed",v:9 },{ d:"Thu",v:22 },{ d:"Fri",v:15 },{ d:"Sat",v:7 }],
  Weekly:  [{ d:"W1",v:80 },{ d:"W2",v:95 },{ d:"W3",v:70 },{ d:"W4",v:110 }],
  Monthly: [{ d:"Jan",v:320 },{ d:"Feb",v:290 },{ d:"Mar",v:340 },{ d:"Apr",v:305 }],
};

const notificationsPlaceholder = [
  { id:1, title:"New appointment request", body:"Juan Dela Cruz booked for Apr 22.", time:"2 min ago" },
  { id:2, title:"Doctor went on leave",    body:"Dr. Santos marked absent today.",   time:"15 min ago" },
  { id:3, title:"Queue threshold reached", body:"Queue exceeded 30 patients today.", time:"1 hr ago" },
  { id:4, title:"Monthly report ready",    body:"March analytics are now available.", time:"1 day ago" },
];

const formatAppointmentDate = (value, withYear = true) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-PH", { month:"short", day:"numeric", ...(withYear ? { year:"numeric" } : {}) });
};
const formatDoctorName = (appt) => {
  const name = `Dr. ${appt?.doctor_first_name ?? ""} ${appt?.doctor_last_name ?? ""}`.trim();
  return name === "Dr." ? "—" : name;
};
const formatServices = (appt) => {
  try {
    const raw = appt?.queue_services;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.join(", ");
  } catch { /* fall through */ }
  return appt?.reason || "—";
};

/**
 * AdminOverviewTab
 * The main "Dashboard" tab shown when an admin first lands on the dashboard.
 *
 * Props:
 *   overview          — overview data object from /admin/overview
 *   ovLoading         — boolean
 *   doctors           — array of doctor objects
 *   recentAppointments — first 5 appointments
 *   apptLoading       — boolean
 */
export default function AdminOverviewTab({
  overview, ovLoading,
  doctors,
  recentAppointments, apptLoading,
}) {
  const [accountTab, setAccountTab] = useState("Staff");
  const [volumeTab, setVolumeTab] = useState("Daily");
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
      {/* Hero */}
      <div style={{ borderRadius:"20px", overflow:"hidden", position:"relative", minHeight:"140px", display:"flex", alignItems:"center" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"url(/assets/BGHero.png)", backgroundSize:"cover", backgroundPosition:"center" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,0.42)" }} />
        <div className="ad-hero-pad" style={{ position:"relative" }}>
          <p style={{ margin:"0 0 4px", fontSize:"12px", fontWeight:500, color:"#475569" }}>Admin Panel</p>
          <h2 style={{ margin:"0 0 4px", fontSize:"22px", fontWeight:800, color:BLUE }}>
            {new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening"}!
          </h2>
          <p style={{ margin:0, fontSize:"13px", color:"#64748b" }}>
            {new Date().toLocaleDateString("en-PH", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Patients Today",      value: ovLoading ? "—" : (overview?.totalPatients ?? 0), bg:BLUE },
          { label:"Doctors Available",   value: ovLoading ? "—" : (overview?.doctorsOnDuty ?? 0),  bg:"#0891b2" },
          { label:"Appointments Today",  value: ovLoading ? "—" : (overview?.appointments ?? 0),   bg:ORANGE },
          { label:"Queues Completed",    value: ovLoading ? "—" : (overview?.doneToday ?? 0),       bg:"#059669" },
        ].map(({ label, value, bg }) => (
          <div key={label} style={{ background:"#fff", borderRadius:"16px", padding:"18px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", borderTop:`4px solid ${bg}`, display:"flex", flexDirection:"column", gap:"6px" }}>
            <span style={{ fontSize:"26px", fontWeight:800, color:bg }}>{value}</span>
            <span style={{ fontSize:"12px", color:"#64748b" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Department Donut + Patient Volume Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="ad-section-pad" style={{ background:"#fff", borderRadius:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
          <h3 style={{ margin:"0 0 10px", fontSize:"14px", fontWeight:700, color:"#1e293b" }}>Department Distribution: Top Services Used</h3>
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} style={{ marginBottom:"14px", padding:"6px 10px", borderRadius:"8px", border:"1.5px solid #e2e8f0", fontSize:"12px", color:"#1e293b", background:"#f8fafc", outline:"none", cursor:"pointer", width:"100%", fontFamily:"inherit" }}>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div style={{ display:"flex", alignItems:"center", gap:"16px", flexWrap:"wrap" }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={departmentServices[selectedDept]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {departmentServices[selectedDept].map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", flex:1, minWidth:0 }}>
              {departmentServices[selectedDept].map((d) => {
                const total = departmentServices[selectedDept].reduce((sum, s) => sum + s.value, 0);
                const pct = ((d.value / total) * 100).toFixed(1);
                return (
                  <div key={d.name} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <span style={{ width:"10px", height:"10px", borderRadius:"50%", background:d.color, flexShrink:0 }} />
                    <span style={{ fontSize:"12px", color:"#475569", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.name}</span>
                    <span style={{ fontSize:"12px", fontWeight:700, color:"#1e293b", flexShrink:0 }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="ad-section-pad" style={{ background:"#fff", borderRadius:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
            <h3 style={{ margin:0, fontSize:"14px", fontWeight:700, color:"#1e293b" }}>Patient Volume</h3>
            <div style={{ display:"flex", gap:"4px" }}>
              {["Daily","Weekly","Monthly"].map((t) => (
                <button key={t} onClick={() => setVolumeTab(t)} style={{ padding:"3px 10px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:600, background: volumeTab === t ? BLUE : "#f1f5f9", color: volumeTab === t ? "#fff" : "#64748b" }}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={volumeDataMap[volumeTab]} barSize={18}>
              <XAxis dataKey="d" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip cursor={{ fill:"#f1f5f9" }} contentStyle={{ fontSize:"12px", borderRadius:"8px" }} />
              <Bar dataKey="v" fill={BLUE2} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Doctors Profile */}
      <div className="ad-section-pad" style={{ background:"#fff", borderRadius:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin:"0 0 14px", fontSize:"14px", fontWeight:700, color:"#1e293b" }}>Doctors Profile</h3>
        {doctors.length === 0 ? (
          <p style={{ margin:0, color:"#94a3b8", fontSize:"13px" }}>No doctors registered yet.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {doctors.map((d) => (
              <div key={d.doctor_id} style={{ border:"1px solid #e2e8f0", borderRadius:"12px", padding:"14px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}>
                <span style={{ fontSize:"13px", fontWeight:600, color:"#1e293b" }}>Dr. {d.first_name} {d.last_name}</span>
                <StatusBadge status={d.is_available ? "available" : "on_leave"} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Patient History */}
      <div className="ad-section-pad" style={{ background:"#fff", borderRadius:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin:"0 0 14px", fontSize:"14px", fontWeight:700, color:"#1e293b" }}>Patient History</h3>
        {apptLoading ? (
          <p style={{ margin:0, color:"#94a3b8", fontSize:"13px" }}>Loading recent history...</p>
        ) : recentAppointments.length === 0 ? (
          <p style={{ margin:0, color:"#94a3b8", fontSize:"13px" }}>No appointments recorded yet.</p>
        ) : (
          <>
            <div className="ad-hide-on-mobile" style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #e2e8f0" }}>
                    {["Patient","Date","Doctor","Service","Status"].map((h) => (
                      <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontWeight:600, color:"#64748b", fontSize:"12px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((appt) => (
                    <tr key={appt.appointment_id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                      <td style={{ padding:"10px 12px", color:"#1e293b", fontWeight:500 }}>{appt.patient_full_name || "—"}</td>
                      <td style={{ padding:"10px 12px", color:"#64748b" }}>{formatAppointmentDate(appt.appointment_date)}</td>
                      <td style={{ padding:"10px 12px", color:"#64748b" }}>{formatDoctorName(appt)}</td>
                      <td style={{ padding:"10px 12px", color:"#64748b" }}>{formatServices(appt)}</td>
                      <td style={{ padding:"10px 12px" }}><StatusBadge status={appt.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ad-show-on-mobile">
              {recentAppointments.map((appt) => (
                <div key={appt.appointment_id} style={{ border:"1px solid #e2e8f0", borderRadius:"10px", padding:"12px", display:"flex", flexDirection:"column", gap:"6px", background:"#f8fafc" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"10px" }}>
                    <span style={{ fontSize:"14px", fontWeight:600, color:"#1e293b" }}>{appt.patient_full_name || "—"}</span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <span style={{ fontSize:"12px", color:"#64748b" }}>{formatDoctorName(appt)}</span>
                  <span style={{ fontSize:"12px", color:"#64748b" }}>{formatServices(appt)}</span>
                  <span style={{ fontSize:"11px", color:"#94a3b8" }}>{formatAppointmentDate(appt.appointment_date)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Account Management */}
      <div className="ad-section-pad" style={{ background:"#fff", borderRadius:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin:"0 0 14px", fontSize:"14px", fontWeight:700, color:"#1e293b" }}>Account Management</h3>
        <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
          {["Staff","Patients"].map((t) => (
            <button key={t} onClick={() => setAccountTab(t)} style={{ padding:"8px 22px", borderRadius:"8px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:600, background: accountTab === t ? BLUE : "#f1f5f9", color: accountTab === t ? "#fff" : "#64748b", transition:"all 0.15s" }}>{t}</button>
          ))}
        </div>
        {accountTab === "Staff" ? <StaffManager /> : <PatientManager />}
      </div>

      {/* Notifications */}
      <div className="ad-section-pad" style={{ background:"#fff", borderRadius:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin:"0 0 14px", fontSize:"14px", fontWeight:700, color:"#1e293b" }}>Notifications</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {notificationsPlaceholder.map((n) => (
            <div key={n.id} style={{ display:"flex", gap:"12px", padding:"12px", borderRadius:"10px", background:"#f8fafc", border:"1px solid #e2e8f0" }}>
              <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"#dbeafe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"16px" }}>🔔</div>
              <div style={{ flex:1 }}>
                <p style={{ margin:"0 0 2px", fontSize:"13px", fontWeight:600, color:"#1e293b" }}>{n.title}</p>
                <p style={{ margin:0, fontSize:"12px", color:"#64748b" }}>{n.body}</p>
              </div>
              <span style={{ fontSize:"11px", color:"#94a3b8", flexShrink:0, alignSelf:"flex-start" }}>{n.time}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
