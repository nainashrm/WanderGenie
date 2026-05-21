'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('wg_access_token')
    const saved = localStorage.getItem('wg_user')
    if (token && saved) {
      try { setUser(JSON.parse(saved)) } catch { clearAuth() }
    }
    setLoading(false)
  }, [])

  function clearAuth() {
    localStorage.removeItem('wg_access_token')
    localStorage.removeItem('wg_refresh_token')
    localStorage.removeItem('wg_user')
    setUser(null)
  }

  function saveAuth(data) {
    localStorage.setItem('wg_access_token',  data.accessToken)
    localStorage.setItem('wg_refresh_token', data.refreshToken)
    localStorage.setItem('wg_user',          JSON.stringify(data.user))
    setUser(data.user)
  }

  async function register(name, email, password) {
    const res  = await fetch(`${BASE_URL}/api/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Registration failed')
    saveAuth(json.data)
    return json.data.user
  }

  async function login(email, password) {
    const res  = await fetch(`${BASE_URL}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Login failed')
    saveAuth(json.data)
    return json.data.user
  }

  async function logout() {
    const token = localStorage.getItem('wg_access_token')
    if (token) {
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    clearAuth()
  }

  async function updateProfile(updates) {
    const token = localStorage.getItem('wg_access_token')
    const res   = await fetch(`${BASE_URL}/api/auth/me`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify(updates),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Update failed')
    const updated = json.data.user
    localStorage.setItem('wg_user', JSON.stringify(updated))
    setUser(updated)
    return updated
  }

  async function changePassword(currentPassword, newPassword) {
    const token = localStorage.getItem('wg_access_token')
    const res   = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ currentPassword, newPassword }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Password change failed')
    return true
  }

  async function getMyTrips() {
    const token = localStorage.getItem('wg_access_token')
    const res   = await fetch(`${BASE_URL}/api/trips`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Failed to fetch trips')
    return json.data.trips || []
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateProfile, changePassword, getMyTrips }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}