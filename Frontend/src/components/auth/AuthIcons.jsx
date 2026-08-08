export function AuthAlertIcon() {
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
        d="M12 7.75v5.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="16.25"
        r="1"
        fill="currentColor"
      />
    </svg>
  )
}

export function PasswordVisibilityIcon({ isVisible }) {
  if (isVisible) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M3 3 21 21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M10.6 10.75a2 2 0 0 0 2.65 2.65"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M9.9 4.4A9.8 9.8 0 0 1 12 4.18c5.5 0 9 5.82 9 7.82a8.7 8.7 0 0 1-2.25 3.75M6.35 6.35C4.28 7.77 3 10.4 3 12c0 2 3.5 7.82 9 7.82 1.4 0 2.65-.38 3.75-1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 12c0-2 3.5-7.82 9-7.82S21 10 21 12s-3.5 7.82-9 7.82S3 14 3 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="2.75"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}