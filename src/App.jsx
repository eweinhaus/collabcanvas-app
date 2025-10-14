import { useState } from 'react'
import './App.css'
import PrivateRoute from './components/auth/PrivateRoute'
import Canvas from './components/canvas/Canvas'
import Toolbar from './components/canvas/Toolbar'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import Spinner from './components/common/Spinner'
import ToastContainer from './components/common/ToastContainer'
import { useCanvas } from './context/CanvasContext'
import { CanvasProvider } from './context/CanvasContext'
import { AIProvider, useAI } from './context/AIContext'
import { useAuth } from './context/AuthContext'

function App() {
  return (
    <CanvasProvider>
      <AIProvider>
        <AppShell />
      </AIProvider>
    </CanvasProvider>
  )
}

function AppShell() {
  const { state: { onlineUsers, loadingShapes } } = useCanvas();
  const { loading: authLoading } = useAuth();
  const { toast } = useAI();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isLoading = authLoading || loadingShapes;

  return (
    <div className="app">
      <Header onMenuToggle={handleMenuToggle} />
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
      <PrivateRoute>
        <main className="app-main">
          {isLoading ? (
            <div className="app-loading">
              <Spinner message="Loading canvas..." />
            </div>
          ) : (
            <>
              <div className="app-main__canvas-area">
                <Toolbar />
                <Canvas showGrid={true} />
              </div>
              <Sidebar open={sidebarOpen} users={onlineUsers} />
            </>
          )}
        </main>
      </PrivateRoute>
    </div>
  );
}

export default App


