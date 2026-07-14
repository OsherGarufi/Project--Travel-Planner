import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute({ children }) {
  const {
    firebaseUser,
    backendUser,
    isLoading,
  } = useAuth()

  if (isLoading) {
    return (
      <main>
        <p>Checking authentication...</p>
      </main>
    )
  }

  const isAuthenticated = Boolean(firebaseUser && backendUser)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute