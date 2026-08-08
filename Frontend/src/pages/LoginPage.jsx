import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AuthAlertIcon,
  PasswordVisibilityIcon,
} from '../components/auth/AuthIcons'
import AuthLayout from '../components/auth/AuthLayout'
import '../css/components/auth-form.css'
import '../css/pages/login-page.css'
import { useAuth } from '../hooks/useAuth'

function GoogleIcon() {
  return (
    <svg
      className="login-page__google-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.01v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
      />

      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.62-2.41l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z"
      />

      <path
        fill="#FBBC05"
        d="M6.39 13.9A6 6 0 0 1 6.07 12c0-.66.11-1.3.32-1.9V7.5H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.5l3.35-2.6Z"
      />

      <path
        fill="#EA4335"
        d="M12 5.97c1.47 0 2.79.51 3.83 1.5l2.87-2.88C16.96 2.97 14.7 2 12 2a10 10 0 0 0-8.96 5.5l3.35 2.6C7.18 7.73 9.39 5.97 12 5.97Z"
      />
    </svg>
  )
}

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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

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

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((currentValue) => !currentValue)
  }

  return (
    <AuthLayout>
      <div className="auth-form__shell">
        <header className="auth-form__header">
          <p className="auth-form__eyebrow">
            WELCOME! we are happy to see you again.
          </p>

          <h1 className="auth-form__title">
            Sign in to your account
          </h1>

          <p className="auth-form__subtitle">
            Plan your next trip.
          </p>
        </header>

        {error && (
          <div
            id="login-error"
            className="auth-form__alert auth-form__alert--error"
            role="alert"
            aria-live="assertive"
          >
            <span className="auth-form__alert-icon">
              <AuthAlertIcon />
            </span>

            <span>{error}</span>
          </div>
        )}

        <form
          className="auth-form__form"
          onSubmit={handleEmailLogin}
          aria-busy={isLoading}
          aria-describedby={error ? 'login-error' : undefined}
        >
          <div className="auth-form__field">
            <label
              className="auth-form__label"
              htmlFor="email"
            >
              Email address
            </label>

            <div className="auth-form__input-wrapper">
              <input
                id="email"
                className="auth-form__input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck="false"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="auth-form__field">
            <label
              className="auth-form__label"
              htmlFor="password"
            >
              Password
            </label>

            <div className="auth-form__input-wrapper">
              <input
                id="password"
                className="auth-form__input auth-form__input--password"
                type={isPasswordVisible ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={isLoading}
              />

              <button
                className="auth-form__password-toggle"
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={
                  isPasswordVisible
                    ? 'Hide password'
                    : 'Show password'
                }
                aria-pressed={isPasswordVisible}
                disabled={isLoading}
              >
                <PasswordVisibilityIcon
                  isVisible={isPasswordVisible}
                />
              </button>
            </div>
          </div>

          <button
            className="auth-form__submit"
            type="submit"
            disabled={isLoading}
          >
            {isLoading && (
              <span
                className="auth-form__spinner"
                aria-hidden="true"
              />
            )}

            <span>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </span>
          </button>
        </form>

        <div
          className="login-page__divider"
          aria-hidden="true"
        >
          Or continue with
        </div>

        <button
          className="login-page__google-button"
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <GoogleIcon />

          <span>
            {isLoading
              ? 'Connecting...'
              : 'Continue with Google'}
          </span>
        </button>

        <p className="auth-form__footer">
          Don&apos;t have an account?{' '}

          <Link
            className="auth-form__footer-link"
            to="/register"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default LoginPage