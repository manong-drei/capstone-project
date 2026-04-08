import { useState, useEffect } from 'react'
import Icon from '../../common/AppIcons'
import api from '../../../services/api'

const ROLES = ['doctor', 'admin']

/**
 * StaffManager
 * Admin panel for viewing, adding, and deactivating staff accounts.
 */
export default function StaffManager() {
  const [staff,      setStaff]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [formError,  setFormError]  = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    first_name: '',
    last_name:  '',
    email:      '',
    password:   '',
    role:       'doctor',
  })

  useEffect(() => { fetchStaff() }, [])

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const data = await api.get('/admin/staff')
      setStaff(data?.staff ?? [])
    } catch {
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAddStaff = async () => {
    setFormError('')
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setFormError('All fields are required.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/admin/staff', form)
      setShowForm(false)
      setForm({ first_name: '', last_name: '', email: '', password: '', role: 'doctor' })
      fetchStaff()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this staff account?')) return
    try {
      await api.patch(`/admin/staff/${id}/deactivate`)
      fetchStaff()
    } catch (err) {
      alert(err.message)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '14px',
    color: '#111827',
    background: '#fafafa',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>Staff Management</h2>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
            Manage doctor and admin accounts
          </p>
        </div>
        <button
          onClick={() => setShowForm(prev => !prev)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 16px', borderRadius: '10px', border: 'none',
            background: '#4f46e5', color: '#ffffff',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Icon name="plus" size={16} color="#ffffff" />
          Add Staff
        </button>
      </div>

      {/* Add Staff Form */}
      {showForm && (
        <div
          style={{
            background: '#f9fafb', border: '1.5px solid #e5e7eb',
            borderRadius: '14px', padding: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#111827' }}>
            New Staff Account
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>First Name</label>
              <input
                style={inputStyle}
                value={form.first_name}
                onChange={e => handleChange('first_name', e.target.value)}
                placeholder="Juan"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Last Name</label>
              <input
                style={inputStyle}
                value={form.last_name}
                onChange={e => handleChange('last_name', e.target.value)}
                placeholder="Dela Cruz"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Email</label>
              <input
                type="email"
                style={inputStyle}
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="doctor@bago.gov.ph"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Password</label>
              <input
                type="password"
                style={inputStyle}
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                placeholder="Temporary password"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Role</label>
              <select
                style={inputStyle}
                value={form.role}
                onChange={e => handleChange('role', e.target.value)}
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#dc2626' }}>{formError}</p>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                flex: 1, padding: '9px', borderRadius: '8px',
                border: '1px solid #e5e7eb', background: 'transparent',
                fontSize: '13px', color: '#374151', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddStaff}
              disabled={submitting}
              style={{
                flex: 2, padding: '9px', borderRadius: '8px',
                border: 'none', background: '#4f46e5',
                fontSize: '13px', fontWeight: 600, color: '#ffffff',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </div>
      )}

      {/* Staff Table */}
      <div
        style={{
          background: '#ffffff', border: '1px solid #e5e7eb',
          borderRadius: '14px', overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 80px 90px',
            padding: '12px 20px', background: '#f9fafb',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          {['Name', 'Email', 'Role', 'Action'].map(h => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
            Loading staff...
          </div>
        ) : staff.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
            No staff accounts found.
          </div>
        ) : (
          staff.map((member) => (
            <div
              key={member.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 80px 90px',
                padding: '14px 20px', borderBottom: '1px solid #f9fafb',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                {member.first_name} {member.last_name}
              </span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>{member.email}</span>
              <span
                style={{
                  display: 'inline-flex', width: 'fit-content',
                  fontSize: '11px', fontWeight: 600,
                  padding: '3px 8px', borderRadius: '20px',
                  background: member.role === 'admin' ? '#fef3c7' : '#ede9fe',
                  color:      member.role === 'admin' ? '#92400e'  : '#5b21b6',
                }}
              >
                {member.role}
              </span>
              <button
                onClick={() => handleDeactivate(member.id)}
                style={{
                  padding: '5px 10px', borderRadius: '7px', border: 'none',
                  background: '#fee2e2', color: '#dc2626',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  width: 'fit-content',
                }}
              >
                Deactivate
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
