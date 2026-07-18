import { LoaderCircle } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '@/features/auth/use-current-user'
import { authClient } from '@/lib/auth-client'
import { APP_NAME } from '@/lib/brand'
import { AdminUsersPage } from '@/pages/admin-users-page'
import { AuthPage } from '@/pages/auth-page'
import { PendingPage } from '@/pages/pending-page'
import { WorkspacePage } from '@/pages/workspace-page'

export function AuthRoute() {
  const session = authClient.useSession()
  const currentUser = useCurrentUser({
    enabled: Boolean(session.data),
    refetchInterval: false,
  })

  if (session.isPending) {
    return <RouteLoader label="Opening sign in" />
  }

  if (!session.data) {
    return <AuthPage />
  }

  if (currentUser.isLoading) {
    return <RouteLoader label="Checking account status" />
  }

  if (currentUser.isError || !currentUser.data) {
    return <AuthPage />
  }

  // Admin users go to the admin panel
  if (currentUser.data.role === 'admin') {
    return <Navigate to="/admin/users" replace />
  }

  if (currentUser.data.approvalStatus === 'approved') {
    return <Navigate to="/workspace" replace />
  }

  return <Navigate to="/pending" replace />
}

export function WorkspaceRoute() {
  const session = authClient.useSession()
  const currentUser = useCurrentUser({
    enabled: Boolean(session.data),
    refetchInterval: false,
  })

  if (session.isPending) {
    return <RouteLoader label="Loading workspace" />
  }

  if (!session.data) {
    return <Navigate to="/auth" replace />
  }

  if (currentUser.isLoading) {
    return <RouteLoader label="Loading workspace" />
  }

  if (currentUser.isError || !currentUser.data) {
    return <Navigate to="/auth" replace />
  }

  if (currentUser.data.approvalStatus !== 'approved') {
    return <Navigate to="/pending" replace />
  }

  return <WorkspacePage />
}

export function PendingRoute() {
  const session = authClient.useSession()
  const currentUser = useCurrentUser({
    enabled: Boolean(session.data),
    refetchInterval: 3000,
  })

  if (session.isPending || currentUser.isLoading) {
    return <RouteLoader label="Checking approval" />
  }

  if (!session.data) {
    return <Navigate to="/auth" replace />
  }

  if (currentUser.isError || !currentUser.data) {
    return <Navigate to="/auth" replace />
  }

  if (currentUser.data.approvalStatus === 'approved') {
    return <Navigate to="/workspace" replace />
  }

  return <PendingPage />
}

export function AdminUsersRoute() {
  const session = authClient.useSession()
  const currentUser = useCurrentUser({
    enabled: Boolean(session.data),
    refetchInterval: false,
  })

  if (session.isPending) {
    return <RouteLoader label="Loading admin portal" />
  }

  if (!session.data) {
    return <Navigate to="/auth" replace />
  }

  if (currentUser.isLoading) {
    return <RouteLoader label="Loading admin portal" />
  }

  if (currentUser.isError || !currentUser.data || currentUser.data.role !== 'admin') {
    return <Navigate to="/auth" replace />
  }

  return <AdminUsersPage />
}

function RouteLoader({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-(--color-bg) px-5 text-(--color-text)">
      <div className="w-full max-w-sm border-t border-(--color-text) pt-5">
        <div className="flex items-center gap-3 text-sm font-medium"><LoaderCircle className="size-4 animate-spin text-(--color-accent)" />{label}</div>
        <p className="mt-3 text-sm text-(--color-text-dim)">{APP_NAME} is preparing the next screen.</p>
      </div>
    </main>
  )
}
