'use client'

import { ArrowUpCircle, Loader2 } from 'lucide-react'
import { formatUnits } from 'viem'
import { USDCBalance } from './USDCBalance'

interface DepositSectionProps {
    depositAmount: string
    setDepositAmount: (amount: string) => void
    balance: bigint | undefined
    isPending: boolean
    isConfirming: boolean
    hasBalance: boolean
    needsApproval: boolean
    canDeposit: boolean
    onApprove: () => Promise<void>
    onDeposit: () => Promise<void>
}

export function DepositSection({
    depositAmount,
    setDepositAmount,
    balance,
    isPending,
    isConfirming,
    hasBalance,
    needsApproval,
    canDeposit,
    onApprove,
    onDeposit,
}: DepositSectionProps) {
    const handleClick = async () => {
        if (needsApproval) {
            await onApprove()
        } else if (canDeposit) {
            await onDeposit()
        }
    }

    const buttonText = (isPending || isConfirming) ? (
        <>
            <Loader2 className="animate-spin" size={20} /> Processing...
        </>
    ) : !depositAmount ? (
        "Enter Amount"
    ) : !hasBalance ? (
        "Insufficient USDC"
    ) : needsApproval ? (
        "Approve USDC"
    ) : (
        "Deposit to Vault"
    )

    return (
        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-stone-200/60">
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
                        <ArrowUpCircle className="text-[#0f9d8a]" size={22} /> Deposit Funds
                    </h2>
                    <span className="text-[10px] bg-stone-100 px-2 py-1 rounded-md font-bold text-stone-500 uppercase tracking-tighter">
                        Public Tx
                    </span>
                </div>
                <p className="text-sm text-stone-500 mb-8">
                    Add liquidity to your vault to cover upcoming payroll allocations.
                </p>

                <div className="space-y-6">
                    <USDCBalance balance={balance} />

                    <div className="relative">
                        <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-[#0f9d8a]/20 focus:border-[#0f9d8a] outline-none transition-all pr-16"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-sm italic">
                            USDC
                        </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-stone-500">
                        <span>Available: {balance ? formatUnits(balance, 6) : '0'} USDC</span>
                        <button
                            onClick={() => {
                                if (balance) {
                                    setDepositAmount(formatUnits(balance, 6))
                                }
                            }}
                            className="text-[#0f9d8a] hover:text-[#0f9d8a]/80 font-semibold transition-colors"
                        >
                            MAX
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={handleClick}
                disabled={
                    isPending ||
                    isConfirming ||
                    !depositAmount ||
                    !hasBalance
                }
                className="mt-8 w-full bg-[#13261f] text-white rounded-full py-4 font-bold hover:bg-[#1a332a] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {buttonText}
            </button>

            {!hasBalance && depositAmount && (
                <p className="text-xs text-red-500 mt-3 text-center">Insufficient balance</p>
            )}
        </section>
    )
}
