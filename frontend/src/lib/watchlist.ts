const storageKey = (userId: string) => `hyperadar:watchlist:${userId}`

export function getWatchlist(userId: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) ?? '[]')
  } catch {
    return []
  }
}

export function addToWatchlist(userId: string, symbol: string): void {
  const list = getWatchlist(userId)
  if (!list.includes(symbol)) {
    localStorage.setItem(storageKey(userId), JSON.stringify([...list, symbol]))
  }
}

export function removeFromWatchlist(userId: string, symbol: string): void {
  const list = getWatchlist(userId)
  localStorage.setItem(storageKey(userId), JSON.stringify(list.filter(s => s !== symbol)))
}

export function isWatchlisted(userId: string, symbol: string): boolean {
  return getWatchlist(userId).includes(symbol)
}
