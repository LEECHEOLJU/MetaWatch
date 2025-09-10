import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 401/403 errors
              if (error instanceof Error && error.message.includes('401')) {
                return false;
              }
              return failureCount < 3;
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <div className="dark">
        <Component {...pageProps} />
      </div>
    </QueryClientProvider>
  )
}