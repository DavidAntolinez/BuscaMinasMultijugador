import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GameOverPage } from './pages/GameOverPage'
import { GamePage } from './pages/GamePage'
import { MainMenuPage } from './pages/MainMenuPage'
import { WaitingRoomPage } from './pages/WaitingRoomPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenuPage />} />
        <Route path="/waiting/:roomId" element={<WaitingRoomPage />} />
        <Route path="/game/:roomId" element={<GamePage />} />
        <Route path="/game-over" element={<GameOverPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
