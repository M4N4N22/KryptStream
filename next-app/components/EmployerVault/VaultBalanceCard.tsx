'use client'

import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { Wallet, Info, ArrowUpRight } from 'lucide-react'
import { krypVaultAbi } from '@/lib/contracts'

type Props = {
  vault: `0x${string}`
}

export function VaultBalanceCard({ vault }: Props) {
  const { data, isLoading, isError } = useReadContract({
    address: vault,
    abi: krypVaultAbi,
    functionName: 'totalDeposited',
  })

  // Format with a fallback for undefined/error
  const formatted = data !== undefined 
    ? Number(formatUnits(data as bigint, 6)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) 
    : '0.00'

  return (
    <div className="group relative overflow-hidden bg-white border border-stone-200 rounded-[2rem] p-8 shadow-sm transition-all hover:shadow-md hover:border-stone-300">
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-[#0f9d8a]/5 blur-3xl transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-4">
          {/* Icon Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f9d8a]/10 text-[#0f9d8a] ring-1 ring-[#0f9d8a]/20">
              <Wallet size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Total Vault Liquidity
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-medium text-stone-500 uppercase tracking-tighter">Live on Base</span>
              </div>
            </div>
          </div>

          {/* Balance Display */}
          <div className="mt-2">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-9 w-40 animate-pulse rounded-lg bg-stone-100" />
                <div className="h-4 w-20 animate-pulse rounded-lg bg-stone-50" />
              </div>
            ) : isError ? (
              <div className="flex items-center gap-2 text-red-500">
                <Info size={14} />
                <p className="text-sm font-medium">Failed to fetch balance</p>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-4xl font-medium tracking-tight text-stone-900">
                    {formatted}
                  </span>
                  <span className="text-lg font-bold text-stone-400 italic">USDC</span>
                </div>
                <p className="text-xs text-stone-400 mt-1">Available for payroll distribution</p>
              </div>
            )}
          </div>
        </div>

        {/* Subtle Action Link */}
        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-100 text-stone-400 transition-all hover:bg-stone-900 hover:text-white hover:border-stone-900">
          <ArrowUpRight size={18} />
        </button>
      </div>

      {/* Visual Progress Bar (Optional decoration) */}
      <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-stone-100">
        <div 
          className="h-full bg-[#0f9d8a] transition-all duration-1000" 
          style={{ width: isLoading ? '30%' : '100%' }} 
        />
      </div>
    </div>
  )
}