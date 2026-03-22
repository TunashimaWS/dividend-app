import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Sync dark mode with iOS/system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.classList.toggle('dark', prefersDark)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  document.documentElement.classList.toggle('dark', e.matches)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
