import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Today } from './pages/Today'
import { Programme } from './pages/Programme'
import { History } from './pages/History'
import { Import } from './pages/Import'
import { BottomNav } from './components/BottomNav'
import { useProgramStore } from './store/program.store'

function AppShell() {
  const { loadFromDB } = useProgramStore()

  useEffect(() => {
    loadFromDB()
  }, [])

  return (
    <div className="flex flex-col max-w-[390px] mx-auto relative" style={{ minHeight: '100dvh' }}>
      <main className="flex flex-col flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/programme" element={<Programme />} />
          <Route path="/history" element={<History />} />
          <Route path="/import" element={<Import />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}
