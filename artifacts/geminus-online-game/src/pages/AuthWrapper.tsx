import { useState, useEffect } from 'react'
import { auth, db } from '../firebase/index'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import Login from './Login'
import SignUp from './SignUp'

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<'loading' | 'logged-out' | 'logged-in' | 'needs-race'>('loading')
  const [screen, setScreen] = useState<'login' | 'signup'>('login')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthState('logged-out')
        return
      }
      // Check if player has completed race selection
      try {
        const snap = await getDoc(doc(db, 'players', user.uid))
        if (snap.exists() && snap.data().raceSelected) {
          setAuthState('logged-in')
        } else {
          setAuthState('needs-race')
        }
      } catch {
        setAuthState('logged-in')
      }
    })
    return () => unsub()
  }, [])

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

  if (authState === 'logged-out') {
    if (screen === 'signup') return <SignUp onSwitchToLogin={() => setScreen('login')} />
    return <Login onSwitchToSignUp={() => setScreen('signup')} />
  }

  // logged-in or needs-race — both show the game (race select handles itself via Firestore)
  return <>{children}</>
}
