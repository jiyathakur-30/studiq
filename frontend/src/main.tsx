import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FocusAnalyticsProvider } from './context/FocusAnalyticsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FocusAnalyticsProvider>
      <App />
    </FocusAnalyticsProvider>
  </StrictMode>,
)