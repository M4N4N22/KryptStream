'use client'

import { Copy, CheckCircle2, LayoutDashboard, Wallet, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface VaultHeaderProps {
  vault: string
  balance: string | number | undefined // Passed from parent useVault hook
  isLoading?: boolean
}

export function VaultHeader({ vault, balance, isLoading }: VaultHeaderProps) {
  const [copied, setCopied] = useState(false)

  

  const copyToClipboard = () => {
    navigator.clipboard.writeText(vault)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Formatting the balance for a premium feel
  const formattedBalance = balance !== undefined 
    ? Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00'

  return (
    <header className="bg-white border-b border-stone-200 pt-10 pb-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          
          {/* Left Side: Identity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#0f9d8a] font-bold text-[10px] uppercase tracking-[0.2em]">
              <LayoutDashboard size={14} strokeWidth={2.5} /> Employer Dashboard
            </div>
            
            <div className="space-y-1">
              <h1 className="text-4xl font-serif text-stone-900 tracking-tight">
                Vault Overview
              </h1>
              <button
                onClick={copyToClipboard}
                className="group flex items-center gap-2 text-stone-400 text-xs hover:text-[#0f9d8a] transition-all"
                title="Copy Vault Address"
              >
                <span className="font-mono bg-stone-50 px-2 py-0.5 rounded border border-stone-100 transition-colors group-hover:bg-[#0f9d8a]/5 group-hover:border-[#0f9d8a]/20">
                  {vault.slice(0, 12)}...{vault.slice(-10)}
                </span>
                {copied ? (
                  <CheckCircle2 size={14} className="text-green-500" />
                ) : (
                  <Copy size={13} className="opacity-40 group-hover:opacity-100" />
                )}
              </button>
            </div>
          </div>

          {/* Right Side: Integrated Balance Card & Token Info */}
          <div className="flex items-center gap-3">
            
            {/* The Compact Balance Card */}
            <div className="relative overflow-hidden bg-stone-900 rounded-[1.25rem] px-6 py-4 text-white min-w-[200px] shadow-lg shadow-stone-200">
              {/* Subtle background glow */}
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#0f9d8a]/20 blur-2xl" />
              
              <div className="relative z-10 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                    Available Funds
                  </span>
                  <Wallet size={12} className="text-[#0f9d8a]" />
                </div>
                
                <div className="flex items-baseline gap-1.5">
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin text-stone-500 my-1" />
                  ) : (
                    <>
                      <span className="text-2xl font-serif font-semibold tracking-tight">
                        {formattedBalance}
                      </span>
                      <span className="text-[10px] font-bold text-[#0f9d8a]">USDC</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-1 w-1 rounded-full bg-green-500" />
                  <span className="text-[8px] text-stone-500 font-bold uppercase tracking-tighter">
                    Base Sepolia Live
                  </span>
                </div>
              </div>
            </div>

          

          </div>
        </div>
      </div>
    </header>
  )
}