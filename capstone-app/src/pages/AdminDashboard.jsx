import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../hooks/useAuth'
import { ROUTES }      from '../constants/routes'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

import StaffManager from '../components/dashboards/admin/StaffManager'
import api          from '../services/api'

/* ─── Palette ─────────────────────────────────────────────── */
const BLUE   = '#1a3a8f'
const BLUE2  = '#1e4db7'
const ORANGE = '#f97316'
const NAVY   = '#2d3a8c'

/* ─── Chart / Sidebar data (static placeholders) ──────────── */
const trafficData = [
  { name: 'Bago City',    value: 52.1, color: '#60a5fa' },
  { name: 'Iloilo City',  value: 22.8, color: '#93c5fd' },
  { name: 'Bacolod City', value: 13.9, color: '#4ade80' },
  { name: 'Other',        value: 11.2, color: '#1e1b4b' },
]

const queueStatsData = [
  { day: 'Mon', count: 25, color: '#60a5fa' },
  { day: 'Tue', count: 65, color: '#2dd4bf' },
  { day: 'Wed', count: 40, color: '#1e1b4b' },
  { day: 'Thu', count: 75, color: '#93c5fd' },
  { day: 'Fri', count: 20, color: '#c084fc' },
  { day: 'Sat', count: 55, color: '#4ade80' },
]

const volumeDataMap = {
  Daily:   [{ d: 'Mon', v: 12 }, { d: 'Tue', v: 18 }, { d: 'Wed', v: 9 },  { d: 'Thu', v: 22 }, { d: 'Fri', v: 15 }, { d: 'Sat', v: 7  }],
  Weekly:  [{ d: 'W1',  v: 80 }, { d: 'W2',  v: 95 }, { d: 'W3',  v: 70 }, { d: 'W4',  v: 110 }],
  Monthly: [{ d: 'Jan', v: 320 }, { d: 'Feb', v: 290 }, { d: 'Mar', v: 340 }, { d: 'Apr', v: 305 }],
}

const doctorsPlaceholder = [
  { name: 'Dr. Reyes',   status: 'available' },
  { name: 'Dr. Santos',  status: 'on_leave'  },
  { name: 'Dr. Lim',     status: 'available' },
  { name: 'Dr. Garcia',  status: 'available' },
]

const patientHistoryPlaceholder = [
  { name: 'Juan Dela Cruz',   date: 'Apr 20, 2026', service: 'Tooth Extraction', status: 'Done'    },
  { name: 'Maria Santos',     date: 'Apr 20, 2026', service: 'Dental Cleaning',  status: 'Done'    },
  { name: 'Pedro Reyes',      date: 'Apr 20, 2026', service: 'Consultation',     status: 'Pending' },
  { name: 'Ana Gomez',        date: 'Apr 19, 2026', service: 'X-Ray',            status: 'Done'    },
  { name: 'Ramon Villanueva', date: 'Apr 19, 2026', service: 'Tooth Extraction', status: 'Done'    },
]

const notificationsPlaceholder = [
  { id: 1, title: 'New appointment request', body: 'Juan Dela Cruz booked for Apr 22.',  time: '2 min ago'  },
  { id: 2, title: 'Doctor went on leave',    body: 'Dr. Santos marked absent today.',    time: '15 min ago' },
  { id: 3, title: 'Queue threshold reached', body: 'Queue exceeded 30 patients today.',  time: '1 hr ago'   },
  { id: 4, title: 'Monthly report ready',    body: 'March analytics are now available.', time: '1 day ago'  },
]

const sidebarItems = [
  { label: 'Dashboard',            tab: 'overview'        },
  { label: 'Queue Monitor',        tab: 'queuemonitor'    },
  { label: 'Statistics/Analytics', tab: 'reports'         },
  { label: 'Doctors',              tab: 'doctors'         },
  { label: 'Patients History',     tab: 'patientshistory' },
  { label: 'Notifications',        tab: 'notifications'   },
  { label: 'Accounts',             tab: 'staff'           },
]

