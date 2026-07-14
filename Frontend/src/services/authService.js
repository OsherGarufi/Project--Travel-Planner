import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
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

  const result = await signInWithPopup(auth, provider)

  return syncFirebaseUserWithBackend(result.user)
}

export async function logoutFromFirebase() {
  await signOut(auth)
}