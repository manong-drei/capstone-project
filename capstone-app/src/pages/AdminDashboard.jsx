import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../hooks/useAuth'
import { ROUTES }      from '../constants/routes'

import NavBtn       from '../components/common/NavBtn'
import StatCard     from '../components/common/StatCard'
import StaffManager from '../components/dashboards/admin/StaffManager'
import ReportsPanel from '../components/dashboards/admin/ReportsPanel'
import api          from '../services/api'

const INDIGO = '#4f46e5'
const ORANGE = '#f97316'
const NAVY   = '#2d3a8c'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [activeTab, setActiveTab] = useState('overview')
  const [overview,  setOverview]  = useState(null)
  const [ovLoading, setOvLoading] = useState(true)

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
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex' }}>

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: '220px', flexShrink: 0,
          background: '#ffffff',
          borderRight: '1px solid #f3f4f6',
          padding: '24px 12px',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
        }}
      >
        <div style={{ padding: '0 8px', marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: NAVY }}>E-KALUSUGAN</h1>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>Admin Portal</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <NavBtn icon="home"   label="Overview"    active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} color={INDIGO} />
          <NavBtn icon="users"  label="Staff"       active={activeTab === 'staff'}    onClick={() => setActiveTab('staff')}    color={INDIGO} />
          <NavBtn icon="chart"  label="Reports"     active={activeTab === 'reports'}  onClick={() => setActiveTab('reports')}  color={INDIGO} />
        </nav>

        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
          <div style={{ padding: '0 8px', marginBottom: '8px' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#111827' }}>
              {user?.first_name} {user?.last_name}
            </p>
            <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#9ca3af' }}>Administrator</p>
          </div>
          <NavBtn icon="logout" label="Logout" onClick={handleLogout} color="#dc2626" />
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: '28px 24px', maxWidth: '1000px' }}>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Header Banner */}
            <div
              style={{
                background: `linear-gradient(135deg, ${NAVY} 0%, ${INDIGO} 100%)`,
                borderRadius: '20px', padding: '28px',
              }}
            >
              <p style={{ margin: '0 0 2px', fontSize: '13px', color: '#c7d2fe' }}>Admin Panel</p>
              <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.first_name}!
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#a5b4fc' }}>
                {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Live Stats */}
            <div>
              <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 600, color: '#374151' }}>
                Live Overview — Today
              </h3>
              {ovLoading ? (
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading...</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                  <StatCard icon="users"       label="Total Patients"  value={overview?.totalPatients  ?? 0} color={NAVY}    />
                  <StatCard icon="queue"        label="Active Queues"   value={overview?.activeQueues   ?? 0} color={INDIGO}  />
                  <StatCard icon="checkCircle"  label="Done Today"      value={overview?.doneToday      ?? 0} color="#059669" />
                  <StatCard icon="star"         label="Priority Served" value={overview?.priorityServed ?? 0} color={ORANGE}  />
                  <StatCard icon="users"        label="Doctors On-Duty" value={overview?.doctorsOnDuty  ?? 0} color="#0891b2" />
                  <StatCard icon="appointment"  label="Appointments"    value={overview?.appointments   ?? 0} color={ORANGE}  />
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 600, color: '#374151' }}>
                Quick Actions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {[
                  { label: 'Manage Staff',  tab: 'staff',   color: INDIGO, icon: 'users'  },
                  { label: 'View Reports',  tab: 'reports', color: ORANGE, icon: 'chart'  },
                ].map(({ label, tab, color, icon }) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '18px',
                      borderRadius: '14px',
                      border: `1px solid ${color}22`,
                      background: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'box-shadow 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 16px ${color}22`}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
                  >
                    <div
                      style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: `${color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>
                        {icon === 'users' ? '👥' : '📊'}
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && <StaffManager />}

        {/* Reports Tab */}
        {activeTab === 'reports' && <ReportsPanel />}

      </main>
    </div>
  )
}
