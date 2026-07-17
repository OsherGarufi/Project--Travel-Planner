import { useState } from 'react'

function getInitials(displayName) {
  const normalizedName = displayName?.trim()

  if (!normalizedName) {
    return '?'
  }

  const nameParts = normalizedName
    .split(/\s+/)
    .filter(Boolean)

  if (nameParts.length === 1) {
    return nameParts[0]
      .slice(0, 2)
      .toUpperCase()
  }

  const firstInitial = nameParts[0][0]
  const lastInitial =
    nameParts[nameParts.length - 1][0]

  return `${firstInitial}${lastInitial}`.toUpperCase()
}

function ProfileAvatar({
  photoUrl,
  displayName,
  size = 80,
}) {
  const [failedPhotoUrl, setFailedPhotoUrl] =
    useState(null)

  const initials = getInitials(displayName)

  const sharedStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
  }

  const shouldDisplayPhoto =
    photoUrl && failedPhotoUrl !== photoUrl

  if (shouldDisplayPhoto) {
    return (
      <img
        src={photoUrl}
        alt={`${displayName || 'User'} profile`}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setFailedPhotoUrl(photoUrl)}
        style={{
          ...sharedStyle,
          objectFit: 'cover',
        }}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={`${displayName || 'User'} profile`}
      title={displayName || 'User'}
      style={{
        ...sharedStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e5e7eb',
        color: '#1f2937',
        fontSize: `${size * 0.35}px`,
        fontWeight: '600',
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  )
}

export default ProfileAvatar