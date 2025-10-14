import './App.css'
import LoginButton from './components/auth/LoginButton'
import PrivateRoute from './components/auth/PrivateRoute'
import Canvas from './components/canvas/Canvas'
import Toolbar from './components/canvas/Toolbar'
import PresenceList from './components/collaboration/PresenceList'
import { useCanvas } from './context/CanvasContext'
import { CanvasProvider } from './context/CanvasContext'

function App() {
  return (
    <CanvasProvider>
      <AppShell />
    </CanvasProvider>
  )
}

function AppShell() {
  const { state: { onlineUsers } } = useCanvas();
  return (
    <div className="app">
      <header className="app-header">
        <h1>CollabCanvas</h1>
        <LoginButton />
      </header>
      <PrivateRoute>
        <main className="app-main">
          <div className="app-main__canvas-area">
            <Toolbar />
            <Canvas showGrid={true} />
          </div>
          <PresenceList users={onlineUsers} />
        </main>
      </PrivateRoute>
    </div>
  );
}

export default App


