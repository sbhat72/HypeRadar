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

const API_BASE = process.env.NEXT_PUBLIC_API_URL
if (!API_BASE) {
  throw new Error('NEXT_PUBLIC_API_URL is not set — add it to frontend/.env.local')
}

// Server Component helper — attaches the Clerk JWT to requests to the Spring Boot backend
export async function apiFetch(path: string, options?: RequestInit) {
  const { auth } = await import('@clerk/nextjs/server')
  const { getToken } = await auth()
  const token = await getToken()

  const headers = new Headers(options?.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Authorization', `Bearer ${token}`)

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })
}
