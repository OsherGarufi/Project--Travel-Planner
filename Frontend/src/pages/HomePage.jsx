import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileAvatar from '../components/ProfileAvatar'
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

  const navigate = useNavigate()

  const displayName =
    backendUser?.displayName ??
    firebaseUser?.displayName ??
    'Traveler'

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    console.group(
      'Travel Planner - Authentication Debug',
    )

    console.log('Firebase User:', firebaseUser)
    console.log('Backend User:', backendUser)
    console.log(
      'Firebase UID:',
      firebaseUser?.uid ?? backendUser?.firebaseUid,
    )
    console.log('Database User ID:', backendUser?.id)
    console.log(
      'Email:',
      backendUser?.email ?? firebaseUser?.email,
    )
    console.log('ID Token:', idToken)

    console.groupEnd()
  }, [firebaseUser, backendUser, idToken])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      // AuthProvider already handles the error state.
    }
  }

  return (
    <main>
      <h1>Travel Planner</h1>

      <section>
        <h2>Welcome, {displayName}</h2>

        <ProfileAvatar
          photoUrl={firebaseUser?.photoURL}
          displayName={displayName}
          size={80}
        />

        <p>
          Explore destinations, review useful country
          information and save the trips that suit you.
        </p>
      </section>

      <section>
        <h2>What would you like to do?</h2>

        <div>
          <button
            type="button"
            onClick={() => navigate('/plan')}
          >
            Plan a New Trip
          </button>

          <button
            type="button"
            onClick={() => navigate('/trips')}
          >
            My Saved Trips
          </button>
        </div>
      </section>

      <section>
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