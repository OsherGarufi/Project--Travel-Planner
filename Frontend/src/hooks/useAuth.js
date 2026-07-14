import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export function useAuth() {
  const authContext = useContext(AuthContext)

  if (!authContext) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }

  return authContext
}