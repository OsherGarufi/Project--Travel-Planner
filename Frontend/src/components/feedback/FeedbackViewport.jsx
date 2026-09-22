import '../../css/components/feedback-viewport.css'

function FeedbackViewport({
  messages,
  onDismiss,
}) {
  if (messages.length === 0) {
    return null
  }

  return (
    <div
      className="feedback-viewport"
      aria-label="Notifications"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`feedback-viewport__message feedback-viewport__message--${message.type}`}
          role={
            message.type === 'error'
              ? 'alert'
              : 'status'
          }
        >
          <span
            className="feedback-viewport__icon"
            aria-hidden="true"
          >
            {message.type === 'error'
              ? '!'
              : '✓'}
          </span>

          <p className="feedback-viewport__text">
            {message.text}
          </p>

          <button
            className="feedback-viewport__dismiss"
            type="button"
            aria-label="Dismiss notification"
            onClick={() =>
              onDismiss(message.id)
            }
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export default FeedbackViewport
