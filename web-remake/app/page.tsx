'use client'

import App from '../src/App'
import { ErrorBoundary } from '../src/components/ErrorBoundary'

export default function HomePage() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}

