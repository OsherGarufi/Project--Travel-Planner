import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { apiRequest } from './apiClient'

export async function syncFirebaseUserWithBackend(firebaseUser) {
  const idToken = await firebaseUser.getIdToken(true)

  const backendUser = await apiRequest('/api/Auth/login', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  })

  return {
    firebaseUser,
    backendUser,
    idToken,
  }
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider()

  provider.setCustomParameters({
    prompt: 'select_account',
  })

  const result = await signInWithPopup(auth, provider)

  return syncFirebaseUserWithBackend(result.user)
}

export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  )

  if (!result.user.emailVerified) {
    await signOut(auth)

    throw new Error('EMAIL_NOT_VERIFIED')
  }

  return syncFirebaseUserWithBackend(result.user)
}

export async function registerWithEmail(
  displayName,
  email,
  password,
) {
  const result = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  )

  await updateProfile(result.user, {
    displayName,
  })

  await sendEmailVerification(result.user)

  await signOut(auth)

  return {
    email: result.user.email,
  }
}

export async function logoutFromFirebase() {
  await signOut(auth)
}