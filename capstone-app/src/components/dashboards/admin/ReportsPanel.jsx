import { useState, useEffect } from 'react'
import StatCard from '../../common/StatCard'
import api from '../../../services/api'
import { QUEUE_STATUS } from '../../../constants/services'

/**
 * ReportsPanel
 * Shows daily queue statistics and a service breakdown for the admin.
 */
export default function ReportsPanel() {
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [date,    setDate]    = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => { fetchReport() }, [date])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/admin/reports?date=${date}`)
      setReport(data)
    } catch {
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  const stats = report
    ? [
        { icon: 'users',       label: 'Total Patients',   value: report.total ?? 0,                           color: '#4f46e5' },
        { icon: 'checkCircle', label: 'Completed',        value: report.done ?? 0,                            color: '#059669' },
        { icon: 'clock',       label: 'Waiting',          value: report.waiting ?? 0,                         color: '#2d3a8c' },
        { icon: 'star',        label: 'Priority Served',  value: report.priority ?? 0,                        color: '#f97316' },
      ]
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header + Date Picker */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>Daily Reports</h2>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
            Queue and service summary for the selected date
          </p>
        </div>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={e => setDate(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: '10px',
            border: '1.5px solid #e5e7eb', fontSize: '14px',
            color: '#111827', background: '#fafafa',
            outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        />
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
          Loading report...
        </div>
      ) : !report ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
          No data available for this date.
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
            {stats.map(s => (
              <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={s.color} />
            ))}
          </div>

          {/* Service Breakdown */}
          {report.byService?.length > 0 && (
            <div
              style={{
                background: '#ffffff', border: '1px solid #e5e7eb',
                borderRadius: '14px', overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                  Patients by Service
                </h3>
              </div>
              {report.byService.map((item, i) => {
                const pct = report.total > 0 ? Math.round((item.count / report.total) * 100) : 0
                return (
                  <div
                    key={i}
                    style={{
                      padding: '14px 20px',
                      borderBottom: i < report.byService.length - 1 ? '1px solid #f9fafb' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#374151' }}>{item.service}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                        {item.count} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({pct}%)</span>
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: '#4f46e5',
                          borderRadius: '3px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Queue Status Breakdown */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
            }}
          >
            {[
              { label: 'Waiting',   count: report.waiting,   color: '#2d3a8c', bg: '#eef2ff' },
              { label: 'Serving',   count: report.serving,   color: '#059669', bg: '#d1fae5' },
              { label: 'Completed', count: report.done,      color: '#6b7280', bg: '#f3f4f6' },
              { label: 'Cancelled', count: report.cancelled, color: '#dc2626', bg: '#fee2e2' },
            ].map(({ label, count, color, bg }) => (
              <div
                key={label}
                style={{
                  background: bg, borderRadius: '12px',
                  padding: '16px', textAlign: 'center',
                }}
              >
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color }}>{count ?? 0}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color, opacity: 0.8 }}>{label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
