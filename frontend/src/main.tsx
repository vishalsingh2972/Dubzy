import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { QueryProvider } from '@/app/providers/query-provider'
import { SnackbarProvider } from '@/app/providers/snackbar-provider'
import { router } from '@/router'

if (import.meta.env.DEV) {
  void import('react-grab')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <SnackbarProvider>
        <RouterProvider router={router} />
      </SnackbarProvider>
    </QueryProvider>
  </StrictMode>,
)
