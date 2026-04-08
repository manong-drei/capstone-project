import api from './api'

export const createAppointment  = (payload)  => api.post('/appointments',             payload)
export const getMyAppointments  = ()         => api.get('/appointments/me')
export const getAllAppointments  = ()         => api.get('/appointments')
export const updateAppointment  = (id, data) => api.patch(`/appointments/${id}`,      data)
export const cancelAppointment  = (id)       => api.patch(`/appointments/${id}/cancel`)
