import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoginPageImage from '../assets/loginPage.png'
import TravelPlannerLogo from '../assets/TP_logoW.png'
import '../css/pages/login-page.css'
import { useAuth } from '../hooks/useAuth'

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 7.75v5.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="16.25"
        r="1"
        fill="currentColor"
      />
    </svg>
  )
}

function EyeIcon({ isVisible }) {
  if (isVisible) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M3 3 21 21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M10.6 10.75a2 2 0 0 0 2.65 2.65"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M9.9 4.4A9.8 9.8 0 0 1 12 4.18c5.5 0 9 5.82 9 7.82a8.7 8.7 0 0 1-2.25 3.75M6.35 6.35C4.28 7.77 3 10.4 3 12c0 2 3.5 7.82 9 7.82 1.4 0 2.65-.38 3.75-1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 12c0-2 3.5-7.82 9-7.82S21 10 21 12s-3.5 7.82-9 7.82S3 14 3 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="2.75"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

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
    <main className="login-page">
      <section
        className="login-page__visual"
        aria-label="Travel inspiration"
      >
        <img
          className="login-page__visual-image"
          src={LoginPageImage}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
          aria-hidden="true"
        />

        <div
          className="login-page__visual-overlay"
          aria-hidden="true"
        />

        <div className="login-page__visual-content">
          <div className="login-page__brand">
            <span
              className="login-page__brand-mark"
              aria-hidden="true"
            >
              <img
                className="login-page__brand-logo"
                src={TravelPlannerLogo}
                alt=""
                draggable="false"
              />
            </span>

            <span className="login-page__brand-name">
              Travel Planner
            </span>
          </div>

          <div className="login-page__visual-copy">
            <p className="login-page__visual-eyebrow">
              Your trip, with easy planning
            </p>

            <h2 className="login-page__visual-title">
              Travel with simple order and organization.
            </h2>

            <p className="login-page__visual-description">
              Bring every destination, date and detail together in one
              beautifully organized place.
            </p>
          </div>
        </div>
      </section>

      <section className="login-page__panel">
        <div className="login-page__form-shell">
          <div className="login-page__mobile-brand">
            <span
              className="login-page__mobile-brand-mark"
              aria-hidden="true"
            >
              <img
                className="login-page__mobile-brand-logo"
                src={TravelPlannerLogo}
                alt=""
                draggable="false"
              />
            </span>

            <span className="login-page__mobile-brand-name">
              Travel Planner
            </span>
          </div>

          <header className="login-page__form-header">
            <p className="login-page__form-eyebrow">
              WELCOME! we are happy to see you again.
            </p>

            <h1 className="login-page__title">
              Sign in to your account
            </h1>

            <p className="login-page__subtitle">
              Plan your next trip.
            </p>
          </header>

          {error && (
            <div
              id="login-error"
              className="login-page__alert"
              role="alert"
              aria-live="assertive"
            >
              <span className="login-page__alert-icon">
                <AlertIcon />
              </span>

              <span>{error}</span>
            </div>
          )}

          <form
            className="login-page__form"
            onSubmit={handleEmailLogin}
            aria-busy={isLoading}
            aria-describedby={error ? 'login-error' : undefined}
          >
            <div className="login-page__field">
              <label
                className="login-page__label"
                htmlFor="email"
              >
                Email address
              </label>

              <div className="login-page__input-wrapper">
                <input
                  id="email"
                  className="login-page__input"
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

            <div className="login-page__field">
              <label
                className="login-page__label"
                htmlFor="password"
              >
                Password
              </label>

              <div className="login-page__input-wrapper">
                <input
                  id="password"
                  className="login-page__input login-page__input--password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />

                <button
                  className="login-page__password-toggle"
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
                  <EyeIcon isVisible={isPasswordVisible} />
                </button>
              </div>
            </div>

            <button
              className="login-page__submit"
              type="submit"
              disabled={isLoading}
            >
              {isLoading && (
                <span
                  className="login-page__spinner"
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

          <p className="login-page__signup">
            Don&apos;t have an account?{' '}

            <Link
              className="login-page__signup-link"
              to="/register"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default LoginPage