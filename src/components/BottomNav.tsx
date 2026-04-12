import { useLocation, useNavigate } from 'react-router-dom'
import { Home, BookOpen, History, Settings } from 'lucide-react'

const TABS = [
  { path: '/',          label: "Aujourd'hui", icon: Home },
  { path: '/programme', label: 'Programme',   icon: BookOpen },
  { path: '/history',   label: 'Historique',  icon: History },
  { path: '/settings',  label: 'Réglages',    icon: Settings },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-[#0C0C14]/90 backdrop-blur-xl border-t border-edge max-w-lg mx-auto">
        <div className="flex items-stretch">
          {TABS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all relative ${
                  active ? 'text-lime' : 'text-faint hover:text-muted'
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-lime rounded-b-full" />
                )}
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-condensed font-semibold tracking-wide">{label}</span>
              </button>
            )
          })}
        </div>
        <div className="h-safe-area-bottom bg-[#0C0C14]/90" />
      </div>
    </nav>
  )
}
