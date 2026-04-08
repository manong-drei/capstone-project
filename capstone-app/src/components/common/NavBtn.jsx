import Icon from './AppIcons'

/**
 * NavBtn
 * Navigation button used in the sidebar (desktop) and bottom bar (mobile).
 *
 * Props:
 *   icon    — icon name from AppIcons
 *   label   — button label
 *   active  — whether this is the current page
 *   onClick — click handler
 *   color   — active accent color (defaults to indigo)
 */
export default function NavBtn({ icon, label, active = false, onClick, color = '#4f46e5' }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '10px 14px',
        borderRadius: '10px',
        border: 'none',
        background: active ? `${color}15` : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f3f4f6' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <Icon name={icon} size={20} color={active ? color : '#6b7280'} />
      <span
        style={{
          fontSize: '14px',
          fontWeight: active ? 600 : 400,
          color: active ? color : '#374151',
        }}
      >
        {label}
      </span>
    </button>
  )
}
