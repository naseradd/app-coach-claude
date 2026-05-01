import { motion } from 'motion/react';
import { Dumbbell, Archive, User, type LucideIcon } from 'lucide-react';
import { spring } from '../../design/motion.js';

export type TabId = 'coach' | 'archives' | 'profile';

export interface TabConfig<Id extends string = string> {
  id: Id;
  label: string;
  icon: LucideIcon;
  iconActive?: LucideIcon;
}

interface Props<Id extends string = TabId> {
  active: Id;
  onChange: (id: Id) => void;
  tabs?: TabConfig<Id>[];
  className?: string;
}

const DEFAULT_TABS: TabConfig<TabId>[] = [
  { id: 'coach',    label: 'Coach',    icon: Dumbbell },
  { id: 'archives', label: 'Archives', icon: Archive },
  { id: 'profile',  label: 'Profil',   icon: User },
];

export function TabBar<Id extends string = TabId>({
  active,
  onChange,
  tabs,
  className,
}: Props<Id>) {
  const items = (tabs ?? (DEFAULT_TABS as unknown as TabConfig<Id>[]));
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
        background: 'var(--material)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid var(--separator)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div style={{ maxWidth: 430, margin: '0 auto', display: 'flex', height: 56 }}>
        {items.map(({ id, label, icon: Icon, iconActive: IconActive }) => {
          const isActive = id === active;
          const RenderedIcon = isActive && IconActive ? IconActive : Icon;
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
                <RenderedIcon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  fill={isActive && !IconActive ? 'currentColor' : 'none'}
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
