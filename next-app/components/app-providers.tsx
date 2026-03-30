'use client'

import { ReactNode, useState } from 'react'
import '@rainbow-me/rainbowkit/styles.css'

import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http } from 'viem'
import { baseSepolia } from 'wagmi/chains'
import { WagmiProvider } from 'wagmi'

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  '00000000000000000000000000000000'

const wagmiConfig = getDefaultConfig({
  appName: 'Krypstream',
  appDescription: 'Privacy-preserving payroll and streaming payments',
  appUrl: 'https://kryptstream.local',
  projectId: walletConnectProjectId,
  chains: [baseSepolia],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ||
        'https://sepolia.base.org'
    ),
  },
})

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={baseSepolia}
          theme={darkTheme({
            accentColor: '#0f9d8a',
            accentColorForeground: '#f4f2ea',
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}