import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { initAppearance } from './lib/appearance'
import App from './App.jsx'
import FcmBootstrap from './components/FcmBootstrap.jsx'

initAppearance()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <FcmBootstrap />
      <App />
    </BrowserRouter>
  </StrictMode>,
)
