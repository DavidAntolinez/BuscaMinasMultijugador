const PLAYER_ID_KEY = 'minesweeper-player-id'
const USERNAME_KEY = 'minesweeper-username'

export function getOrCreatePlayerId(): string {
  const existing = localStorage.getItem(PLAYER_ID_KEY)
  if (existing) {
    return existing
  }

  const id = crypto.randomUUID()
  localStorage.setItem(PLAYER_ID_KEY, id)
  return id
}

export function getStoredUsername(): string {
  return localStorage.getItem(USERNAME_KEY) ?? ''
}

export function saveUsername(username: string): void {
  localStorage.setItem(USERNAME_KEY, username.trim())
}

export function clearSessionStorage(): void {
  localStorage.removeItem(PLAYER_ID_KEY)
  localStorage.removeItem(USERNAME_KEY)
}
