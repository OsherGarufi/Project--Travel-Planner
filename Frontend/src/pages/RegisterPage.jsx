import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../css/App.css'
import { useAuth } from '../hooks/useAuth'

function RegisterPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    error,
    isLoading,
  } = useAuth()

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }

    try {
      setLocalError('')
      setSuccessMessage('')

      const result = await register(
        displayName,
        email,
        password,
      )

      setSuccessMessage(
        `Verification email sent to ${result.email}. Please verify your email before signing in.`,
      )

      setDisplayName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch {
      // AuthContext already handles the registration error.
    }
  }

  return (
    <main>
      <h1>Create account</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="displayName">Full name</label>

          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength="6"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">
            Confirm password
          </label>

          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            minLength="6"
            required
          />
        </div>

        {localError && <p>{localError}</p>}

        {error && <p>{error}</p>}

        {successMessage && <p>{successMessage}</p>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p>
        Already have an account?{' '}
        <Link to="/login">Sign in</Link>
      </p>
    </main>
  )
}

export default RegisterPage