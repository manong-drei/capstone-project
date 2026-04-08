import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on first load
  useEffect(() => {
    try {
      const storedUser  = localStorage.getItem('ek_user')
      const storedToken = localStorage.getItem('ek_token')
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      }
    } catch {
      // Corrupted storage — clear it
      localStorage.removeItem('ek_user')
      localStorage.removeItem('ek_token')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('ek_user',  JSON.stringify(userData))
    localStorage.setItem('ek_token', authToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('ek_user')
    localStorage.removeItem('ek_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
