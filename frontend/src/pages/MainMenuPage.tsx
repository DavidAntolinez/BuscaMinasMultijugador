import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AppLayout } from '../layouts/AppLayout'
import { useGameStore } from '../stores/gameStore'
import { validateUsername } from '../utils/validation.utils'
import { CreateGamePanel } from './CreateGamePanel'
import { SearchGamePanel } from './SearchGamePanel'

type MenuView = 'menu' | 'create' | 'search'

export function MainMenuPage() {
  const navigate = useNavigate()
  const username = useGameStore((state) => state.username)
  const setUsername = useGameStore((state) => state.setUsername)
  const room = useGameStore((state) => state.room)
  const [view, setView] = useState<MenuView>('menu')
  const [usernameError, setUsernameError] = useState<string>()

  const ensureUsername = (): boolean => {
    const error = validateUsername(username)
    setUsernameError(error)
    return !error
  }

  const openView = (nextView: MenuView) => {
    if (!ensureUsername()) {
      return
    }
    setView(nextView)
  }

  useEffect(() => {
    if (room?.status === 'WAITING') {
      navigate(`/waiting/${room.id}`)
    }
  }, [navigate, room])

  return (
    <AppLayout
      title="Menú principal"
      subtitle="Crea una partida nueva o únete a una sala disponible."
    >
      <Input
        label="Nombre de usuario"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        error={usernameError}
        placeholder="Tu nickname"
      />

      {view === 'menu' ? (
        <div className="menu-actions">
          <Button onClick={() => openView('create')}>Crear Partida</Button>
          <Button variant="secondary" onClick={() => openView('search')}>
            Buscar Partida
          </Button>
        </div>
      ) : null}

      {view === 'create' ? (
        <CreateGamePanel onBack={() => setView('menu')} />
      ) : null}

      {view === 'search' ? (
        <SearchGamePanel onBack={() => setView('menu')} />
      ) : null}
    </AppLayout>
  )
}
