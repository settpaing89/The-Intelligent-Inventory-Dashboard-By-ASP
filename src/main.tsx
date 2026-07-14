import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { logger } from './lib/logger.ts'

const queryCache = new QueryCache({
  onSuccess: (data, query) => {
    if (query.queryKey[0] === 'vehicles') {
      logger.info('vehicles_fetch_success', {
        count: Array.isArray(data) ? data.length : undefined,
      })
    }
  },
  onError: (error, query) => {
    if (query.queryKey[0] === 'vehicles') {
      logger.error('vehicles_fetch_failure', { error })
    }
  },
})

const mutationCache = new MutationCache({
  onSuccess: (_data, variables) => {
    const vehicleId = (variables as { id: string }).id
    logger.info('action_update_success', { vehicleId })
  },
  onError: (error, variables) => {
    const vehicleId = (variables as { id: string }).id
    logger.error('action_update_failure', { vehicleId, error })
  },
})

const queryClient = new QueryClient({ queryCache, mutationCache })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
