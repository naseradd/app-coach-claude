import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Dumbbell, Archive, User, type LucideIcon } from 'lucide-react';
import { TabBar, type TabConfig } from '../ui/TabBar.js';
import { PageTransition } from './PageTransition.js';

type ShellTabId = 'coach' | 'archives' | 'profile';

interface ShellTab extends TabConfig<ShellTabId> {
  route: string;
  icon: LucideIcon;
}

const TABS: ShellTab[] = [
  { id: 'coach', label: 'Coach', icon: Dumbbell, route: '/' },
  { id: 'archives', label: 'Archives', icon: Archive, route: '/history' },
  { id: 'profile', label: 'Profil', icon: User, route: '/settings' },
];

function activeTabFor(pathname: string): ShellTabId {
  if (pathname.startsWith('/history')) return 'archives';
  if (pathname.startsWith('/settings')) return 'profile';
  return 'coach';
}

/**
 * Mobile-first shell with bottom TabBar + page transitions.
 * Hides TabBar when a workout is active (full-screen takeover).
 */
export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = activeTabFor(location.pathname);

  const isWorkout = location.pathname.startsWith('/workout');

  return (
    <div
      style={{
        minHeight: '100dvh',
        maxWidth: 430,
        margin: '0 auto',
        position: 'relative',
        paddingBottom: isWorkout ? 0 : 84,
      }}
    >
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname} routeKey={location.pathname}>
          <Outlet />
        </PageTransition>
      </AnimatePresence>
      {isWorkout ? null : (
        <TabBar<ShellTabId>
          active={active}
          tabs={TABS.map(({ id, label, icon }) => ({ id, label, icon }))}
          onChange={(id) => {
            const tab = TABS.find((t) => t.id === id);
            if (tab) navigate(tab.route);
          }}
        />
      )}
    </div>
  );
}
