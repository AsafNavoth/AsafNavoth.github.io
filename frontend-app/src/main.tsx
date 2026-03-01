import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { ThemeProvider } from './contexts/theme/ThemeProvider'
import { SnackbarProvider } from './contexts/snackbar/SnackbarProvider'
import { AnkiConnectProvider } from './contexts/ankiconnect/AnkiConnectProvider'
import { App } from './App'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SnackbarProvider>
            <AnkiConnectProvider>
              <App />
            </AnkiConnectProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
)
