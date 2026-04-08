import { useState, useEffect } from 'react'
import { useNavigate }   from 'react-router-dom'
import { useAuth }       from '../hooks/useAuth'
import { useQueue }      from '../hooks/useQueue'
import { ROUTES }        from '../constants/routes'
import { QUEUE_STATUS }  from '../constants/services'

import NavBtn            from '../components/common/NavBtn'
import StatCard          from '../components/common/StatCard'
import PatientQueue      from '../components/dashboards/doctor/PatientQueue'
import ConsultationModal from '../components/dashboards/doctor/ConsultationModal'
import api               from '../services/api'

const INDIGO = '#4f46e5'
const NAVY   = '#2d3a8c'

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { queues, loading, error, fetchAllQueues, callNext, updateStatus } = useQueue()

  const [activeTab,      setActiveTab]      = useState('queue')
  const [showConsultModal, setShowConsultModal] = useState(false)
  const [servingPatient,  setServingPatient]  = useState(null)
  const [consultLoading,  setConsultLoading]  = useState(false)

  useEffect(() => { fetchAllQueues() }, [])

  // Auto-refresh queue every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAllQueues, 30_000)
    return () => clearInterval(interval)
  }, [])

  const handleCallNext = async () => {
    try {
      const next = await callNext()
      setServingPatient(next)
      setShowConsultModal(true)
      fetchAllQueues()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleMarkDone = async (id) => {
    await updateStatus(id, QUEUE_STATUS.DONE)
    fetchAllQueues()
  }

  const handleSaveConsultation = async (notes) => {
    setConsultLoading(true)
    try {
      await api.post('/doctor/consultations', {
        queue_id: servingPatient?.id,
        ...notes,
      })
      setShowConsultModal(false)
      setServingPatient(null)
      fetchAllQueues()
    } catch (err) {
      alert(err.message)
    } finally {
      setConsultLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  const waiting   = queues.filter(q => q.status === QUEUE_STATUS.WAITING).length
  const serving   = queues.filter(q => q.status === QUEUE_STATUS.SERVING).length
  const done      = queues.filter(q => q.status === QUEUE_STATUS.DONE).length
  const priority  = queues.filter(q => q.type === 'priority').length

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
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>Doctor Portal</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <NavBtn icon="queue"   label="Patient Queue" active={activeTab === 'queue'}   onClick={() => setActiveTab('queue')}   color={INDIGO} />
          <NavBtn icon="chart"   label="Summary"       active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} color={INDIGO} />
        </nav>

        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
          <div style={{ padding: '0 8px', marginBottom: '8px' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#111827' }}>
              Dr. {user?.last_name}
            </p>
            <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#9ca3af' }}>Doctor</p>
          </div>
          <NavBtn icon="logout" label="Logout" onClick={handleLogout} color="#dc2626" />
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: '28px 24px', maxWidth: '960px' }}>

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                Patient Queue
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {error   && <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>}
            {loading && <p style={{ color: '#9ca3af', fontSize: '14px' }}>Refreshing queue...</p>}

            <PatientQueue
              queues={queues}
              onCallNext={handleCallNext}
              onMarkDone={handleMarkDone}
              loading={loading}
            />
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>
              Today's Summary
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
              <StatCard icon="users"       label="Waiting"   value={waiting}  color={NAVY}      />
              <StatCard icon="heart"       label="Serving"   value={serving}  color="#059669"   />
              <StatCard icon="checkCircle" label="Completed" value={done}     color="#6b7280"   />
              <StatCard icon="star"        label="Priority"  value={priority} color="#f97316"   />
            </div>
          </div>
        )}
      </main>

      {/* ── Consultation Modal ── */}
      <ConsultationModal
        isOpen={showConsultModal}
        onClose={() => setShowConsultModal(false)}
        onSubmit={handleSaveConsultation}
        patient={servingPatient}
        loading={consultLoading}
      />
    </div>
  )
}
