import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Use this tab's credentials so another tab's login cannot change its requests.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('ek_token')
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
