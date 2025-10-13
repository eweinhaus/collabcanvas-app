import './App.css'
import LoginButton from './components/auth/LoginButton'
import PrivateRoute from './components/auth/PrivateRoute'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>CollabCanvas</h1>
        <LoginButton />
      </header>
      
      <PrivateRoute>
        <main className="app-main">
          <div className="welcome-content">
            <h2>Welcome to CollabCanvas!</h2>
            <p>Real-time collaborative canvas application</p>
            <p className="info-text">
              You are now authenticated. Canvas functionality will be added in the next PRs.
            </p>
          </div>
        </main>
      </PrivateRoute>
    </div>
  )
}

export default App


