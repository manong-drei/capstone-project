import axios from 'axios'
import { QUEUE_UPDATES_CHANNEL } from '@/constants/queue'

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
  (res) => {
    if (['post', 'put', 'patch', 'delete'].includes(res.config.method) && /^\/queue(?:[/?]|$)/.test(res.config.url)) {
      try {
        const updates = new BroadcastChannel(QUEUE_UPDATES_CHANNEL)
        updates.postMessage('changed')
        updates.close()
      } catch { /* The monitor still polls when browser messaging is unavailable. */ }
    }
    return res.data
  },
  (err)  => {
    const message = err.response?.data?.message || 'Something went wrong. Please try again.'
    return Promise.reject(new Error(message))
  }
)

export default api
