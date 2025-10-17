import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import './App.css'
import PrivateRoute from './components/auth/PrivateRoute'
import Header from './components/layout/Header'
import ConnectionBanner from './components/common/ConnectionBanner'
import Spinner from './components/common/Spinner'
import { useCanvas } from './context/CanvasContext'
import { CanvasProvider } from './context/CanvasContext'
import { CommentsProvider } from './context/CommentsContext'
import { AIProvider, useAI } from './context/AIContext'
import { useAuth } from './context/AuthContext'
import LayersPanel from './components/layout/LayersPanel'
import AIPanel from './components/ai/AIPanel'

// Lazy load heavy components (includes Konva - 969KB)
const Canvas = lazy(() => import('./components/canvas/Canvas'))
const Toolbar = lazy(() => import('./components/canvas/Toolbar'))
const Sidebar = lazy(() => import('./components/layout/Sidebar'))

function App() {
  return (
    <CanvasProvider>
      <CommentsProvider>
        <AIProvider>
          <AppShell />
        </AIProvider>
      </CommentsProvider>
    </CanvasProvider>
  )
}

function AppShell() {
  const { state: { onlineUsers, loadingShapes } } = useCanvas();
  const { loading: authLoading } = useAuth();
  const { panelOpen: aiPanelOpen, openPanel: openAIPanel, closePanel: closeAIPanel } = useAI();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [layersPanelOpen, setLayersPanelOpen] = useState(() => {
    const saved = localStorage.getItem('layersPanelOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const openShortcutsRef = useRef(null);

  const registerOpenShortcuts = useCallback((openFn) => {
    // Store the provided open function without calling it
    openShortcutsRef.current = openFn;
  }, []);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleOpenShortcuts = useCallback(() => {
    if (openShortcutsRef.current) {
      openShortcutsRef.current();
    }
  }, []);

  const handleToggleLayers = useCallback(() => {
    const newLayersOpen = !layersPanelOpen;
    setLayersPanelOpen(newLayersOpen);
    // Close AI panel when layers panel opens
    if (newLayersOpen && aiPanelOpen) {
      closeAIPanel();
    }
  }, [layersPanelOpen, aiPanelOpen, closeAIPanel]);

  const handleToggleAI = useCallback(() => {
    const newAIOpen = !aiPanelOpen;
    if (newAIOpen) {
      openAIPanel();
      // Close layers panel when AI panel opens
      if (layersPanelOpen) {
        setLayersPanelOpen(false);
      }
    } else {
      closeAIPanel();
    }
  }, [aiPanelOpen, layersPanelOpen, openAIPanel, closeAIPanel]);

  // Persist layers panel state
  useEffect(() => {
    localStorage.setItem('layersPanelOpen', JSON.stringify(layersPanelOpen));
  }, [layersPanelOpen]);

  // Global keyboard shortcut for AI panel (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to toggle AI panel
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleToggleAI();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleAI]);

  const isLoading = authLoading || loadingShapes;

  return (
    <div className="app">
      <Header onMenuToggle={handleMenuToggle} onOpenShortcuts={handleOpenShortcuts} />
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
                  onToggleAI={handleToggleAI}
                  layersPanelOpen={layersPanelOpen}
                  aiPanelOpen={aiPanelOpen}
                />
                <Canvas 
                  showGrid={true} 
                  onCanvasClick={() => setLayersPanelOpen(false)}
                  onOpenShortcuts={registerOpenShortcuts}
                />
              </div>
              <Sidebar open={sidebarOpen} users={onlineUsers} isHidden={layersPanelOpen} />
              <LayersPanel 
                isOpen={layersPanelOpen} 
                onClose={() => setLayersPanelOpen(false)} 
              />
              <AIPanel />
            </Suspense>
          )}
        </main>
      </PrivateRoute>
    </div>
  );
}

export default App


