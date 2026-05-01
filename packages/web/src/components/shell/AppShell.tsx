import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Dumbbell, Archive, User, type LucideIcon } from 'lucide-react';
import { TabBar, type TabConfig } from '../ui/TabBar.js';
import { PageTransition } from './PageTransition.js';
import { useWorkout } from '../../store/workout.store.js';

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

  // Auto-resume: if useApiBoot restored an in-flight workout from the server,
  // pull the user into /workout once. We consume the flag immediately so the
  // user can navigate away without being trapped in a redirect loop.
  const resumed = useWorkout((s) => s.resumed);
  const sessionId = useWorkout((s) => s.sessionId);
  const phase = useWorkout((s) => s.phase);
  const clearResumed = useWorkout((s) => s.clearResumed);
  useEffect(() => {
    if (!resumed) return;
    clearResumed();
    if (phase === 'done' || !sessionId) return;
    if (!location.pathname.startsWith('/workout')) {
      navigate(`/workout?session=${sessionId}&resume=1`, { replace: true });
    }
  }, [resumed, sessionId, phase, clearResumed, navigate, location.pathname]);

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
