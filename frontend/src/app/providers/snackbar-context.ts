import { createContext, use } from 'react'

export type SnackbarVariant = 'success' | 'error' | 'info'

export type Snackbar = {
  id: number
  message: string
  variant: SnackbarVariant
}

export type ShowSnackbarInput = {
  message: string
  variant?: SnackbarVariant
}

type SnackbarContextValue = {
  showSnackbar: (input: ShowSnackbarInput) => void
}

export const SnackbarContext = createContext<SnackbarContextValue | null>(null)

export function useSnackbar() {
  const context = use(SnackbarContext)

  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider')
  }

  return context
}
