import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useRef, useState } from 'react'
import { auth } from '../config/firebase'
import {
  loginWithEmail,
  loginWithGoogle,
  logoutFromFirebase,
  registerWithEmail,
  syncFirebaseUserWithBackend,
} from '../services/authService'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [backendUser, setBackendUser] = useState(null)
  const [idToken, setIdToken] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const isManualLoginInProgress = useRef(false)
  const isRegistrationInProgress = useRef(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentFirebaseUser) => {
        if (
          isManualLoginInProgress.current || 
          isRegistrationInProgress.current
        ) {
          return
        }

        if (!currentFirebaseUser) {
          setFirebaseUser(null)
          setBackendUser(null)
          setIdToken(null)
          setIsLoading(false)
          return
        }

        try {
          setIsLoading(true)
          setError('')

          const loginResult =
            await syncFirebaseUserWithBackend(currentFirebaseUser)

          setFirebaseUser(loginResult.firebaseUser)
          setBackendUser(loginResult.backendUser)
          setIdToken(loginResult.idToken)
        } catch (restoreError) {
          console.error(
            'Authentication restore failed:',
            restoreError,
          )

          setFirebaseUser(null)
          setBackendUser(null)
          setIdToken(null)

          setError(
            'Could not restore the authentication session. Check the browser console.',
          )
        } finally {
          setIsLoading(false)
        }
      },
    )

    return unsubscribe
  }, [])

  const login = async () => {
    try {
      isManualLoginInProgress.current = true

      setIsLoading(true)
      setError('')

      const loginResult = await loginWithGoogle()

      setFirebaseUser(loginResult.firebaseUser)
      setBackendUser(loginResult.backendUser)
      setIdToken(loginResult.idToken)

      return loginResult
    } catch (loginError) {
      console.error('Google login failed:', loginError)

      setError(
        'Google login failed. Check the browser console.',
      )

      throw loginError
    } finally {
      isManualLoginInProgress.current = false
      setIsLoading(false)
    }
  }

const loginWithEmailAndPassword = async (
  email,
  password,
) => {
  try {
    isManualLoginInProgress.current = true

    setIsLoading(true)
    setError('')

    const loginResult = await loginWithEmail(
      email,
      password,
    )

    setFirebaseUser(loginResult.firebaseUser)
    setBackendUser(loginResult.backendUser)
    setIdToken(loginResult.idToken)

    return loginResult
  } catch (loginError) {
    console.error('Email login failed:', loginError)

    if (loginError.message === 'EMAIL_NOT_VERIFIED') {
      setError(
        'Please verify your email address before signing in.',
      )
    } else if (
      loginError.code === 'auth/invalid-credential' ||
      loginError.code === 'auth/user-not-found' ||
      loginError.code === 'auth/wrong-password'
    ) {
      setError(
        'The email address or password is incorrect.',
      )
    } else if (loginError.code === 'auth/invalid-email') {
      setError('Please enter a valid email address.')
    } else if (loginError.code === 'auth/too-many-requests') {
      setError(
        'Too many failed login attempts. Please try again later.',
      )
    } else if (loginError.code === 'auth/network-request-failed') {
      setError(
        'Network error. Please check your internet connection.',
      )
    } else {
      setError(
        'Login failed. Please try again.',
      )
    }

    throw loginError
  } finally {
    isManualLoginInProgress.current = false
    setIsLoading(false)
  }
}

  const register = async (displayName, email, password) => {
    try {
      isRegistrationInProgress.current = true

      setIsLoading(true)
      setError('')

      return await registerWithEmail(
        displayName,
        email,
        password,
      )
    } catch (registerError) {
      console.error('Registration failed:', registerError)

      setError(
        'Registration failed. Check the browser console.',
      )

      throw registerError
    } finally {
      isRegistrationInProgress.current = false
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      setError('')

      await logoutFromFirebase()

      setFirebaseUser(null)
      setBackendUser(null)
      setIdToken(null)
    } catch (logoutError) {
      console.error('Logout failed:', logoutError)

      setError('Logout failed. Check the browser console.')

      throw logoutError
    } finally {
      setIsLoading(false)
    }
  }

  const authContextValue = {
    firebaseUser,
    backendUser,
    idToken,
    error,
    isLoading,
    login,
    loginWithEmailAndPassword,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  )
}