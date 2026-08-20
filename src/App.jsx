import './styles/app.css'
import { useEffect, useState } from 'react'
import Home from './pages/Home.jsx'
import Workspace from './pages/Workspace.jsx'

function App() {
  const [view, setView] = useState(() => window.location.pathname === '/workspace' ? 'workspace' : 'landing')

  useEffect(() => {
    const syncView = () => setView(window.location.pathname === '/workspace' ? 'workspace' : 'landing')
    window.addEventListener('popstate', syncView)
    return () => window.removeEventListener('popstate', syncView)
  }, [])

  if (view === 'workspace') {
    return <Workspace />
  }

  return <Home onOpenWorkspace={(repositoryUrl) => {
    const query = repositoryUrl ? `?repo=${encodeURIComponent(repositoryUrl)}` : ''
    window.history.pushState({}, '', `/workspace${query}`)
    setView('workspace')
  }} />
}

export default App
