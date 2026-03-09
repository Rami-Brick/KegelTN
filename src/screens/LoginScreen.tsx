import { useState } from 'react'
import { loginWithAccessKey } from '../services/auth'

interface Props {
  onLogin: () => void
}

export default function LoginScreen({ onLogin }: Props) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!key.trim()) return
    setLoading(true)
    setError('')
    try {
      await loginWithAccessKey(key.trim())
      onLogin()
    } catch (e) {
      setError('Invalid access key. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">💪</div>
        <h1 className="login-title">Kegel Pro</h1>
        <p className="login-subtitle">Enter your access key to continue</p>

        <div className="login-form">
          <input
            className="login-input"
            type="text"
            placeholder="Enter your access key"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          {error && <p className="login-error">{error}</p>}
          <button
            className="login-button"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Access My Program'}
          </button>
        </div>
      </div>
    </div>
  )
}