'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { ArrowRight, Wallet, ShieldCheck, Landmark, Users } from 'lucide-react'

function shortenAddress(address?: string) {
  if (!address) return 'Not connected'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function LandingShell() {
  const { address, isConnected, chain } = useAccount()

  const networkMismatch = isConnected && chain?.id !== 84532 // base sepolia

  return (
    <main className="relative min-h-screen overflow-hidden font-sans selection:bg-[#0f9d8a]/30">
      {/* Dynamic Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(15,157,138,0.15),_transparent_40%),radial-gradient(circle_at_80%_20%,_rgba(242,155,72,0.15),_transparent_30%),linear-gradient(180deg,_#f8f4e9_0%,_#efe8d6_100%)]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        
        {/* HEADER */}
        <header className="flex flex-col gap-6 rounded-3xl border border-stone-900/5 bg-white/60 p-6 shadow-sm backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#0f9d8a]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-500">
                Krypstream
              </p>
            </div>
            <h1 className="font-serif text-2xl tracking-tight text-stone-900 sm:text-3xl">
              Private payroll and token streams <span className="text-stone-500 italic">on Base Sepolia</span>
            </h1>
          </div>
          <div className="shrink-0">
            <ConnectButton chainStatus="name" showBalance={false} />
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <div className="mt-12 grid flex-1 gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          
          <div className="space-y-10">
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
          </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* EMPLOYER CARD */}
              <div className="group relative flex flex-col justify-between rounded-[2rem] bg-[#13261f] p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#13261f]/20">
                <div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f9d8a]/20 text-[#0f9d8a]">
                    <Landmark size={24} />
                  </div>
                  <h3 className="text-2xl font-semibold text-white">Employer</h3>
                  <p className="mt-3 text-stone-400">
                    Deploy secure vaults, manage funding, and assign encrypted payment streams to your workforce.
                  </p>
                </div>

                <Link
                  href={isConnected ? "/employer/create" : "#"}
                  className={`mt-8 flex items-center justify-center gap-2 rounded-full py-4 text-sm font-bold transition-all ${
                    isConnected 
                    ? "bg-[#0f9d8a] text-white hover:bg-[#12b39d]" 
                    : "bg-white/10 text-stone-500 cursor-not-allowed"
                  }`}
                >
                  {isConnected ? "Create Vault" : "Connect Wallet to Start"}
                  {isConnected && <ArrowRight size={16} />}
                </Link>
              </div>

              {/* WORKER CARD */}
              <div className="group relative flex flex-col justify-between rounded-[2rem] border border-stone-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f29b48]/10 text-[#f29b48]">
                    <Users size={24} />
                  </div>
                  <h3 className="text-2xl font-semibold text-stone-900">Worker</h3>
                  <p className="mt-3 text-stone-600">
                    Access your dashboard to view and claim encrypted payouts assigned to your wallet address.
                  </p>
                </div>

                <Link
                  href={isConnected ? "/worker" : "#"}
                  className={`mt-8 flex items-center justify-center gap-2 rounded-full border py-4 text-sm font-bold transition-all ${
                    isConnected 
                    ? "border-stone-900 text-stone-900 hover:bg-stone-50" 
                    : "border-stone-200 text-stone-400 cursor-not-allowed"
                  }`}
                >
                  {isConnected ? "Access Payouts" : "Connect Wallet to Start"}
                  {isConnected && <ArrowRight size={16} />}
                </Link>
              </div>
            </div>
          </div>

          {/* STATUS PANEL */}
          <aside className="sticky top-8 space-y-4">
            <div className="rounded-[2rem] border border-stone-900/5 bg-[#fffdf8]/60 p-8 shadow-sm backdrop-blur-sm">
              <h4 className="mb-6 flex items-center gap-2 font-serif text-lg text-stone-900">
                <ShieldCheck className="text-[#0f9d8a]" size={20} />
                Network Status
              </h4>
              
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
                    <Wallet size={12} /> Connected Wallet
                  </p>
                  <p className="truncate font-mono text-sm font-medium text-stone-700 bg-stone-100/50 p-2 rounded-lg">
                    {shortenAddress(address)}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-200">
                  {!isConnected ? (
                    <div className="flex items-center gap-3 text-stone-500">
                      <div className="h-2 w-2 rounded-full bg-stone-300" />
                      <p className="text-sm italic">Waiting for connection...</p>
                    </div>
                  ) : networkMismatch ? (
                    <div className="flex flex-col gap-2 rounded-xl bg-red-50 p-4 border border-red-100">
                      <p className="text-xs font-bold text-red-700">Network Mismatch</p>
                      <p className="text-xs text-red-600 leading-tight">
                        Please switch your wallet network to Base Sepolia to continue.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-[#0f9d8a]">
                      <div className="h-2 w-2 rounded-full bg-[#0f9d8a] animate-pulse" />
                      <p className="text-sm font-medium">Verified on Base Sepolia</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subtle info footer */}
            <p className="px-6 text-center text-[11px] leading-relaxed text-stone-400">
              Powered by Fully Homomorphic Encryption. <br />
              All transaction values are hidden from public explorers.
            </p>
          </aside>

        </div>
      </section>
    </main>
  )
}