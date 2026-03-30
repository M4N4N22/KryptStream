'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { isAddressEqual } from 'viem'
import { useAccount, useReadContract } from 'wagmi'
import { krypVaultConfig } from '@/lib/contracts'

function shortenAddress(address?: string) {
  if (!address) return 'Not connected'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function LandingShell() {
  const { address, isConnected, chain } = useAccount()
  const employerQuery = useReadContract({
    address: krypVaultConfig.address,
    abi: krypVaultConfig.abi,
    functionName: 'employer',
  })

  const employerAddress =
    employerQuery.data as `0x${string}` | undefined

  const isEmployer =
    Boolean(address && employerAddress && isAddressEqual(address, employerAddress))
  const networkMismatch = isConnected && chain?.id !== krypVaultConfig.chainId

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,157,138,0.22),_transparent_36%),radial-gradient(circle_at_80%_20%,_rgba(242,155,72,0.22),_transparent_24%),linear-gradient(180deg,_rgba(248,244,233,0.96),_rgba(239,232,214,0.94))]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-stone-900/10 bg-[#fffdf8]/80 px-6 py-5 shadow-[0_20px_60px_rgba(54,43,26,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">Krypstream</p>
            <h1 className="mt-2 font-serif text-3xl tracking-tight text-stone-900 sm:text-4xl">
              Private payroll and token streams, built for Base Sepolia.
            </h1>
          </div>
          <ConnectButton chainStatus="name" showBalance={false} />
        </header>

        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div className="max-w-2xl space-y-5">
              <p className="inline-flex rounded-full border border-stone-900/10 bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-stone-600">
                Fhenix CoFHE + Base Sepolia
              </p>
              <p className="text-lg leading-8 text-stone-700 sm:text-xl">
                One app for discrete vault allocations and continuous streams. Sensitive amounts stay encrypted, while
                the connected wallet is routed into the right workflow.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-[1.75rem] border border-stone-900/10 bg-[#13261f] p-6 text-stone-100 shadow-[0_20px_50px_rgba(19,38,31,0.24)]">
                <p className="text-sm uppercase tracking-[0.22em] text-emerald-200/70">Employer Flow</p>
                <h2 className="mt-3 text-2xl font-semibold">Fund vaults and assign encrypted payroll.</h2>
                <p className="mt-4 text-sm leading-7 text-emerald-50/80">
                  The landing page checks the on-chain `employer` field and routes the deployer into the employer
                  dashboard once connected.
                </p>
              </article>

              <article className="rounded-[1.75rem] border border-stone-900/10 bg-[#fff9ef] p-6 text-stone-900 shadow-[0_18px_45px_rgba(120,85,40,0.12)]">
                <p className="text-sm uppercase tracking-[0.22em] text-amber-700/70">Worker Flow</p>
                <h2 className="mt-3 text-2xl font-semibold">Decrypt only your own balance, then claim.</h2>
                <p className="mt-4 text-sm leading-7 text-stone-600">
                  Any connected address that is not the employer is treated as a worker-ready wallet for the next task.
                </p>
              </article>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-stone-900/10 bg-[#fffdf8]/88 p-6 shadow-[0_24px_60px_rgba(54,43,26,0.12)] backdrop-blur">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">Session</p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-900">Connection status</h2>
              </div>

              <dl className="space-y-4 text-sm text-stone-700">
                <div className="rounded-2xl bg-stone-900/[0.035] p-4">
                  <dt className="text-xs uppercase tracking-[0.2em] text-stone-500">Vault</dt>
                  <dd className="mt-2 break-all font-mono text-xs text-stone-900">{krypVaultConfig.address}</dd>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-stone-900/[0.035] p-4">
                    <dt className="text-xs uppercase tracking-[0.2em] text-stone-500">Wallet</dt>
                    <dd className="mt-2 font-mono text-xs text-stone-900">{shortenAddress(address)}</dd>
                  </div>
                  <div className="rounded-2xl bg-stone-900/[0.035] p-4">
                    <dt className="text-xs uppercase tracking-[0.2em] text-stone-500">Detected role</dt>
                    <dd className="mt-2 text-sm font-semibold text-stone-900">
                      {!isConnected ? 'Connect wallet' : isEmployer ? 'Employer' : 'Worker'}
                    </dd>
                  </div>
                </div>

                <div className="rounded-2xl bg-stone-900/[0.035] p-4">
                  <dt className="text-xs uppercase tracking-[0.2em] text-stone-500">Employer address</dt>
                  <dd className="mt-2 break-all font-mono text-xs text-stone-900">
                    {typeof employerAddress === 'string' ? employerAddress : employerQuery.isLoading ? 'Loading...' : 'Unavailable'}
                  </dd>
                </div>
              </dl>

              {networkMismatch ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  Switch to Base Sepolia to interact with Krypstream.
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/employer"
                  className="rounded-full bg-[#0f9d8a] px-5 py-3 text-center text-sm font-semibold text-[#f4f2ea] transition hover:bg-[#0b7d6e]"
                >
                  Open employer view
                </Link>
                <Link
                  href="/worker"
                  className="rounded-full border border-stone-300 px-5 py-3 text-center text-sm font-semibold text-stone-900 transition hover:border-stone-900"
                >
                  Open worker view
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
