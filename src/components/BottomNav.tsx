import { useLocation, useNavigate } from 'react-router-dom'
import { Home, BookOpen, History, Settings } from 'lucide-react'

const TABS = [
  { path: '/', label: "Aujourd'hui", icon: Home },
  { path: '/programme', label: 'Programme', icon: BookOpen },
  { path: '/history', label: 'Historique', icon: History },
  { path: '/settings', label: 'Réglages', icon: Settings },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 z-40">
      <div className="flex items-stretch max-w-lg mx-auto">
        {TABS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
                active ? 'text-orange-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
      {/* iOS safe area */}
      <div className="h-safe-area-bottom bg-zinc-900/95" />
    </nav>
  )
}
