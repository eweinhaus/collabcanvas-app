import { useState, useEffect, lazy, Suspense } from 'react'
import './App.css'
import PrivateRoute from './components/auth/PrivateRoute'
import Header from './components/layout/Header'
import ConnectionBanner from './components/common/ConnectionBanner'
import Spinner from './components/common/Spinner'
import { useCanvas } from './context/CanvasContext'
import { CanvasProvider } from './context/CanvasContext'
import { CommentsProvider } from './context/CommentsContext'
import { useAuth } from './context/AuthContext'
import LayersPanel from './components/layout/LayersPanel'

// Lazy load heavy components (includes Konva - 969KB)
const Canvas = lazy(() => import('./components/canvas/Canvas'))
const Toolbar = lazy(() => import('./components/canvas/Toolbar'))
const Sidebar = lazy(() => import('./components/layout/Sidebar'))

function App() {
  return (
    <CanvasProvider>
      <CommentsProvider>
        <AppShell />
      </CommentsProvider>
    </CanvasProvider>
  )
}

function AppShell() {
  const { state: { onlineUsers, loadingShapes } } = useCanvas();
  const { loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [layersPanelOpen, setLayersPanelOpen] = useState(() => {
    const saved = localStorage.getItem('layersPanelOpen');
    return saved ? JSON.parse(saved) : false;
  });

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleToggleLayers = () => {
    setLayersPanelOpen(!layersPanelOpen);
  };

  // Persist layers panel state
  useEffect(() => {
    localStorage.setItem('layersPanelOpen', JSON.stringify(layersPanelOpen));
  }, [layersPanelOpen]);

  const isLoading = authLoading || loadingShapes;

  return (
    <div className="app">
      <Header onMenuToggle={handleMenuToggle} />
      <ConnectionBanner boardId="default" />
      <PrivateRoute>
        <main className="app-main">
          {isLoading ? (
            <div className="app-loading">
              <Spinner message="Loading canvas..." />
            </div>
          ) : (
            <Suspense fallback={<div className="app-loading"><Spinner message="Loading canvas..." /></div>}>
              <div className="app-main__canvas-area">
                <Toolbar 
                  onToggleLayers={handleToggleLayers} 
                  layersPanelOpen={layersPanelOpen} 
                />
                <Canvas 
                  showGrid={true} 
                  onCanvasClick={() => setLayersPanelOpen(false)} 
                />
              </div>
              <Sidebar open={sidebarOpen} users={onlineUsers} isHidden={layersPanelOpen} />
              <LayersPanel 
                isOpen={layersPanelOpen} 
                onClose={() => setLayersPanelOpen(false)} 
              />
            </Suspense>
          )}
        </main>
      </PrivateRoute>
    </div>
  );
}

export default App


