import {
  lazy,
  Suspense,
} from 'react'
import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'

const HomePage = lazy(
  () => import('./pages/HomePage'),
)

const LoginPage = lazy(
  () => import('./pages/LoginPage'),
)

const PlanTripPage = lazy(
  () => import('./pages/PlanTripPage'),
)

const RegisterPage = lazy(
  () => import('./pages/RegisterPage'),
)

const TripDetailsPage = lazy(
  () => import('./pages/TripDetailsPage'),
)

const TripItineraryPage = lazy(
  () => import('./pages/TripItineraryPage'),
)

const TripsPage = lazy(
  () => import('./pages/TripsPage'),
)

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/home"
              replace
            />
          }
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

          <Route
            path="/trips/:tripId/itinerary"
            element={<TripItineraryPage />}
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/home"
              replace
            />
          }
        />
      </Routes>
    </Suspense>
  )
}

export default App