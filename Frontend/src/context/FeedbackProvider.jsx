import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import FeedbackViewport from '../components/feedback/FeedbackViewport'
import { FeedbackContext } from './FeedbackContext'

const DEFAULT_DURATION = 4500
const ERROR_DURATION = 6000

export function FeedbackProvider({
  children,
}) {
  const [messages, setMessages] =
    useState([])

  const nextIdRef = useRef(0)
  const timersRef = useRef(
    new Map(),
  )

  const dismissFeedback =
    useCallback((messageId) => {
      const timer =
        timersRef.current.get(
          messageId,
        )

      if (timer) {
        window.clearTimeout(timer)
        timersRef.current.delete(
          messageId,
        )
      }

      setMessages((currentMessages) =>
        currentMessages.filter(
          (message) =>
            message.id !== messageId,
        ),
      )
    }, [])

  const showFeedback = useCallback(
    (type, text, duration) => {
      if (
        type !== 'success' &&
        type !== 'error'
      ) {
        return
      }

      const normalizedText =
        typeof text === 'string'
          ? text.trim()
          : ''

      if (!normalizedText) {
        return
      }

      nextIdRef.current += 1
      const messageId =
        nextIdRef.current

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: messageId,
          type,
          text: normalizedText,
        },
      ])

      const resolvedDuration =
        Number.isFinite(duration) &&
        duration > 0
          ? duration
          : type === 'error'
            ? ERROR_DURATION
            : DEFAULT_DURATION

      const timer = window.setTimeout(
        () => {
          timersRef.current.delete(
            messageId,
          )

          setMessages(
            (currentMessages) =>
              currentMessages.filter(
                (message) =>
                  message.id !==
                  messageId,
              ),
          )
        },
        resolvedDuration,
      )

      timersRef.current.set(
        messageId,
        timer,
      )
    },
    [],
  )

  const showSuccess = useCallback(
    (text, duration) => {
      showFeedback(
        'success',
        text,
        duration,
      )
    },
    [showFeedback],
  )

  const showError = useCallback(
    (text, duration) => {
      showFeedback(
        'error',
        text,
        duration,
      )
    },
    [showFeedback],
  )

  useEffect(
    () => () => {
      for (
        const timer
        of timersRef.current.values()
      ) {
        window.clearTimeout(timer)
      }

      timersRef.current.clear()
    },
    [],
  )

  const contextValue = useMemo(
    () => ({
      showSuccess,
      showError,
      dismissFeedback,
    }),
    [
      dismissFeedback,
      showError,
      showSuccess,
    ],
  )

  return (
    <FeedbackContext.Provider
      value={contextValue}
    >
      {children}

      <FeedbackViewport
        messages={messages}
        onDismiss={dismissFeedback}
      />
    </FeedbackContext.Provider>
  )
}
