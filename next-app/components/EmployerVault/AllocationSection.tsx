'use client'

import { UserPlus, ShieldCheck, Info } from 'lucide-react'

interface AllocationSectionProps {
    worker: string
    setWorker: (worker: string) => void
    allocationAmount: string
    setAllocationAmount: (amount: string) => void
    onAllocate: () => void
}

export function AllocationSection({
    worker,
    setWorker,
    allocationAmount,
    setAllocationAmount,
    onAllocate,
}: AllocationSectionProps) {
    return (
        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-stone-200/60 opacity-90">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
                    <UserPlus className="text-[#f29b48]" size={22} /> Assign Allocation
                </h2>
                <span className="text-[10px] bg-[#f29b48]/10 px-2 py-1 rounded-md font-bold text-[#f29b48] uppercase tracking-tighter">
                    FHE Encrypted
                </span>
            </div>
            <p className="text-sm text-stone-500 mb-6">
                Payments are assigned to worker addresses. Only you and the worker can see the amount.
            </p>

            <div className="space-y-4">
                <input
                    value={worker}
                    onChange={(e) => setWorker(e.target.value)}
                    placeholder="Worker Wallet Address (0x...)"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:border-[#0f9d8a] focus:ring-2 focus:ring-[#0f9d8a]/20 outline-none transition-all"
                />
                <div className="relative">
                    <input
                        value={allocationAmount}
                        onChange={(e) => setAllocationAmount(e.target.value)}
                        placeholder="Allocation Amount"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:border-[#0f9d8a] focus:ring-2 focus:ring-[#0f9d8a]/20 outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                        USDC
                    </span>
                </div>
            </div>

            <button
                onClick={onAllocate}
                className="mt-6 w-full border border-stone-200 bg-stone-50 text-stone-400 rounded-full py-4 font-bold flex items-center justify-center gap-2 group hover:bg-stone-100 transition-all"
            >
                <ShieldCheck size={18} /> Assign Encrypted Payment
            </button>

            <div className="mt-4 flex gap-2 items-start p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 leading-tight italic">
                    Encryption ensures that competitors or other workers cannot see your payroll data on BaseScan.
                </p>
            </div>
        </section>
    )
}
