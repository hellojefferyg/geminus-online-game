import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import AuthWrapper from './pages/AuthWrapper'
import GodEditor from './admin/GodEditor'

const isAdmin = window.location.pathname.replace(/\/+$/, '').endsWith('/admin')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthWrapper>
      {(uid) => (isAdmin ? <GodEditor uid={uid} /> : <App uid={uid} />)}
    </AuthWrapper>
  </StrictMode>,
)
