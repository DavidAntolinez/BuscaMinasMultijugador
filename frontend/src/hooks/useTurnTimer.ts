import { useEffect, useState } from 'react'
import { formatRemainingTime } from '../utils/turn.utils'

export function useTurnTimer(initialMs: number | null): string {
  const [remainingMs, setRemainingMs] = useState(initialMs ?? 0)

  useEffect(() => {
    setRemainingMs(initialMs ?? 0)
    if (initialMs === null) {
      return
    }

    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      setRemainingMs(Math.max(0, initialMs - elapsed))
    }, 250)

    return () => window.clearInterval(interval)
  }, [initialMs])

  return formatRemainingTime(remainingMs)
}
