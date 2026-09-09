import { onIdTokenChanged } from 'firebase/auth'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { auth } from '../config/firebase'
import {
  loginWithEmail,
  loginWithGoogle,
  logoutFromFirebase,
  registerWithEmail,
  syncFirebaseUserWithBackend,
} from '../services/authService'
import {
  clearUserExpensesCache,
} from '../services/expenseCacheService'
import {
  clearUserItineraryCache,
} from '../services/itinerary/itineraryCache'
import {
  removeTripsCache,
} from '../services/trips/tripsCache'
import {
  clearUserAttractionsCache,
} from '../services/attractions/attractionsCache'
import {
  invalidateUserAttractionsRequests,
} from '../services/attractions/attractionsRequestManager'
import { AuthContext } from './AuthContext'

function getEmailLoginErrorMessage(loginError) {
  if (
    loginError.message ===
    'EMAIL_NOT_VERIFIED'
  ) {
    return 'Please verify your email address before signing in.'
  }

  if (
    loginError.code ===
      'auth/invalid-credential' ||
    loginError.code ===
      'auth/user-not-found' ||
    loginError.code ===
      'auth/wrong-password'
  ) {
    return 'The email address or password is incorrect.'
  }

  if (
    loginError.code ===
    'auth/invalid-email'
  ) {
    return 'Please enter a valid email address.'
  }

  if (
    loginError.code ===
    'auth/too-many-requests'
  ) {
    return 'Too many failed login attempts. Please try again later.'
  }

  if (
    loginError.code ===
    'auth/network-request-failed'
  ) {
    return 'Network error. Please check your internet connection.'
  }

  return 'Login failed. Please try again.'
}

function getRegistrationErrorMessage(
  registerError,
) {
  if (
    registerError.code ===
    'auth/email-already-in-use'
  ) {
    return 'An account with this email already exists. Please use a different email or sign in instead.'
  }

  if (
    registerError.code ===
    'auth/invalid-email'
  ) {
    return 'Please enter a valid email address.'
  }

  if (
    registerError.code ===
      'auth/weak-password' ||
    registerError.code ===
      'auth/password-does-not-meet-requirements'
  ) {
    return 'Your password does not meet the required security requirements. Please choose a stronger password.'
  }

  if (
    registerError.code ===
    'auth/network-request-failed'
  ) {
    return 'Network error. Please check your internet connection and try again.'
  }

  if (
    registerError.code ===
    'auth/too-many-requests'
  ) {
    return 'Too many registration attempts. Please wait a moment and try again.'
  }

  if (
    registerError.code ===
    'auth/operation-not-allowed'
  ) {
    return 'Email registration is currently unavailable. Please try again later.'
  }

  return 'We could not create your account. Please try again.'
}

function clearPrivateUserCache(
  userId,
) {
  if (!userId) {
    return
  }

  invalidateUserAttractionsRequests(
    userId,
  )

  clearUserAttractionsCache(
    userId,
  )

  removeTripsCache(
    userId,
  )

  clearUserExpensesCache(
    userId,
  )

  clearUserItineraryCache(
    userId,
  )
}

