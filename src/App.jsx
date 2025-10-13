import './App.css'
import LoginButton from './components/auth/LoginButton'
import PrivateRoute from './components/auth/PrivateRoute'
import Canvas from './components/canvas/Canvas'
import Toolbar from './components/canvas/Toolbar'
import { CanvasProvider } from './context/CanvasContext'

function App() {
  return (
    <CanvasProvider>
      <div className="app">
        <header className="app-header">
          <h1>CollabCanvas</h1>
          <LoginButton />
        </header>
        
        <PrivateRoute>
          <main className="app-main">
            <Toolbar />
            <Canvas showGrid={true} />
          </main>
        </PrivateRoute>
      </div>
    </CanvasProvider>
  )
}

export default App


