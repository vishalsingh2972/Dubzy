import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/ui/app-shell'
import { LandingPage } from '@/pages/landing-page'
import {
  AdminUsersRoute,
  AuthRoute,
  PendingRoute,
  WorkspaceRoute,
} from './route-gates'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'auth',
        element: <AuthRoute />,
      },
      {
        path: 'workspace',
        element: <WorkspaceRoute />,
      },
      {
        path: 'pending',
        element: <PendingRoute />,
      },
      {
        path: 'admin/users',
        element: <AdminUsersRoute />,
      },
      {
        // Redirect old admin/login to auth
        path: 'admin/login',
        element: <Navigate to="/auth" replace />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
