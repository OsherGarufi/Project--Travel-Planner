import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/App.css'
import { useAuth } from '../hooks/useAuth'

function HomePage() {
  const {
    firebaseUser,
    backendUser,
    idToken,
    isLoading,
    logout,
  } = useAuth()

  const [copyMessage, setCopyMessage] = useState('')

  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      // AuthContext already handles the error state.
    }
  }

  const handleCopyToken = async () => {
    if (!idToken) {
      return
    }

    try {
      await navigator.clipboard.writeText(idToken)
      setCopyMessage('Token copied')
    } catch (copyError) {
      console.error('Could not copy token:', copyError)
      setCopyMessage('Could not copy token')
    }
  }

  const shortenedToken = idToken
    ? `${idToken.slice(0, 40)}...${idToken.slice(-20)}`
    : 'No token available'

  return (
    <main>
      <h1>Travel Planner</h1>

      <section>
        <h2>Welcome, {backendUser?.displayName ?? 'Traveler'}</h2>

        {firebaseUser?.photoURL && (
          <img
            src={firebaseUser.photoURL}
            alt={firebaseUser.displayName ?? 'User'}
            width="80"
            height="80"
          />
        )}

        <p>
          <strong>Name:</strong> {backendUser?.displayName}
        </p>

        <p>
          <strong>Email:</strong> {backendUser?.email}
        </p>

        <p>
          <strong>Firebase UID:</strong> {backendUser?.firebaseUid}
        </p>

        <p>
          <strong>Database User ID:</strong> {backendUser?.id}
        </p>

        <div>
          <p>
            <strong>ID Token:</strong>
          </p>

          <code>{shortenedToken}</code>

          <div>
            <button
              type="button"
              onClick={handleCopyToken}
              disabled={!idToken}
            >
              Copy Token
            </button>

            {copyMessage && <p>{copyMessage}</p>}
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? 'Signing out...' : 'Logout'}
        </button>
      </section>
    </main>
  )
}

export default HomePage