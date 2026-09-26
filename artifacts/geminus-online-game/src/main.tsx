import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import AuthWrapper from './pages/AuthWrapper'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthWrapper>
      {(uid) => <App uid={uid} />}
    </AuthWrapper>
  </StrictMode>,
)
