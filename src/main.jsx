import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './lib/i18n/LanguageContext.jsx'
import NotifyHost from './components/NotifyHost.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
        <NotifyHost />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
