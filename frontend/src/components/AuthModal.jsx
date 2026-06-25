import { useState } from 'react'
import { login, register } from '../utils/auth'

function AuthModal({ onClose, onLogin }) {
  const [tab, setTab] = useState('login')       // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const reset = () => {
    setUsername('')
    setPassword('')
    setError(null)
    setSuccess(null)
  }

  const handleTabSwitch = (t) => {
    setTab(t)
    reset()
  }

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해 주세요.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      if (tab === 'login') {
        await login(username, password)
        onLogin(username)
        onClose()
      } else {
        await register(username, password)
        setSuccess('회원가입 완료! 로그인해 주세요.')
        setTab('login')
        setPassword('')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="auth-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>

        {/* 탭 */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('login')}
          >로그인</button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('register')}
          >회원가입</button>
        </div>

        {/* 입력 폼 */}
        <div className="auth-form">
          <input
            className="auth-input"
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="username"
          />
          <input
            className="auth-input"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          />

          {error && <p className="auth-error">⚠️ {error}</p>}
          {success && <p className="auth-success">✓ {success}</p>}

          <button
            className="auth-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '처리 중…' : tab === 'login' ? '로그인' : '회원가입'}
          </button>
        </div>

        {/* 닫기 */}
        <button className="auth-close-btn" onClick={onClose}>✕</button>
      </div>
    </div>
  )
}

export default AuthModal