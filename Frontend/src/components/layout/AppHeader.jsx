import {
    useEffect,
    useRef,
    useState,
} from 'react'
import {
    Link,
    NavLink,
    useNavigate,
} from 'react-router-dom'
import TravelPlannerLogo from '../../assets/TP_logoW.png'
import '../../css/components/app-header.css'
import { useAuth } from '../../hooks/useAuth'
import ProfileAvatar from '../ProfileAvatar'

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m8 10 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M14 8l4 4-4 4M18 12H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AppHeader() {
  const {
    firebaseUser,
    backendUser,
    isLoading,
    logout,
  } = useAuth()

  const [isUserMenuOpen, setIsUserMenuOpen] =
    useState(false)

  const userMenuRef = useRef(null)
  const navigate = useNavigate()

  const displayName =
    backendUser?.displayName ??
    firebaseUser?.displayName ??
    'Traveler'

  const email =
    backendUser?.email ??
    firebaseUser?.email ??
    ''

  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener(
      'pointerdown',
      handlePointerDown,
    )

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      )

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [isUserMenuOpen])

  const closeUserMenu = () => {
    setIsUserMenuOpen(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      // AuthProvider already handles the error state.
    }
  }

  const getNavLinkClassName = ({ isActive }) =>
    `app-header__nav-link${
      isActive ? ' app-header__nav-link--active' : ''
    }`

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link
          className="app-header__brand"
          to="/home"
          onClick={closeUserMenu}
          aria-label="Travel Planner home"
        >
          <span
            className="app-header__brand-mark"
            aria-hidden="true"
          >
            <img
              className="app-header__brand-logo"
              src={TravelPlannerLogo}
              alt=""
              draggable="false"
            />
          </span>

          <span className="app-header__brand-name">
            Travel Planner
          </span>
        </Link>

        <nav
          className="app-header__nav"
          aria-label="Primary navigation"
        >
          <NavLink
            className={getNavLinkClassName}
            to="/home"
            onClick={closeUserMenu}
          >
            Home
          </NavLink>

          <NavLink
            className={getNavLinkClassName}
            to="/plan"
            onClick={closeUserMenu}
          >
            Plan Trip
          </NavLink>

          <NavLink
            className={getNavLinkClassName}
            to="/trips"
            onClick={closeUserMenu}
          >
            My Trips
          </NavLink>
        </nav>

        <div
          ref={userMenuRef}
          className="app-header__user"
        >
          <button
            className="app-header__user-trigger"
            type="button"
            onClick={() =>
              setIsUserMenuOpen(
                (currentValue) => !currentValue,
              )
            }
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
            aria-label="Open user menu"
          >
            <ProfileAvatar
              photoUrl={firebaseUser?.photoURL}
              displayName={displayName}
              size={38}
            />

            <span className="app-header__user-copy">
              <span className="app-header__user-name">
                {displayName}
              </span>

              <span className="app-header__user-label">
                My account
              </span>
            </span>

            <span
              className={`app-header__user-chevron${
                isUserMenuOpen
                  ? ' app-header__user-chevron--open'
                  : ''
              }`}
              aria-hidden="true"
            >
              <ChevronIcon />
            </span>
          </button>

          {isUserMenuOpen && (
            <div
              className="app-header__user-menu"
              role="menu"
            >
              <div className="app-header__user-menu-profile">
                <ProfileAvatar
                  photoUrl={firebaseUser?.photoURL}
                  displayName={displayName}
                  size={44}
                />

                <div className="app-header__user-menu-copy">
                  <span className="app-header__user-menu-name">
                    {displayName}
                  </span>

                  {email && (
                    <span className="app-header__user-menu-email">
                      {email}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="app-header__user-menu-divider"
                aria-hidden="true"
              />

              <button
                className="app-header__logout"
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={isLoading}
              >
                <span
                  className="app-header__logout-icon"
                  aria-hidden="true"
                >
                  <LogoutIcon />
                </span>

                <span>
                  {isLoading
                    ? 'Signing out...'
                    : 'Sign out'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default AppHeader