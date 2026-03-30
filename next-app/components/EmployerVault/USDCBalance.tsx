'use client'

import { Wallet } from 'lucide-react'
import { formatUnits } from 'viem'

interface VaultBalanceProps {
    balance: bigint | undefined
}

export function USDCBalance({ balance }: VaultBalanceProps) {
    const formattedBalance = balance ? formatUnits(balance, 6) : '0'

    return (
        <div className="bg-gradient-to-br from-[#0f9d8a]/5 to-[#0f9d8a]/10 border border-[#0f9d8a]/20 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-[#0f9d8a]/10 rounded-full">
                <Wallet className="text-[#0f9d8a]" size={24} />
            </div>
            <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Your USDC Balance</p>
                <p className="text-3xl font-bold text-stone-900">{parseFloat(formattedBalance).toFixed(2)}</p>
            </div>
        </div>
    )
}