export function AuthProvider({
  children,
}) {
  const [
    firebaseUser,
    setFirebaseUser,
  ] = useState(null)

  const [
    backendUser,
    setBackendUser,
  ] = useState(null)

  const [
    idToken,
    setIdToken,
  ] = useState(null)

  const [
    error,
    setError,
  ] = useState('')

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const isAuthActionInProgress =
    useRef(false)

  const authRestoreRequestIdRef =
    useRef(0)

  const activeUserIdRef =
    useRef(null)

  const applyAuthResult =
    useCallback(
      (loginResult) => {
        const nextUserId =
          loginResult
            .firebaseUser
            ?.uid ?? null

        const previousUserId =
          activeUserIdRef.current

        if (
          previousUserId &&
          previousUserId !==
            nextUserId
        ) {
          clearPrivateUserCache(
            previousUserId,
          )
        }

        activeUserIdRef.current =
          nextUserId

        setFirebaseUser(
          loginResult.firebaseUser,
        )

        setBackendUser(
          loginResult.backendUser,
        )

        setIdToken(
          loginResult.idToken,
        )
      },
      [],
    )

  const clearAuthState =
    useCallback(() => {
      const currentUserId =
        activeUserIdRef.current

      if (currentUserId) {
        clearPrivateUserCache(
          currentUserId,
        )
      }

      activeUserIdRef.current =
        null

      setFirebaseUser(null)
      setBackendUser(null)
      setIdToken(null)
    }, [])

  const clearError =
    useCallback(() => {
      setError('')
    }, [])

  const beginAuthAction = () => {
    isAuthActionInProgress.current =
      true

    authRestoreRequestIdRef.current +=
      1

    setIsLoading(true)
    setError('')
  }

  const finishAuthAction = () => {
    isAuthActionInProgress.current =
      false

    setIsLoading(false)
  }

  useEffect(() => {
    const unsubscribe =
      onIdTokenChanged(
        auth,
        async (
          currentFirebaseUser,
        ) => {
          const restoreRequestId =
            ++authRestoreRequestIdRef.current

          if (
            isAuthActionInProgress.current
          ) {
            return
          }

          if (
            !currentFirebaseUser
          ) {
            clearAuthState()
            setIsLoading(false)

            return
          }

          try {
            setIsLoading(true)
            setError('')

            const loginResult =
              await syncFirebaseUserWithBackend(
                currentFirebaseUser,
              )

            if (
              authRestoreRequestIdRef.current !==
              restoreRequestId
            ) {
              return
            }

            applyAuthResult(
              loginResult,
            )
          } catch (
            restoreError
          ) {
            if (
              authRestoreRequestIdRef.current !==
              restoreRequestId
            ) {
              return
            }

            console.error(
              'Authentication restore failed:',
              restoreError,
            )

            clearAuthState()

            setError(
              'Could not restore the authentication session. Please try signing in again.',
            )
          } finally {
            if (
              authRestoreRequestIdRef.current ===
              restoreRequestId
            ) {
              setIsLoading(false)
            }
          }
        },
      )

    return () => {
      authRestoreRequestIdRef.current +=
        1

      unsubscribe()
    }
  }, [
    applyAuthResult,
    clearAuthState,
  ])

  const login = async () => {
    beginAuthAction()

    try {
      const loginResult =
        await loginWithGoogle()

      applyAuthResult(
        loginResult,
      )

      return loginResult
    } catch (
      loginError
    ) {
      console.error(
        'Google login failed:',
        loginError,
      )

      setError(
        'Google sign in failed. Please try again.',
      )

      throw loginError
    } finally {
      finishAuthAction()
    }
  }

  const loginWithEmailAndPassword =
    async (
      email,
      password,
    ) => {
      beginAuthAction()

      try {
        const loginResult =
          await loginWithEmail(
            email,
            password,
          )

        applyAuthResult(
          loginResult,
        )

        return loginResult
      } catch (
        loginError
      ) {
        console.error(
          'Email login failed:',
          loginError,
        )

        setError(
          getEmailLoginErrorMessage(
            loginError,
          ),
        )

        throw loginError
      } finally {
        finishAuthAction()
      }
    }

  const register = async (
    displayName,
    email,
    password,
  ) => {
    beginAuthAction()

    try {
      return await registerWithEmail(
        displayName,
        email,
        password,
      )
    } catch (
      registerError
    ) {
      console.error(
        'Registration failed:',
        registerError,
      )

      setError(
        getRegistrationErrorMessage(
          registerError,
        ),
      )

      throw registerError
    } finally {
      finishAuthAction()
    }
  }

  const logout = async () => {
    beginAuthAction()

    try {
      await logoutFromFirebase()

      clearAuthState()
    } catch (
      logoutError
    ) {
      console.error(
        'Logout failed:',
        logoutError,
      )

      setError(
        'Logout failed. Please try again.',
      )

      throw logoutError
    } finally {
      finishAuthAction()
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
    clearError,
  }

  return (
    <AuthContext.Provider
      value={
        authContextValue
      }
    >
      {children}
    </AuthContext.Provider>
  )
}