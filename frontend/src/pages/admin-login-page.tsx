import { AudioWaveform, KeyRound, LoaderCircle, Mail, Shield } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminLoginMutation } from '@/features/admin/use-admin-session'
import { APP_NAME } from '@/lib/brand'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const loginMutation = useAdminLoginMutation()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      await loginMutation.mutateAsync({
        email,
        password,
      })
      navigate('/admin/users', { replace: true })
    } catch {
      setError('Invalid admin credentials')
    }
  }

  return (
    <main className="min-h-screen bg-(--color-bg) text-(--color-text)">
      <section className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-between border-b border-(--color-border) px-5 py-7 md:px-8 lg:border-b-0 lg:border-r lg:px-10">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center border border-(--color-text) bg-(--color-text) text-(--color-surface)">
              <AudioWaveform className="size-5" />
            </span>
            <div>
              <p className="font-serif text-2xl leading-none">{APP_NAME}</p>
              <p className="mt-1 font-mono text-xs text-(--color-text-dim)">admin access</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-(--color-text-dim)">
              Internal approval portal
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-tight md:text-6xl">
              Review new accounts and unlock workspaces.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-(--color-text-dim)">
              This login is separate from normal user auth and only grants access to the approval list.
            </p>
          </div>

          <Link
            className="ui-button ui-button-secondary w-fit"
            to="/"
          >
            Back to site
          </Link>
        </div>

        <div className="flex items-center justify-center bg-(--color-surface) px-5 py-12 md:px-8 lg:px-12">
        <form
          className="w-full max-w-md border-t border-(--color-text) pt-7"
          onSubmit={handleSubmit}
        >
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-(--color-text-dim)">
                Admin portal
              </p>
              <h2 className="mt-3 font-serif text-3xl">Sign in</h2>
            </div>
            <span className="flex size-10 items-center justify-center border border-(--color-border) bg-(--color-panel) text-(--color-text-dim)">
              <Shield className="size-4" />
            </span>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block font-mono text-xs font-semibold text-(--color-text-dim)">
                Admin email
              </span>
              <span className="flex items-center gap-3 rounded-md border border-(--color-border) bg-(--color-bg) p-3 focus-within:border-(--color-accent) focus-within:ring-2 focus-within:ring-(--color-selection)">
                <Mail className="size-4 shrink-0 text-(--color-text-dim)" />
                <input
                  aria-label="Admin email"
                  className="w-full bg-transparent text-sm outline-none"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-xs font-semibold text-(--color-text-dim)">
                Password
              </span>
              <span className="flex items-center gap-3 rounded-md border border-(--color-border) bg-(--color-bg) p-3 focus-within:border-(--color-accent) focus-within:ring-2 focus-within:ring-(--color-selection)">
                <KeyRound className="size-4 shrink-0 text-(--color-text-dim)" />
                <input
                  aria-label="Password"
                  className="w-full bg-transparent text-sm outline-none"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </span>
            </label>
          </div>

          {error ? <p className="mt-5 text-sm text-red-600">{error}</p> : null}

          <button
            className="ui-button ui-button-primary mt-8 w-full disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loginMutation.isPending}
            type="submit"
          >
            {loginMutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Open admin portal
          </button>
        </form>
        </div>
      </section>
    </main>
  )
}
