import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PlanTripPage from './pages/PlanTripPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

    <Route
        path="/plan"
        element={
          <ProtectedRoute>
            <PlanTripPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App