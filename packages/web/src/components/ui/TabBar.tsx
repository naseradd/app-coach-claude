import { motion } from 'motion/react';
import { Dumbbell, Archive, User } from 'lucide-react';
import { spring } from '../../design/motion.js';

export type TabId = 'coach' | 'archives' | 'profile';

interface Props {
  active: TabId;
  onChange: (id: TabId) => void;
  className?: string;
}

const TABS: { id: TabId; label: string; Icon: typeof Dumbbell }[] = [
  { id: 'coach',    label: 'Coach',    Icon: Dumbbell },
  { id: 'archives', label: 'Archives', Icon: Archive },
  { id: 'profile',  label: 'Profil',   Icon: User },
];

export function TabBar({ active, onChange, className }: Props) {
  return (
    <nav
      role="tablist"
      className={className}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        background: 'rgba(250,247,242,0.78)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid var(--separator)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div style={{ maxWidth: 430, margin: '0 auto', display: 'flex', height: 56 }}>
        {TABS.map(({ id, label, Icon }) => {
          const isActive = id === active;
          return (
            <motion.button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(id)}
              whileTap={{ scale: 0.94 }}
              transition={spring.tap}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                background: 'transparent',
                border: 0,
                padding: 4,
                cursor: 'pointer',
                color: isActive ? 'var(--accent)' : 'var(--ink-3)',
                minHeight: 44,
              }}
            >
              <motion.span
                animate={{ scale: isActive ? 1.05 : 1, y: isActive ? -1 : 0 }}
                transition={spring.default}
                style={{ display: 'inline-flex' }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  fill={isActive ? 'currentColor' : 'none'}
                />
              </motion.span>
              <span style={{ fontSize: 12, fontWeight: 500, lineHeight: '14px' }}>{label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
