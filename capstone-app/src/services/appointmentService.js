import api from './api'

export const createAppointment      = (payload)  => api.post('/appointments',             payload)
export const getMyAppointments      = ()         => api.get('/appointments/me')
export const getDoctorAppointments  = ()         => api.get('/appointments/doctor')
export const getAllAppointments     = (params, signal) => api.get('/appointments', { params, signal })
export const updateAppointment      = (id, data) => api.patch(`/appointments/${id}`,      data)
export const cancelAppointment      = (id)       => api.patch(`/appointments/${id}/cancel`)
