import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PlanTripPage from './pages/PlanTripPage'
import RegisterPage from './pages/RegisterPage'
import TripDetailsPage from './pages/TripDetailsPage'
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
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/home"
          element={<HomePage />}
        />

        <Route
          path="/plan"
          element={<PlanTripPage />}
        />

        <Route
          path="/trips"
          element={<TripsPage />}
        />

        <Route
          path="/trips/:tripId"
          element={<TripDetailsPage />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/home" replace />}
      />
    </Routes>
  )
}

export default App