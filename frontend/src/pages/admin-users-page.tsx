import { useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  UserRoundPlus,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminUsers, useApproveAdminUserMutation } from '@/features/admin/use-admin-users'
import { authClient } from '@/lib/auth-client'
import { Brand } from './landing-page'

const tabs = ['pending', 'approved'] as const

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const formatDate = (value: string | null) => {
  if (!value) {
    return 'Not approved'
  }

  return dateFormatter.format(new Date(value))
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

type AdminUser = ReturnType<typeof useAdminUsers>['data'] extends (infer T)[] | undefined
  ? T
  : never

function Status({ status }: { status: AdminUser['approvalStatus'] }) {
  const isPending = status === 'pending'

  return (
    <span className={`ui-status ${isPending ? 'ui-status-pending' : 'ui-status-complete'} font-semibold capitalize`}>
      {status}
    </span>
  )
}

export function AdminUsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('pending')
  const { data: users = [], isLoading } = useAdminUsers(activeTab)
  const approveMutation = useApproveAdminUserMutation()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleLogout = async () => {
    setIsSigningOut(true)

    try {
      await authClient.signOut()
      queryClient.clear()
      navigate('/auth', { replace: true })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-(--color-bg) text-(--color-text)">
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 md:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-(--color-border) pb-5">
          <Brand />
          <button
            aria-label={isSigningOut ? 'Signing out' : 'Log out'}
            className="ui-button ui-button-secondary min-h-11 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningOut}
            onClick={handleLogout}
            type="button"
          >
            {isSigningOut ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            <span className="hidden sm:inline">Log out</span>
          </button>
        </header>

        <div className="flex flex-col gap-6 py-9 sm:flex-row sm:items-end sm:justify-between sm:py-11">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">User access</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-(--color-text-dim) sm:text-base">
              Review new creators and educators before their workspace becomes available.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-(--color-text-dim)">
            <ShieldCheck className="size-4 text-(--color-success)" />
            Admin workspace
          </div>
        </div>

        <div className="mb-5 inline-flex border border-(--color-border) bg-(--color-surface) p-1" role="tablist" aria-label="User approval status">
          {tabs.map((tab) => (
            <button
              aria-selected={activeTab === tab}
              className={`min-h-10 px-4 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-(--color-selection) text-(--color-blue)'
                  : 'text-(--color-text-dim) hover:bg-(--color-panel) hover:text-(--color-text)'
              }`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              type="button"
            >
              {tab === 'pending' ? 'Pending' : 'Approved'}
            </button>
          ))}
        </div>

        <section className="border-t border-(--color-text) bg-(--color-surface)" aria-busy={isLoading}>
          {isLoading ? (
            <div aria-label="Loading users" className="divide-y divide-(--color-border)">
              {[0, 1, 2].map((row) => (
                <div className="grid animate-pulse grid-cols-[2fr_1fr] gap-6 px-5 py-6 lg:grid-cols-[1.45fr_1fr_0.75fr_0.8fr_auto]" key={row}>
                  <div className="h-5 max-w-64 bg-(--color-panel)" />
                  <div className="h-5 bg-(--color-panel)" />
                  <div className="hidden h-5 bg-(--color-panel) lg:block" />
                  <div className="hidden h-5 bg-(--color-panel) lg:block" />
                  <div className="h-9 w-24 justify-self-end bg-(--color-panel)" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center sm:py-20">
                <span className="mb-5 grid size-12 place-items-center bg-(--color-selection) text-(--color-blue)">
                  <ShieldCheck className="size-6" />
                </span>
                <div>
                  <p className="font-semibold">No {activeTab} users</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-(--color-text-dim)">
                    {activeTab === 'pending'
                      ? 'New access requests will appear here for review.'
                      : 'Approved accounts will appear here after access is granted.'}
                  </p>
                </div>
              </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[920px] table-fixed text-left">
                  <thead className="border-b border-(--color-border) bg-(--color-panel)">
                    <tr className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-(--color-text-dim)">
                      <th className="w-[30%] px-5 py-3 font-medium" scope="col">User</th>
                      <th className="w-[18%] px-4 py-3 font-medium" scope="col">Signed up</th>
                      <th className="w-[14%] px-4 py-3 font-medium" scope="col">Status</th>
                      <th className="w-[20%] px-4 py-3 font-medium" scope="col">Approved</th>
                      <th className="w-[18%] px-5 py-3 text-right font-medium" scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--color-border)">
                    {users.map((user) => {
                      const isApproving = approveMutation.isPending && approveMutation.variables === user.id
                      return (
                        <tr className="group transition-colors hover:bg-(--color-panel)/60" key={user.id}>
                          <td className="px-5 py-4 align-middle">
                            <div className="flex min-w-0 items-center gap-3">
                              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center bg-(--color-panel-strong) text-xs font-bold text-(--color-text-dim)">{getInitials(user.name)}</span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{user.name}</p>
                                <p className="mt-0.5 truncate text-sm text-(--color-text-dim)">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-middle text-sm text-(--color-text-dim)">{formatDate(user.createdAt)}</td>
                          <td className="px-4 py-4 align-middle"><Status status={user.approvalStatus} /></td>
                          <td className="px-4 py-4 align-middle text-sm text-(--color-text-dim)">{formatDate(user.approvedAt)}</td>
                          <td className="px-5 py-4 text-right align-middle">
                            {user.approvalStatus === 'pending' ? (
                              <button className="ui-button ui-button-primary min-h-10 disabled:cursor-not-allowed disabled:opacity-60" disabled={isApproving} onClick={() => approveMutation.mutate(user.id)} type="button">
                                {isApproving ? <LoaderCircle className="size-4 animate-spin" /> : <UserRoundPlus className="size-4" />}
                                Approve
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-success)"><CheckCircle2 className="size-4" /> Access granted</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-(--color-border) lg:hidden">
                {users.map((user) => {
                const isApproving =
                  approveMutation.isPending && approveMutation.variables === user.id

                return (
                  <article className="px-4 py-5 sm:px-5" key={user.id}>
                    <div className="flex items-start gap-3">
                      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center bg-(--color-panel-strong) text-xs font-bold text-(--color-text-dim)">{getInitials(user.name)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate font-semibold">{user.name}</h2>
                            <p className="mt-1 truncate text-sm text-(--color-text-dim)">{user.email}</p>
                          </div>
                          <Status status={user.approvalStatus} />
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-(--color-text-dim)">
                          <Clock3 className="size-3.5" />
                          {user.approvalStatus === 'pending' ? 'Requested' : 'Approved'} {formatDate(user.approvalStatus === 'pending' ? user.createdAt : user.approvedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-5">
                      {user.approvalStatus === 'pending' ? (
                        <button
                          className="ui-button ui-button-primary min-h-11 w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                          disabled={isApproving}
                          onClick={() => approveMutation.mutate(user.id)}
                          type="button"
                        >
                          {isApproving ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <UserRoundPlus className="size-4" />
                          )}
                          Approve
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-success)">
                          <CheckCircle2 className="size-4" />
                          Workspace access granted
                        </span>
                      )}
                    </div>
                  </article>
                )
                })}
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  )
}
