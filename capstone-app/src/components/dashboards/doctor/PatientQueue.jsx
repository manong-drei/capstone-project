import Icon from '../../common/AppIcons'
import { QUEUE_STATUS } from '../../../constants/services'

const statusColors = {
  [QUEUE_STATUS.WAITING]: { color: '#2d3a8c', bg: '#eef2ff', label: 'Waiting' },
  [QUEUE_STATUS.SERVING]: { color: '#059669', bg: '#d1fae5', label: 'Serving' },
  [QUEUE_STATUS.DONE]:    { color: '#6b7280', bg: '#f3f4f6', label: 'Done' },
}

/**
 * PatientQueue
 * Displays the full queue list for the doctor to manage.
 *
 * Props:
 *   queues      — array of queue objects
 *   onCallNext  — calls the next patient
 *   onMarkDone  — marks a queue as done
 *   loading     — shows loading state
 */
export default function PatientQueue({ queues = [], onCallNext, onMarkDone, loading = false }) {
  const waiting = queues.filter(q => q.status === QUEUE_STATUS.WAITING)
  const serving = queues.filter(q => q.status === QUEUE_STATUS.SERVING)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Call Next Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2d3a8c 0%, #4f46e5 100%)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
            {serving.length > 0 ? `Now Serving: ${serving[0]?.queue_number}` : 'No patient currently being served'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#c7d2fe' }}>
            {waiting.length} patient{waiting.length !== 1 ? 's' : ''} waiting
          </p>
        </div>
        <button
          onClick={onCallNext}
          disabled={waiting.length === 0 || loading}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: waiting.length === 0 ? 'rgba(255,255,255,0.15)' : '#f97316',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: waiting.length === 0 || loading ? 'not-allowed' : 'pointer',
            opacity: waiting.length === 0 ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          Call Next Patient
        </button>
      </div>

      {/* Queue Table */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 90px 120px 100px',
            padding: '12px 20px',
            borderBottom: '1px solid #f3f4f6',
            background: '#f9fafb',
          }}
        >
          {['No.', 'Services', 'Type', 'Status', 'Action'].map(h => (
            <span key={h} style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {queues.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
            No patients in queue today.
          </div>
        ) : (
          queues.map((q) => {
            const s = statusColors[q.status] ?? statusColors[QUEUE_STATUS.WAITING]
            return (
              <div
                key={q.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 90px 120px 100px',
                  padding: '14px 20px',
                  borderBottom: '1px solid #f9fafb',
                  alignItems: 'center',
                }}
              >
                {/* Number */}
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                  {q.queue_number}
                </span>

                {/* Services */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(q.services ?? []).slice(0, 2).map((sv, i) => (
                    <span key={i} style={{ fontSize: '11px', background: '#f3f4f6', borderRadius: '4px', padding: '2px 6px', color: '#374151' }}>
                      {typeof sv === 'object' ? sv.label : sv}
                    </span>
                  ))}
                  {q.services?.length > 2 && (
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>+{q.services.length - 2} more</span>
                  )}
                </div>

                {/* Type */}
                <span style={{ fontSize: '12px', fontWeight: 500, color: q.type === 'priority' ? '#f97316' : '#2d3a8c' }}>
                  {q.type === 'priority' ? 'Priority' : 'Regular'}
                </span>

                {/* Status */}
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    fontSize: '12px', fontWeight: 500,
                    color: s.color, background: s.bg,
                    borderRadius: '20px', padding: '3px 10px',
                    width: 'fit-content',
                  }}
                >
                  {s.label}
                </span>

                {/* Action */}
                {q.status === QUEUE_STATUS.SERVING && (
                  <button
                    onClick={() => onMarkDone(q.id)}
                    style={{
                      padding: '5px 12px', borderRadius: '8px', border: 'none',
                      background: '#d1fae5', color: '#059669',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Mark Done
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
