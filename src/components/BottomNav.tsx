import { useLocation, useNavigate } from 'react-router-dom'
import { Home, BookOpen, History } from 'lucide-react'

const TABS = [
  { path: '/',          label: "Aujourd'hui", icon: Home },
  { path: '/programme', label: 'Programme',   icon: BookOpen },
  { path: '/history',   label: 'Historique',  icon: History },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-white/90 backdrop-blur-xl border-t border-border max-w-[390px] mx-auto">
        <div className="flex items-stretch">
          {TABS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex-1 flex flex-col items-center justify-center pt-3 pb-2 gap-1 transition-all relative ${
                  active ? 'text-text' : 'text-faint hover:text-muted'
                }`}
              >
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-accent rounded-t-full" />
                )}
                <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
                <span className="text-[10px] font-condensed font-semibold tracking-wide">{label}</span>
              </button>
            )
          })}
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} className="bg-white/90" />
      </div>
    </nav>
  )
}
