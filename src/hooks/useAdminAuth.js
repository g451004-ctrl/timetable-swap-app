import { useState, useEffect, useCallback } from 'react'

const SESSION_KEY = 'timetable_admin_session'
const SESSION_TTL = 1000 * 60 * 60 * 4 // 4시간

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const session = sessionStorage.getItem(SESSION_KEY)
    if (session) {
      try {
        const { expiry } = JSON.parse(session)
        if (Date.now() < expiry) setIsAdmin(true)
        else sessionStorage.removeItem(SESSION_KEY)
      } catch {
        sessionStorage.removeItem(SESSION_KEY)
      }
    }
  }, [])

  const login = useCallback(async (password) => {
    setLoading(true)
    setError('')
    try {
      const hash = await sha256(password)
      const expectedHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH
      if (!expectedHash) {
        // 개발 환경: 비밀번호 'admin1234' 허용
        if (password === 'admin1234') {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expiry: Date.now() + SESSION_TTL }))
          setIsAdmin(true)
          return true
        }
      } else if (hash === expectedHash.toLowerCase()) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expiry: Date.now() + SESSION_TTL }))
        setIsAdmin(true)
        return true
      }
      setError('비밀번호가 올바르지 않습니다')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setIsAdmin(false)
  }, [])

  return { isAdmin, login, logout, loading, error }
}
