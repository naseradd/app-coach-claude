import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { AppShell } from './components/shell/AppShell.js';

const Today = lazy(() => import('./pages/Today.js').then((m) => ({ default: m.Today })));
const SessionDetail = lazy(() =>
  import('./pages/SessionDetail.js').then((m) => ({ default: m.SessionDetail })),
);
const Workout = lazy(() => import('./pages/Workout.js').then((m) => ({ default: m.Workout })));
const History = lazy(() => import('./pages/History.js').then((m) => ({ default: m.History })));
const HistoryDetail = lazy(() =>
  import('./pages/HistoryDetail.js').then((m) => ({ default: m.HistoryDetail })),
);
const Settings = lazy(() => import('./pages/Settings.js').then((m) => ({ default: m.Settings })));
const Onboarding = lazy(() =>
  import('./pages/Onboarding.js').then((m) => ({ default: m.Onboarding })),
);

function Loader() {
  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
      <div className="t-footnote" style={{ color: 'var(--ink-3)' }}>
        Chargement…
      </div>
    </div>
  );
}

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<Loader />}>{node}</Suspense>;
}

export const router = createHashRouter([
  { path: '/onboarding', element: withSuspense(<Onboarding />) },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: withSuspense(<Today />) },
      { path: '/session/:id', element: withSuspense(<SessionDetail />) },
      { path: '/workout', element: withSuspense(<Workout />) },
      { path: '/history', element: withSuspense(<History />) },
      { path: '/history/:id', element: withSuspense(<HistoryDetail />) },
      { path: '/settings', element: withSuspense(<Settings />) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
