import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PlanTripPage from './pages/PlanTripPage'
import RegisterPage from './pages/RegisterPage'
import TripsPage from './pages/TripsPage'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/home" replace />}
      />

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

      <Route
        path="/trips"
        element={
          <ProtectedRoute>
            <TripsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/home" replace />}
      />
    </Routes>
  )
}

export default App