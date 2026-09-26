import { useState, useEffect } from 'react'
import { auth, db } from '../firebase/index'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import Login from './Login'
import SignUp from './SignUp'
import RaceSelect from './RaceSelect'

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<'loading' | 'logged-out' | 'needs-race' | 'logged-in'>('loading')
  const [screen, setScreen] = useState<'login' | 'signup'>('login')
  const [pendingUser, setPendingUser] = useState<{ uid: string; username: string } | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthState('logged-out')
        setPendingUser(null)
        return
      }
      try {
        const snap = await getDoc(doc(db, 'players', user.uid))
        if (snap.exists() && snap.data().raceSelected) {
          setAuthState('logged-in')
        } else {
          // No player doc or raceSelected not true — send to RaceSelect to create it
          const username = (snap.exists() && snap.data().name)
            ? snap.data().name
            : user.displayName || user.email?.split('@')[0] || 'Pilot'
          setPendingUser({ uid: user.uid, username })
          setAuthState('needs-race')
        }
      } catch {
        // Firestore read failed — send to race select to be safe
        setPendingUser({ uid: user.uid, username: user.email?.split('@')[0] || 'Pilot' })
        setAuthState('needs-race')
      }
    })
    return () => unsub()
  }, [])

  // Loading splash
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

  // Not logged in — show Login or SignUp
  if (authState === 'logged-out') {
    if (screen === 'signup') return <SignUp onSwitchToLogin={() => setScreen('login')} />
    return <Login onSwitchToSignUp={() => setScreen('signup')} />
  }

  // Logged in but race not selected — show RaceSelect
  // RaceSelect writes to Firestore with raceSelected:true → onAuthStateChanged fires again → logged-in
  if (authState === 'needs-race' && pendingUser) {
    return <RaceSelect username={pendingUser.username} userId={pendingUser.uid} />
  }

  // Fully authenticated — render the game
  return <>{children}</>
}
