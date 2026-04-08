import Icon from './AppIcons'

/**
 * ActionCard
 * A large clickable card for primary dashboard actions.
 *
 * Props:
 *   icon        — icon name from AppIcons
 *   title       — action title
 *   description — one-line description
 *   onClick     — click handler
 *   color       — accent color
 *   disabled    — disables the card
 */
export default function ActionCard({ icon, title, description, onClick, color = '#4f46e5', disabled = false }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: '#ffffff',
        border: `1px solid ${disabled ? '#e5e7eb' : color}22`,
        borderRadius: '14px',
        padding: '20px',
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: '100%',
        transition: 'box-shadow 0.15s, transform 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = `0 4px 16px ${color}22`
          e.currentTarget.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          backgroundColor: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={22} color={color} />
      </div>

      {/* Text */}
      <div>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>{title}</p>
        <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#6b7280' }}>{description}</p>
      </div>
    </button>
  )
}
