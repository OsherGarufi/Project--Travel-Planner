import {
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { useState } from 'react'
import './App.css'
import { auth } from './firebase'

function App() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      setError('')

      const provider = new GoogleAuthProvider()

      const result = await signInWithPopup(auth, provider)

      const firebaseUser = result.user

      const idToken = await firebaseUser.getIdToken()

      setUser(firebaseUser)

      console.log('Firebase user:', firebaseUser)
      console.log('Firebase ID Token:', idToken)
    } catch (loginError) {
      console.error('Google login failed:', loginError)

      setError('Google login failed. Check the browser console.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main>
      <h1>Travel Planner</h1>

      <p>Firebase Authentication test</p>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Login with Google'}
      </button>

      {error && <p>{error}</p>}

      {user && (
        <section>
          <h2>Login successful</h2>

          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName ?? 'User'}
              width="80"
              height="80"
            />
          )}

          <p>
            <strong>Name:</strong> {user.displayName}
          </p>

          <p>
            <strong>Email:</strong> {user.email}
          </p>

          <p>
            <strong>Firebase UID:</strong> {user.uid}
          </p>
        </section>
      )}
    </main>
  )
}

export default App