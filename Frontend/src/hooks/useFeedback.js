import { useContext } from 'react'
import { FeedbackContext } from '../context/FeedbackContext'

export function useFeedback() {
  const feedbackContext =
    useContext(FeedbackContext)

  if (!feedbackContext) {
    throw new Error(
      'useFeedback must be used inside a FeedbackProvider',
    )
  }

  return feedbackContext
}
