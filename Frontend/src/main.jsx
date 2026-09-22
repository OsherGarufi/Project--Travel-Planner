import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import { FeedbackProvider } from './context/FeedbackProvider.jsx'
import { TripsProvider } from './context/TripsProvider.jsx'
import './css/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TripsProvider>
          <FeedbackProvider>
            <App />
          </FeedbackProvider>
        </TripsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
