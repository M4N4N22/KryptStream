'use client'

import { useParams } from 'next/navigation'
import { Loader2, ShieldCheck, Info } from 'lucide-react'
import { useVault } from '@/hooks/useVault'
import { VaultHeader } from '@/components/EmployerVault/VaultHeader'
import { DepositSection } from '@/components/EmployerVault/DepositSection'
import { AllocationSection } from '@/components/EmployerVault/AllocationSection'
import { ConfirmationDialog } from '@/components/EmployerVault/ConfirmationDialog'
import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { krypVaultAbi } from '@/lib/contracts'

export default function EmployerVaultPage() {
    const params = useParams()
    const vault = params.vault as `0x${string}`



const {
    depositAmount,
    setDepositAmount,
    allocation,
    setAllocation,
    showConfirmation,
    lastDepositAmount,
    isPending,
    isConfirming,
    balance,
    vaultBalance,  
    isLoadingEmployer,
    isEmployer,
    hasBalance,
    needsApproval,
    canDeposit,
    handleApprove,
    handleDeposit,
    handleConfirmDeposit,
    handleAllocate,
} = useVault({ vaultAddress: vault })

const formattedVaultBalance =
  vaultBalance !== undefined
    ? formatUnits(vaultBalance as bigint, 6)
    : '0'

    if (isLoadingEmployer) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f8f4e9]">
                <Loader2 className="animate-spin text-[#0f9d8a]" size={32} />
            </div>
        )
    }

    if (!isEmployer) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#f8f4e9]">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="mx-auto w-16 h-16 bg-red-50 flex items-center justify-center rounded-full text-red-500">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-serif text-stone-900">Access Denied</h2>
                    <p className="text-stone-600">You are not authorized to manage this vault.</p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#f8f4e9] pb-20">
            {/* IMPROVEMENT: Pass balance to Header to free up main real estate. 
               The Header now acts as the 'Status Bar'
            */}
            <VaultHeader vault={vault} balance={formattedVaultBalance}  />

            <div className="mx-auto max-w-5xl px-6 mt-12">
                
                {/* Section Title */}
                <div className="mb-8 flex items-end justify-between">
                    <div className="space-y-1">
                        <h2 className="font-serif text-3xl text-stone-900">Vault Actions</h2>
                        <p className="text-sm text-stone-500 italic">Fund your vault or assign encrypted payouts</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-stone-200">
                        <span className="h-2 w-2 rounded-full bg-[#0f9d8a] animate-pulse" />
                        Network: Base Sepolia
                    </div>
                </div>

                {/* MAIN ACTION GRID */}
                <div className="grid gap-6 lg:grid-cols-12">
                    
                    {/* Deposit: High Contrast / Primary Action (Col Span 7) */}
                    <div className="lg:col-span-7">
                        <DepositSection
                            depositAmount={depositAmount}
                            setDepositAmount={setDepositAmount}
                            balance={balance}
                            isPending={isPending}
                            isConfirming={isConfirming}
                            hasBalance={hasBalance}
                            needsApproval={needsApproval}
                            canDeposit={canDeposit}
                            onApprove={handleApprove}
                            onDeposit={handleDeposit}
                        />
                    </div>

                    {/* Allocation: Clean / Secondary Action (Col Span 5) */}
                    <div className="lg:col-span-5">
                        <AllocationSection
                            worker={allocation.worker}
                            setWorker={(worker) => setAllocation({ ...allocation, worker })}
                            allocationAmount={allocation.amount}
                            setAllocationAmount={(amount) => setAllocation({ ...allocation, amount })}
                            onAllocate={handleAllocate}
                        />
                    </div>
                </div>

                {/* TRANSACTION TOAST (Floating or Fixed bottom) */}
                {(isPending || isConfirming) && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                        <div className="flex items-center gap-4 rounded-2xl bg-stone-900 px-6 py-4 text-white shadow-2xl">
                            <Loader2 className="animate-spin text-[#0f9d8a]" size={20} />
                            <div className="text-sm">
                                <p className="font-bold">Transaction in Progress</p>
                                <p className="text-stone-400 text-xs">Waiting for block confirmation...</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationDialog
                isOpen={showConfirmation}
                onClose={handleConfirmDeposit}
                depositAmount={lastDepositAmount}
            />
        </main>
    )
}