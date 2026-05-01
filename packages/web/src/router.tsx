import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell.js';
import { Today } from './pages/Today.js';
import { SessionDetail } from './pages/SessionDetail.js';
import { Workout } from './pages/Workout.js';
import { History } from './pages/History.js';
import { HistoryDetail } from './pages/HistoryDetail.js';
import { Settings } from './pages/Settings.js';
import { Onboarding } from './pages/Onboarding.js';

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
