import { useAuth } from '@clerk/nextjs'
import { useCallback } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export function useApiClient() {
  const { getToken } = useAuth()

  const apiCall = useCallback(async (path: string, options?: RequestInit) => {
    const token = await getToken()
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token? {'Authorization': `Bearer ${token}`} : {}),
        ...options?.headers,
      },
    })
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null
    }
    return response.json()
  }, [getToken])

  return { apiCall }
}
