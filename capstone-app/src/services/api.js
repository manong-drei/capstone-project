import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ek_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Unwrap data and normalize errors
api.interceptors.response.use(
  (res)  => res.data,
  (err)  => {
    const message = err.response?.data?.message || 'Something went wrong. Please try again.'
    return Promise.reject(new Error(message))
  }
)

export default api
