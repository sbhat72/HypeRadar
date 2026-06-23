export interface Alert {
  id: string
  ticker: string
  threshold: number
  email: string
  createdAt: string
}

const storageKey = (userId: string) => `hyperadar:alerts:${userId}`

export function getAlerts(userId: string): Alert[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) ?? '[]')
  } catch {
    return []
  }
}

export function addAlert(userId: string, alert: Alert): void {
  if (typeof window === 'undefined') return
  try {
    const list = getAlerts(userId)
    localStorage.setItem(storageKey(userId), JSON.stringify([...list, alert]))
  } catch {
    // quota exceeded or storage unavailable — silently drop
  }
}

export function removeAlert(userId: string, id: string): void {
  if (typeof window === 'undefined') return
  try {
    const list = getAlerts(userId)
    localStorage.setItem(storageKey(userId), JSON.stringify(list.filter(a => a.id !== id)))
  } catch {
    // quota exceeded or storage unavailable — silently drop
  }
}
