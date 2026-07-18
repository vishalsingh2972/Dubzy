import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { cn } from '@/lib/utils'
import { SnackbarContext, type Snackbar, type ShowSnackbarInput } from './snackbar-context'

const snackbarStyles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-(--color-border) bg-(--color-surface) text-(--color-text)',
} as const

const snackbarIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const

export function SnackbarProvider({ children }: PropsWithChildren) {
  const [snackbars, setSnackbars] = useState<Snackbar[]>([])

  const dismissSnackbar = useCallback((id: number) => {
    setSnackbars((current) => current.filter((snackbar) => snackbar.id !== id))
  }, [])

  const showSnackbar = useCallback(({ message, variant = 'info' }: ShowSnackbarInput) => {
    const id = Date.now() + Math.random()

    setSnackbars((current) => [
      ...current.slice(-2),
      {
        id,
        message,
        variant,
      },
    ])
  }, [])

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar])

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-3">
        {snackbars.map((snackbar) => (
          <SnackbarItem
            key={snackbar.id}
            snackbar={snackbar}
            onDismiss={dismissSnackbar}
          />
        ))}
      </div>
    </SnackbarContext.Provider>
  )
}

function SnackbarItem({
  snackbar,
  onDismiss,
}: {
  snackbar: Snackbar
  onDismiss: (id: number) => void
}) {
  const Icon = snackbarIcons[snackbar.variant]

  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(snackbar.id), 4500)

    return () => window.clearTimeout(timeout)
  }, [onDismiss, snackbar.id])

  return (
    <output
      className={cn(
        'flex items-start gap-3 rounded-md border px-4 py-3 shadow-[0_18px_48px_rgba(21,23,19,0.16)] backdrop-blur',
        snackbarStyles[snackbar.variant],
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p className="flex-1 text-sm leading-relaxed">{snackbar.message}</p>
      <button
        className="text-current opacity-60 transition hover:opacity-100"
        onClick={() => onDismiss(snackbar.id)}
        type="button"
      >
        <span className="sr-only">Dismiss notification</span>
        <X className="size-4" />
      </button>
    </output>
  )
}
