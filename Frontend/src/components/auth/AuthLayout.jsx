import LoginPageImage from '../../assets/loginPage.png'
import TravelPlannerLogo from '../../assets/TP_logoW.png'
import '../../css/components/auth-layout.css'

function AuthLayout({ children }) {
  return (
    <main className="auth-layout">
      <section
        className="auth-layout__visual"
        aria-label="Travel inspiration"
      >
        <img
          className="auth-layout__visual-image"
          src={LoginPageImage}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
          aria-hidden="true"
        />

        <div
          className="auth-layout__visual-overlay"
          aria-hidden="true"
        />

        <div className="auth-layout__visual-content">
          <div className="auth-layout__brand">
            <span
              className="auth-layout__brand-mark"
              aria-hidden="true"
            >
              <img
                className="auth-layout__brand-logo"
                src={TravelPlannerLogo}
                alt=""
                draggable="false"
              />
            </span>

            <span className="auth-layout__brand-name">
              Travel Planner
            </span>
          </div>

          <div className="auth-layout__visual-copy">
            <p className="auth-layout__visual-eyebrow">
              Your trip, with easy planning
            </p>

            <h2 className="auth-layout__visual-title">
              Travel with simple order and organization.
            </h2>

            <p className="auth-layout__visual-description">
              Bring every destination, date and detail together in one
              beautifully organized place.
            </p>
          </div>
        </div>
      </section>

      <section className="auth-layout__panel">
        {children}
      </section>
    </main>
  )
}

export default AuthLayout