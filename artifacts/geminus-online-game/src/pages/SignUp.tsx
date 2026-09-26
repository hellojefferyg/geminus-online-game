import { useState } from 'react'
import { auth } from '../firebase/index'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import RaceSelect from './RaceSelect'

export default function SignUp({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [step, setStep] = useState<'account' | 'race'>('account')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [firebaseUser, setFirebaseUser] = useState<any>(null)

  const handleAccountSubmit = async () => {
    setError('')
    if (!username.trim()) return setError('Username is required.')
    if (username.trim().length < 3) return setError('Username must be at least 3 characters.')
    if (!email.trim()) return setError('Email is required.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      setFirebaseUser(cred.user)
      setStep('race')
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

  if (step === 'race') {
    return <RaceSelect username={username.trim()} userId={firebaseUser?.uid} />
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
          <div style={{ fontSize: '11px', color: '#1e3a4a', letterSpacing: '0.2em', marginBottom: '8px' }}>Geminus</div>
          <h1 style={{ fontSize: '38px', fontWeight: 900, color: '#3EE0FF', letterSpacing: '0.14em', margin: 0, textShadow: '0 0 40px rgba(62,224,255,0.6), 0 0 80px rgba(62,224,255,0.2)' }}>GEMINUS</h1>
          <p style={{ fontSize: '11px', color: '#64748b', letterSpacing: '0.15em', margin: '6px 0 0' }}>ONLINE GAME</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#3EE0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#000' }}>1</div>
            <span style={{ fontSize: '11px', color: '#3EE0FF', fontWeight: 600 }}>Account</span>
          </div>
          <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(62,224,255,0.15)', border: '1px solid rgba(62,224,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>2</div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Choose Race</span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(3,12,20,0.82)', border: '1px solid rgba(62,224,255,0.42)',
          borderRadius: '18px', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '16px',
          boxShadow: 'inset 0 1px 1.5px 0 rgba(62,224,255,0.38), 0 8px 32px rgba(0,0,0,0.92)',
        }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff', textAlign: 'center' }}>Create Your Account</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>IN-GAME USERNAME</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="YourGameName" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleAccountSubmit()} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleAccountSubmit()} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleAccountSubmit()} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>CONFIRM PASSWORD</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleAccountSubmit()} />
          </div>

          {error && <p style={{ margin: 0, fontSize: '12px', color: '#f87171', textAlign: 'center', lineHeight: 1.4 }}>{error}</p>}

          <button onClick={handleAccountSubmit} disabled={loading} style={{
            width: '100%', padding: '13px', borderRadius: '10px',
            border: '1.5px solid rgba(62,224,255,0.85)',
            background: 'linear-gradient(180deg, #12232d 0%, #060c10 100%)',
            color: '#e8fbff', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.06em', boxShadow: '0 0 16px rgba(62,224,255,0.4)',
            opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
          }}>
            {loading ? 'Creating account...' : 'NEXT — CHOOSE YOUR RACE →'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Already have an account?{' '}
              <button onClick={onSwitchToLogin}
                style={{ background: 'none', border: 'none', color: '#3EE0FF', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}>
                Sign In
              </button>
            </span>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '10px', color: '#1e3a4a', margin: 0, letterSpacing: '0.05em' }}>
          Coming Soon · Geminus Online Game · Beta
        </p>
      </div>
    </div>
  )
}
