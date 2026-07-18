import { useQueryClient } from '@tanstack/react-query'
import { Clock3, LoaderCircle, LogOut, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authClient } from '@/lib/auth-client'
import { useCurrentUser } from '@/features/auth/use-current-user'
import { Brand } from './landing-page'

export function PendingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { data: currentUser } = useCurrentUser({
    enabled: true,
    refetchInterval: 3000,
  })

  const handleSignOut = async () => {
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
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 md:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-4 border-b border-(--color-border) pb-6">
          <Brand />
          <button
            className="ui-button ui-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningOut}
            onClick={handleSignOut}
            type="button"
          >
            {isSigningOut ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Sign out
          </button>
        </div>

        <div className="my-auto grid gap-12 py-16 lg:grid-cols-[1.05fr_0.75fr] lg:items-center">
          <div>
            <p className="text-sm font-medium text-(--color-text-dim)">Account received</p>
            <h1 className="mt-4 font-serif text-5xl leading-[0.98] tracking-[-0.035em] md:text-6xl">
              Your studio is almost ready.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-(--color-text-dim)">
              {currentUser?.email
                ? `${currentUser.email} has signed in successfully, but uploads stay locked until an admin approves the account.`
                : 'You are signed in successfully, but uploads stay locked until an admin approves the account.'}
            </p>
            <div className="mt-8 flex items-center gap-3 border-t border-(--color-border) pt-5 text-sm text-(--color-text-dim)">
              <LoaderCircle className="size-4 animate-spin text-(--color-accent)" />
              This page checks your approval status automatically.
            </div>
          </div>

          <div className="border-t border-(--color-text) bg-(--color-surface)">
            <article className="border-b border-(--color-border) p-6">
              <div className="mb-4 flex items-center gap-2 text-(--color-text-dim)">
                <ShieldCheck className="size-4" />
                <span className="font-mono text-xs font-semibold">status</span>
              </div>
              <p className="text-2xl font-semibold capitalize">
                {currentUser?.approvalStatus ?? 'pending'}
              </p>
              <p className="mt-2 text-sm leading-6 text-(--color-text-dim)">
                New accounts start as pending and unlock automatically after approval.
              </p>
            </article>

            <article className="p-6">
              <div className="mb-4 flex items-center gap-2 text-(--color-text-dim)">
                <Clock3 className="size-4" />
                <span className="font-mono text-xs font-semibold">next step</span>
              </div>
              <p className="text-2xl font-semibold">Wait here</p>
              <p className="mt-2 text-sm leading-6 text-(--color-text-dim)">
                Once approved, this screen redirects you into `/workspace` without another sign-in.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}
