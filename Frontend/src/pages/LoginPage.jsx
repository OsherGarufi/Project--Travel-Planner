import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../css/App.css'
import { useAuth } from '../hooks/useAuth'

function LoginPage() {
  const {
    firebaseUser,
    backendUser,
    error,
    isLoading,
    login,
    loginWithEmailAndPassword,
  } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
      // AuthProvider already handles the error state.
    }
  }

  const handleEmailLogin = async (event) => {
    event.preventDefault()

    try {
      await loginWithEmailAndPassword(email, password)
    } catch {
      // AuthProvider already handles the error state.
    }
  }

  return (
    <main>
      <h1>Travel Planner</h1>

      <p>Sign in to continue planning your trips.</p>

      {error && <p>{error}</p>}

      <form onSubmit={handleEmailLogin}>
        <div>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            disabled={isLoading}
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Login with Email'}
        </button>
      </form>

      <p>Or</p>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Login with Google'}
      </button>

      <p>
        Don&apos;t have an account?{' '}
        <Link to="/register">Create an account</Link>
      </p>
    </main>
  )
}

export default LoginPage