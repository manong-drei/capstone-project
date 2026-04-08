import Icon from './AppIcons'

/**
 * StatCard
 * Displays a single metric with an icon, label, and value.
 *
 * Props:
 *   icon     — icon name from AppIcons
 *   label    — short description e.g. "Patients Today"
 *   value    — the number or text to display
 *   color    — accent color (defaults to indigo)
 *   subtext  — optional smaller note below the value
 */
export default function StatCard({ icon, label, value, color = '#4f46e5', subtext }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Icon badge */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={20} color={color} />
      </div>

      {/* Text */}
      <div>
        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: '26px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
          {value}
        </p>
        {subtext && (
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>{subtext}</p>
        )}
      </div>
    </div>
  )
}