/* ─── Tiny helpers ─────────────────────────────────────────── */
function StatusBadge({ status }) {
  const ok = status === 'available' || status === 'Done'
  return (
    <span
      style={{
        padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600,
        background: ok ? '#dcfce7' : '#fef9c3',
        color:      ok ? '#15803d' : '#92400e',
      }}
    >
      {status === 'available' ? 'Available' : status === 'on_leave' ? 'On Leave' : status}
    </span>
  )
}

/* ─── Main Component ───────────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [activeTab,  setActiveTab]  = useState('overview')
  const [accountTab, setAccountTab] = useState('Patient')
  const [volumeTab,  setVolumeTab]  = useState('Daily')
  const [overview,   setOverview]   = useState(null)
  const [ovLoading,  setOvLoading]  = useState(true)

  useEffect(() => { fetchOverview() }, [])

  const fetchOverview = async () => {
    setOvLoading(true)
    try {
      const data = await api.get('/admin/overview')
      setOverview(data)
    } catch {
      setOverview(null)
    } finally {
      setOvLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Poppins, system-ui, sans-serif' }}>

      {/* ═══════════════ TOP NAVBAR ═══════════════ */}
      <nav
        style={{
          background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE2} 100%)`,
          padding: '0 24px',
          height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 2px 12px rgba(26,58,143,0.18)',
        }}
      >
        {/* Left: Logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/assets/Logo.jpg"
            alt="logo"
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }}
          />
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px' }}>
            E-KALUSUGAN
          </span>
        </div>

        {/* Right: Help + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '7px 14px', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            Help
          </button>
          <button
            onClick={handleLogout}
            style={{ background: '#f97316', border: 'none', borderRadius: '8px', padding: '7px 16px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* ═══════════════ BODY: SIDEBAR + MAIN ═══════════════ */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>

        {/* ── Sidebar ── */}
        <aside
          style={{
            width: '180px', flexShrink: 0,
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            padding: '24px 0',
            display: 'flex', flexDirection: 'column',
            position: 'sticky', top: '64px', height: 'calc(100vh - 64px)',
            overflowY: 'auto',
          }}
        >
          <p style={{ margin: '0 0 12px', padding: '0 16px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            MAIN MENU
          </p>
          {sidebarItems.map(({ label, tab }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 16px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: activeTab === tab ? 600 : 400,
                background: activeTab === tab ? '#eff6ff' : 'transparent',
                color:      activeTab === tab ? BLUE : '#475569',
                borderLeft: activeTab === tab ? `3px solid ${BLUE}` : '3px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.background = 'transparent' }}
            >
              {label}
            </button>
          ))}
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

          {/* ════════ OVERVIEW / DASHBOARD ════════ */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Hero */}
              <div
                style={{
                  borderRadius: '20px', overflow: 'hidden', position: 'relative',
                  minHeight: '140px', display: 'flex', alignItems: 'center',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/assets/BGHero.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.42)' }} />
                <div style={{ position: 'relative', padding: '28px 32px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 500, color: '#475569' }}>Admin Panel</p>
                  <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: BLUE }}>
                    {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}!
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Stat Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Patients Today',        value: ovLoading ? '—' : (overview?.totalPatients  ?? 0), bg: BLUE,    icon: '🧑‍⚕️' },
                  { label: 'Doctors Available',      value: ovLoading ? '—' : (overview?.doctorsOnDuty  ?? 0), bg: '#0891b2', icon: '👨‍⚕️' },
                  { label: 'Appointments Today',     value: ovLoading ? '—' : (overview?.appointments   ?? 0), bg: ORANGE,  icon: '📅' },
                  { label: 'Queues Completed',       value: ovLoading ? '—' : (overview?.doneToday      ?? 0), bg: '#059669', icon: '✅' },
                ].map(({ label, value, bg, icon }) => (
                  <div
                    key={label}
                    style={{
                      background: '#fff', borderRadius: '16px', padding: '18px 20px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                      borderTop: `4px solid ${bg}`,
                      display: 'flex', flexDirection: 'column', gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: '22px' }}>{icon}</span>
                    <span style={{ fontSize: '26px', fontWeight: 800, color: bg }}>{value}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Traffic by Location + Patient Volume */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Donut — Traffic by Location */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Traffic by Location</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={trafficData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                          {trafficData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {trafficData.map(d => (
                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: '#475569' }}>{d.name}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginLeft: 'auto' }}>{d.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bar — Patient Volume */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Patient Volume</h3>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['Daily', 'Weekly', 'Monthly'].map(t => (
                        <button
                          key={t}
                          onClick={() => setVolumeTab(t)}
                          style={{
                            padding: '3px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                            background: volumeTab === t ? BLUE : '#f1f5f9',
                            color:      volumeTab === t ? '#fff' : '#64748b',
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={volumeDataMap[volumeTab]} barSize={18}>
                      <XAxis dataKey="d" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                      <Bar dataKey="v" fill={BLUE2} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Doctors Profile */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Doctors Profile</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {doctorsPlaceholder.map(d => (
                    <div
                      key={d.name}
                      style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                    >
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                        👨‍⚕️
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{d.name}</span>
                      <StatusBadge status={d.status} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Queue Statistics Bar Chart */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Queue Statistics</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={queueStatsData} barSize={28}>
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {queueStatsData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Patient History Table */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Patient History</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['Patient Name', 'Date', 'Service', 'Status'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {patientHistoryPlaceholder.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', color: '#1e293b', fontWeight: 500 }}>{r.name}</td>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>{r.date}</td>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>{r.service}</td>
                          <td style={{ padding: '10px 12px' }}><StatusBadge status={r.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Account Management */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Account Management</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {['Patient', 'Doctor'].map(t => (
                    <button
                      key={t}
                      onClick={() => setAccountTab(t)}
                      style={{
                        padding: '8px 22px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                        background: accountTab === t ? BLUE : '#f1f5f9',
                        color:      accountTab === t ? '#fff' : '#64748b',
                        transition: 'all 0.15s',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <StaffManager accountTab={accountTab} />
              </div>

              {/* Notifications Placeholder */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Notifications</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notificationsPlaceholder.map(n => (
                    <div
                      key={n.id}
                      style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                        🔔
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{n.title}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{n.body}</p>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0, alignSelf: 'flex-start' }}>{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ════════ QUEUE MONITOR ════════ */}
          {activeTab === 'queuemonitor' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Queue Monitor</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Live queue monitoring — coming soon.</p>
            </div>
          )}

          {/* ════════ STATISTICS / ANALYTICS ════════ */}
          {activeTab === 'reports' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Statistics & Analytics</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Descriptive and predictive analytics — coming soon.</p>
            </div>
          )}

          {/* ════════ DOCTORS ════════ */}
          {activeTab === 'doctors' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Doctors</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Doctor availability tracking — coming soon.</p>
            </div>
          )}

          {/* ════════ PATIENTS HISTORY ════════ */}
          {activeTab === 'patientshistory' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Patients History</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Full patient history — coming soon.</p>
            </div>
          )}

          {/* ════════ NOTIFICATIONS ════════ */}
          {activeTab === 'notifications' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Notifications</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notificationsPlaceholder.map(n => (
                  <div
                    key={n.id}
                    style={{ display: 'flex', gap: '12px', padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px' }}>
                      🔔
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{n.title}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{n.body}</p>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0, alignSelf: 'flex-start' }}>{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════ ACCOUNTS / STAFF ════════ */}
          {activeTab === 'staff' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Account Management</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['Patient', 'Doctor'].map(t => (
                  <button
                    key={t}
                    onClick={() => setAccountTab(t)}
                    style={{
                      padding: '8px 22px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                      background: accountTab === t ? BLUE : '#f1f5f9',
                      color:      accountTab === t ? '#fff' : '#64748b',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <StaffManager accountTab={accountTab} />
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
