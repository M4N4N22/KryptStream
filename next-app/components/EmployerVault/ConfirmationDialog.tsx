'use client'

import { X, CheckCircle2, ArrowUpCircle } from 'lucide-react'
import { formatUnits } from 'viem'

interface ConfirmationDialogProps {
    isOpen: boolean
    onClose: () => void
    depositAmount: string
}

export function ConfirmationDialog({
    isOpen,
    onClose,
    depositAmount,
}: ConfirmationDialogProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center space-y-6">
                    {/* Success Icon */}
                    <div className="mx-auto w-16 h-16 bg-green-50 flex items-center justify-center rounded-full">
                        <CheckCircle2 className="text-green-500" size={32} />
                    </div>

                    {/* Title */}
                    <div>
                        <h3 className="text-2xl font-serif text-stone-900 mb-2">Deposit Successful!</h3>
                        <p className="text-stone-500 text-sm">Your funds have been deposited to the vault.</p>
                    </div>

                    {/* Amount Display */}
                    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                            Deposited Amount
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            <ArrowUpCircle className="text-[#0f9d8a]" size={20} />
                            <span className="text-3xl font-bold text-stone-900">
                                {parseFloat(depositAmount).toFixed(2)}
                            </span>
                            <span className="text-lg font-semibold text-stone-500">USDC</span>
                        </div>
                    </div>

                    {/* Message */}
                    <p className="text-sm text-stone-600 leading-relaxed">
                        Your vault is now funded. You can proceed to assign allocations to workers.
                    </p>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full bg-[#0f9d8a] text-white rounded-full py-3 font-semibold hover:bg-[#0d8a77] transition-all"
                    >
                        Done
                    </button>
                </div>

                {/* Close X Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    )
}
