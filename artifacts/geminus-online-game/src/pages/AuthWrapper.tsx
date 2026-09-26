import { useState, useEffect } from 'react'
import { auth, db } from '../firebase/index'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import Login from './Login'
import SignUp from './SignUp'
import RaceSelect from './RaceSelect'

interface Props {
  children: (uid: string) => React.ReactNode
}

export default function AuthWrapper({ children }: Props) {
  const [authState, setAuthState] = useState<'loading' | 'logged-out' | 'needs-race' | 'logged-in'>('loading')
  const [screen, setScreen] = useState<'login' | 'signup'>('login')
  const [pendingUser, setPendingUser] = useState<{ uid: string; username: string } | null>(null)
  const [loggedInUid, setLoggedInUid] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthState('logged-out')
        setLoggedInUid(null)
        setPendingUser(null)
        return
      }
      try {
        const snap = await getDoc(doc(db, 'players', user.uid))
        if (snap.exists() && snap.data().raceSelected) {
          setLoggedInUid(user.uid)
          setAuthState('logged-in')
        } else {
          const username = (snap.exists() && snap.data().name)
            ? snap.data().name
            : user.displayName || user.email?.split('@')[0] || 'Pilot'
          setPendingUser({ uid: user.uid, username })
          setAuthState('needs-race')
        }
      } catch {
        setPendingUser({ uid: user.uid, username: user.email?.split('@')[0] || 'Pilot' })
        setAuthState('needs-race')
      }
    })
    return () => unsub()
  }, [])

  // ── LOADING ──
  if (authState === 'loading') {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 8%, #143044 0%, #0a1a26 38%, #03080c 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#3EE0FF', letterSpacing: '0.14em', margin: '0 0 12px', textShadow: '0 0 40px rgba(62,224,255,0.6)' }}>GEMINUS</h1>
          <div style={{ fontSize: '12px', color: '#64748b', letterSpacing: '0.1em' }}>Loading...</div>
        </div>
      </div>
    )
  }

  // ── NOT LOGGED IN ──
  if (authState === 'logged-out') {
    if (screen === 'signup') return <SignUp onSwitchToLogin={() => setScreen('login')} />
    return <Login onSwitchToSignUp={() => setScreen('signup')} />
  }

  // ── NEEDS RACE SELECT ──
  if (authState === 'needs-race' && pendingUser) {
    return <RaceSelect username={pendingUser.username} userId={pendingUser.uid} />
  }

  // ── GAME ── only renders when logged-in AND uid is confirmed
  if (authState === 'logged-in' && loggedInUid) {
    return <>{children(loggedInUid)}</>
  }

  // Fallback — should never reach here
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '16px',
      background: 'radial-gradient(circle at 50% 8%, #143044 0%, #0a1a26 38%, #03080c 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
    }}>
      <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#3EE0FF', letterSpacing: '0.14em', margin: 0 }}>GEMINUS</h1>
      <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Something went wrong.</p>
      <button onClick={() => signOut(auth).then(() => window.location.replace(window.location.origin))}
        style={{ padding: '10px 24px', borderRadius: '8px', background: 'rgba(255,55,95,0.1)', border: '1px solid rgba(255,55,95,0.3)', color: '#f87171', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
        Sign Out
      </button>
    </div>
  )
}
