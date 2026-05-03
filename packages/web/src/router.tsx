import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import { lazy } from 'react';
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

export const router = createHashRouter([
  { path: '/onboarding', element: <Onboarding /> },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Today /> },
      { path: '/session/:id', element: <SessionDetail /> },
      { path: '/workout', element: <Workout /> },
      { path: '/history', element: <History /> },
      { path: '/history/:id', element: <HistoryDetail /> },
      { path: '/settings', element: <Settings /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
