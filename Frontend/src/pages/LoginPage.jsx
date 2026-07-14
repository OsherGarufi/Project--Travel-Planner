import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/App.css'
import { useAuth } from '../hooks/useAuth'

function LoginPage() {
  const {
    firebaseUser,
    backendUser,
    error,
    isLoading,
    login,
  } = useAuth()

  const navigate = useNavigate()

  const isAuthenticated = Boolean(firebaseUser && backendUser)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleGoogleLogin = async () => {
    try {
      await login()
    } catch {
      // AuthContext already handles the error state.
    }
  }

  return (
    <main>
      <h1>Travel Planner</h1>

      <p>Firebase Authentication and Backend API test</p>

      {error && <p>{error}</p>}

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Login with Google'}
      </button>
    </main>
  )
}

export default LoginPage