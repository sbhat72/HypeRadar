export async function apiGet(path: string) {
  const res = await fetch(`/api${path}`)
  return res.json()
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

// Server Component helper — attaches the Clerk JWT to requests to the Spring Boot backend
export async function apiFetch(path: string, options?: RequestInit) {
  const { auth } = await import('@clerk/nextjs/server')
  const { getToken } = await auth()
  const token = await getToken()

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  })
}
