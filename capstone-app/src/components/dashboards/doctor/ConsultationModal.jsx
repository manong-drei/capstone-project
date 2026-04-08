import { useState } from 'react'
import Icon from '../../common/AppIcons'

/**
 * ConsultationModal
 * Allows a doctor to record notes, diagnosis, and prescription for a patient.
 *
 * Props:
 *   isOpen    — controls visibility
 *   onClose   — close handler
 *   onSubmit  — called with { notes, diagnosis, prescription }
 *   patient   — patient object { queue_number, name }
 *   loading   — disables submit while saving
 */
export default function ConsultationModal({ isOpen, onClose, onSubmit, patient, loading = false }) {
  const [notes,        setNotes]        = useState('')
  const [diagnosis,    setDiagnosis]    = useState('')
  const [prescription, setPrescription] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!notes.trim()) return
    onSubmit({ notes, diagnosis, prescription })
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1.5px solid #e5e7eb',
    fontSize: '14px',
    color: '#111827',
    background: '#fafafa',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '28px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>
              Consultation Notes
            </h2>
            {patient && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                Patient #{patient.queue_number} {patient.name ? `— ${patient.name}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6', border: 'none', borderRadius: '8px',
              width: '32px', height: '32px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="close" size={16} color="#6b7280" />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Consultation Notes <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Chief complaint, history, physical examination findings..."
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Diagnosis
            </label>
            <textarea
              rows={2}
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="Assessment / Diagnosis..."
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Prescription / Recommendations
            </label>
            <textarea
              rows={3}
              value={prescription}
              onChange={e => setPrescription(e.target.value)}
              placeholder="Medications, dosage, follow-up instructions..."
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', borderRadius: '12px',
              border: '1px solid #e5e7eb', background: 'transparent',
              fontSize: '14px', fontWeight: 500, color: '#374151', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!notes.trim() || loading}
            style={{
              flex: 2, padding: '12px', borderRadius: '12px',
              border: 'none',
              background: !notes.trim() ? '#e5e7eb' : '#4f46e5',
              color: !notes.trim() ? '#9ca3af' : '#ffffff',
              fontSize: '14px', fontWeight: 600,
              cursor: !notes.trim() || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Saving...' : 'Save Consultation'}
          </button>
        </div>
      </div>
    </div>
  )
}
