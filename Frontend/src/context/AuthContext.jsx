import { onAuthStateChanged } from 'firebase/auth'
import {
  createContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { auth } from '../config/firebase'
import {
  loginWithGoogle,
  logoutFromFirebase,
  syncFirebaseUserWithBackend,
} from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [backendUser, setBackendUser] = useState(null)
  const [idToken, setIdToken] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const isManualLoginInProgress = useRef(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentFirebaseUser) => {
        if (!currentFirebaseUser) {
          setFirebaseUser(null)
          setBackendUser(null)
          setIdToken(null)
          setIsLoading(false)

          return
        }

        if (isManualLoginInProgress.current) {
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
    logout,
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  )
}