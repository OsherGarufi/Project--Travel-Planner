import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AuthAlertIcon,
  PasswordVisibilityIcon,
} from '../components/auth/AuthIcons'
import AuthLayout from '../components/auth/AuthLayout'
import '../css/components/auth-form.css'
import '../css/pages/register-page.css'
import { useAuth } from '../hooks/useAuth'

function SuccessIcon() {
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
        d="m8.25 12.15 2.45 2.45 5.1-5.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RegisterPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false)

  const {
    register,
    error,
    isLoading,
  } = useAuth()

  const displayedError = localError || error

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
      setIsPasswordVisible(false)
      setIsConfirmPasswordVisible(false)
    } catch {
      // AuthProvider already handles the registration error.
    }
  }

  return (
    <AuthLayout>
      <div className="auth-form__shell">
        <header className="auth-form__header">
          <p className="auth-form__eyebrow">
            JOIN TRAVEL PLANNER
          </p>

          <h1 className="auth-form__title">
            Create your account
          </h1>

          <p className="auth-form__subtitle">
            Your next trip starts here.
          </p>
        </header>

        {displayedError && (
          <div
            id="register-error"
            className="auth-form__alert auth-form__alert--error"
            role="alert"
            aria-live="assertive"
          >
            <span className="auth-form__alert-icon">
              <AuthAlertIcon />
            </span>

            <span>{displayedError}</span>
          </div>
        )}

        {successMessage && (
          <div
            className="auth-form__alert auth-form__alert--success"
            role="status"
            aria-live="polite"
          >
            <span className="auth-form__alert-icon">
              <SuccessIcon />
            </span>

            <span>{successMessage}</span>
          </div>
        )}

        <form
          className="auth-form__form"
          onSubmit={handleSubmit}
          aria-busy={isLoading}
          aria-describedby={
            displayedError ? 'register-error' : undefined
          }
        >
          <div className="auth-form__field">
            <label
              className="auth-form__label"
              htmlFor="displayName"
            >
              Full name
            </label>

            <input
              id="displayName"
              className="auth-form__input"
              type="text"
              value={displayName}
              onChange={(event) =>
                setDisplayName(event.target.value)
              }
              placeholder="Your full name"
              autoComplete="name"
              required
              disabled={isLoading}
            />
          </div>

          <div className="auth-form__field">
            <label
              className="auth-form__label"
              htmlFor="email"
            >
              Email address
            </label>

            <input
              id="email"
              className="auth-form__input"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck="false"
              required
              disabled={isLoading}
            />
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
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Create a password"
                autoComplete="new-password"
                minLength="6"
                required
                disabled={isLoading}
              />

              <button
                className="auth-form__password-toggle"
                type="button"
                onClick={() =>
                  setIsPasswordVisible(
                    (currentValue) => !currentValue,
                  )
                }
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

            <p className="auth-form__field-hint">
              Use at least 6 characters.
            </p>
          </div>

          <div className="auth-form__field">
            <label
              className="auth-form__label"
              htmlFor="confirmPassword"
            >
              Confirm password
            </label>

            <div className="auth-form__input-wrapper">
              <input
                id="confirmPassword"
                className="auth-form__input auth-form__input--password"
                type={
                  isConfirmPasswordVisible
                    ? 'text'
                    : 'password'
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Repeat your password"
                autoComplete="new-password"
                minLength="6"
                required
                disabled={isLoading}
              />

              <button
                className="auth-form__password-toggle"
                type="button"
                onClick={() =>
                  setIsConfirmPasswordVisible(
                    (currentValue) => !currentValue,
                  )
                }
                aria-label={
                  isConfirmPasswordVisible
                    ? 'Hide confirmed password'
                    : 'Show confirmed password'
                }
                aria-pressed={isConfirmPasswordVisible}
                disabled={isLoading}
              >
                <PasswordVisibilityIcon
                  isVisible={isConfirmPasswordVisible}
                />
              </button>
            </div>
          </div>

          <button
            className="auth-form__submit register-page__submit"
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
              {isLoading
                ? 'Creating account...'
                : 'Create account'}
            </span>
          </button>
        </form>

        <p className="auth-form__footer">
          Already have an account?{' '}

          <Link
            className="auth-form__footer-link"
            to="/login"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage