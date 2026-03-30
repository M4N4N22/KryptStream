'use client'

import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Rocket, ShieldCheck, Wallet2, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import {
  krypVaultFactoryConfig,
  usdcBaseSepoliaAddress,
} from '@/lib/contracts'

export default function CreateVaultPage() {
  const router = useRouter()
  const { address, isConnected, chain } = useAccount()

  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [error, setError] = useState<string | null>(null)

  // 1. Check if vault already exists for this user
const { data: existingVaults, isLoading: isCheckingExisting } = useReadContract({
  address: krypVaultFactoryConfig.address,
  abi: krypVaultFactoryConfig.abi,
  functionName: 'getVaults',
  args: [address!],
  query: {
    enabled: !!address,
  },
})

  // Check if any of the returned vaults is not the zero address
const hasVault = Array.isArray(existingVaults) && existingVaults.length > 0

  const { writeContractAsync, isPending } = useWriteContract()

  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const handleCreateVault = async () => {
    try {
      setError(null)
      const hash = await writeContractAsync({
        ...krypVaultFactoryConfig,
        functionName: 'createVault',
        args: [usdcBaseSepoliaAddress],
      })
      setTxHash(hash)
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Transaction failed')
    }
  }

  // Effect to handle redirection after creation
  useEffect(() => {
    if (!receipt || !isSuccess) return
    try {
      const log = receipt.logs.find(
        (log) => log.address.toLowerCase() === krypVaultFactoryConfig.address.toLowerCase()
      )
      if (!log) return
      const vaultAddress = `0x${log.topics[2]?.slice(26)}`
      if (vaultAddress) router.push(`/employer/${vaultAddress}`)
    } catch (err) {
      console.error('Failed to parse vault address', err)
    }
  }, [receipt, isSuccess, router])

  // =========================
  // Guard States
  // =========================
  if (!isConnected || chain?.id !== 84532) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#f8f4e9]">
         <div className="text-center space-y-4">
            <AlertCircle className="mx-auto text-stone-400" size={48} />
            <h2 className="text-xl font-serif text-stone-900">Action Required</h2>
            <p className="text-stone-600 max-w-xs">
              {!isConnected ? "Please connect your wallet to access the employer dashboard." : "Please switch to Base Sepolia network."}
            </p>
            <Link href="/" className="inline-block text-sm font-semibold text-[#0f9d8a] underline underline-offset-4">
              Return to Home
            </Link>
         </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f4e9]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(15,157,138,0.1),_transparent_40%)]" />

      <div className="mx-auto max-w-2xl px-6 py-12 lg:py-20">
        <Link href="/" className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back to Selection
        </Link>

        <div className="rounded-[2.5rem] border border-stone-900/5 bg-white/80 p-8 shadow-xl backdrop-blur-md md:p-12">
          
          <div className="mb-10 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="font-serif text-3xl text-stone-900">
                {hasVault ? "Vault Detected" : "Setup Vault"}
              </h1>
              <p className="text-stone-500 text-sm">
                {hasVault ? "You already have an active payroll vault." : "Deploy your private payroll infrastructure"}
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f9d8a]/10 text-[#0f9d8a]">
                {hasVault ? <ShieldCheck size={28} /> : <Rocket size={28} />}
              </div>
            </div>
          </div>

          {hasVault ? (
            /* CASE: VAULT EXISTS */
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#0f9d8a]/20 bg-[#0f9d8a]/5 p-6">
                <p className="text-sm text-stone-600 mb-4">
                  Our records show a vault is already associated with <strong>{address?.slice(0,6)}...</strong>. 
                  You can proceed directly to your management dashboard.
                </p>
                <div className="flex items-center gap-2 font-mono text-xs text-[#0f9d8a] bg-white p-3 rounded-lg border border-[#0f9d8a]/10">
                  <ExternalLink size={14} />
                  {existingVaults[0] as string}
                </div>
              </div>
              
              <Link
                href={`/employer/${existingVaults}`}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#13261f] py-5 text-lg font-bold text-white transition-all hover:bg-[#1a332a] shadow-lg shadow-[#13261f]/20"
              >
                <span className='text-white'>Go to Dashboard</span> <ArrowRight className='text-white' size={20} />
              </Link>
            </div>
          ) : (
            /* CASE: NO VAULT FOUND */
            <>
              <div className="mb-10 space-y-4">
                <div className="flex gap-4 rounded-2xl border border-stone-100 bg-stone-50/50 p-4">
                  <ShieldCheck className="mt-1 shrink-0 text-[#0f9d8a]" size={20} />
                  <div>
                    <p className="font-semibold text-stone-900">Privacy First</p>
                    <p className="text-sm text-stone-600">Sensitive payroll data remains fully encrypted on-chain.</p>
                  </div>
                </div>
                <div className="flex gap-4 rounded-2xl border border-stone-100 bg-stone-50/50 p-4">
                  <Wallet2 className="mt-1 shrink-0 text-[#0f9d8a]" size={20} />
                  <div>
                    <p className="font-semibold text-stone-900">One Vault per Employer</p>
                    <p className="text-sm text-stone-600">Your address will be permanently linked to this vault.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <button
                  onClick={handleCreateVault}
                  disabled={isPending || isConfirming || isCheckingExisting}
                  className={`relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full py-5 text-lg font-bold transition-all
                    ${isPending || isConfirming || isCheckingExisting
                      ? "bg-stone-100 text-stone-400 cursor-not-allowed" 
                      : "bg-[#13261f] text-white hover:bg-[#1a332a] shadow-lg shadow-[#13261f]/20"
                    }`}
                >
                  {isCheckingExisting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (isPending || isConfirming) ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      {isConfirming ? "Deploying..." : "Sign in Wallet..."}
                    </>
                  ) : (
                    "Initialize My Vault"
                  )}
                </button>

                {txHash && (
                  <div className="rounded-2xl bg-stone-900 p-4 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Transaction Live</p>
                    <p className="mt-2 truncate font-mono text-xs opacity-80">{txHash}</p>
                    <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" className="mt-3 block text-center text-xs font-semibold text-[#0f9d8a] hover:underline">
                      View on BaseScan
                    </a>
                  </div>
                )}

                {error && (
                  <div className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">
                    <AlertCircle className="shrink-0" size={20} />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}