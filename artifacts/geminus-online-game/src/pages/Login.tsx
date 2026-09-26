import { useState } from 'react'
import { auth } from '../firebase/index'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'

export default function Login({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const [mode, setMode] = useState<'signin' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(''); setMessage(''); setLoading(true)
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await sendPasswordResetEmail(auth, email)
        setMessage('Reset email sent — check your inbox.')
      }
    } catch (e: any) {
      setError(e.message.replace('Firebase: ', '').replace(/\(auth.*\)\.?/, '').trim())
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(0,8,14,0.7)',
    border: '1px solid rgba(62,224,255,0.32)',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.1em',
  }

  return (
    <div style={{
      minHeight: '100dvh', width: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
      background: 'radial-gradient(circle at 50% 8%, #143044 0%, #0a1a26 38%, #03080c 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#1e3a4a', letterSpacing: '0.2em', marginBottom: '8px' }}>JUUGBOYTV PRESENTS</div>
          <h1 style={{ fontSize: '38px', fontWeight: 900, color: '#3EE0FF', letterSpacing: '0.14em', margin: 0, textShadow: '0 0 40px rgba(62,224,255,0.6), 0 0 80px rgba(62,224,255,0.2)' }}>GEMINUS</h1>
          <p style={{ fontSize: '11px', color: '#64748b', letterSpacing: '0.15em', margin: '6px 0 0' }}>ONLINE GAME</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(3,12,20,0.82)',
          border: '1px solid rgba(62,224,255,0.42)',
          borderRadius: '18px',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'inset 0 1px 1.5px 0 rgba(62,224,255,0.38), 0 8px 32px rgba(0,0,0,0.92), 0 0 60px rgba(62,224,255,0.06)',
        }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff', textAlign: 'center' }}>
            {mode === 'signin' ? 'Welcome Back' : 'Reset Password'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          {mode === 'signin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
          )}

          {error && <p style={{ margin: 0, fontSize: '12px', color: '#f87171', textAlign: 'center', lineHeight: 1.4 }}>{error}</p>}
          {message && <p style={{ margin: 0, fontSize: '12px', color: '#30D158', textAlign: 'center' }}>{message}</p>}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', padding: '13px', borderRadius: '10px',
            border: '1.5px solid rgba(62,224,255,0.85)',
            background: 'linear-gradient(180deg, #12232d 0%, #060c10 100%)',
            color: '#e8fbff', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.06em', boxShadow: '0 0 16px rgba(62,224,255,0.4)',
            opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
          }}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'SIGN IN' : 'SEND RESET EMAIL'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
            {mode === 'signin' ? <>
              <button onClick={() => { setMode('reset'); setError('') }}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>
                Forgot password?
              </button>
              <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                New to Geminus?{' '}
                <button onClick={onSwitchToSignUp}
                  style={{ background: 'none', border: 'none', color: '#3EE0FF', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}>
                  Create Account
                </button>
              </span>
            </> : (
              <button onClick={() => { setMode('signin'); setError(''); setMessage('') }}
                style={{ background: 'none', border: 'none', color: '#3EE0FF', fontSize: '12px', cursor: 'pointer' }}>
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '10px', color: '#1e3a4a', margin: 0, letterSpacing: '0.05em' }}>
          JuugBoyTV · Geminus Online Game · Beta
        </p>
      </div>
    </div>
  )
}
