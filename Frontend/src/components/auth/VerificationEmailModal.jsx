import { useEffect, useRef } from 'react'
import '../../css/components/verification-email-modal.css'

function VerificationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4.5 7.5 12 13l7.5-5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m9.2 16.5 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function VerificationEmailModal({
  isOpen,
  email,
  onConfirm,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (isOpen && !dialog.open) {
      dialog.showModal()
    }

    if (!isOpen && dialog.open) {
      dialog.close()
    }

    return () => {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [isOpen])

  const handleCancel = (event) => {
    event.preventDefault()
  }

  return (
    <dialog
      ref={dialogRef}
      className="verification-email-modal"
      onCancel={handleCancel}
      aria-labelledby="verification-modal-title"
      aria-describedby="verification-modal-description"
    >
      <div className="verification-email-modal__content">
        <div
          className="verification-email-modal__icon"
          aria-hidden="true"
        >
          <VerificationIcon />
        </div>

        <div className="verification-email-modal__copy">
          <p className="verification-email-modal__eyebrow">
            Almost there
          </p>

          <h2
            id="verification-modal-title"
            className="verification-email-modal__title"
          >
            Check your email
          </h2>

          <p
            id="verification-modal-description"
            className="verification-email-modal__description"
          >
            We sent a verification link to{' '}
            <strong>{email}</strong>. Please verify your email
            address before signing in.
          </p>
        </div>

        <button
          className="verification-email-modal__button"
          type="button"
          onClick={onConfirm}
          autoFocus
        >
          Continue to sign in
        </button>
      </div>
    </dialog>
  )
}

export default VerificationEmailModal