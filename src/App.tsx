import { useEffect, useState } from 'react'
import { getSession, getProfile } from './services/auth'
import LoginScreen from './screens/LoginScreen'
import type { Profile } from './types/index'

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const session = await getSession()
      if (session) {
        const p = await getProfile()
        setProfile(p)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin() {
    const p = await getProfile()
    setProfile(p)
  }

  if (loading) return <div className="splash">Loading...</div>

  if (!profile) return <LoginScreen onLogin={handleLogin} />

  return (
    <div>
      <h1>Welcome, {profile.full_name}</h1>
      <p>Your program: {profile.program}</p>
    </div>
  )
}