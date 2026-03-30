import { useState, useCallback, useEffect } from 'react'
import {
    useAccount,
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt
} from 'wagmi'
import { parseUnits, erc20Abi, maxUint256 } from 'viem'
import { krypVaultAbi, usdcBaseSepoliaAddress } from '@/lib/contracts'

export interface UseVaultProps {
    vaultAddress: `0x${string}`
}

export const useVault = ({ vaultAddress }: UseVaultProps) => {
    const [txType, setTxType] = useState<'approve' | 'deposit' | null>(null)
    const { address } = useAccount()

    // =========================
    // Local State
    // =========================
    const [depositAmount, setDepositAmount] = useState('')
    const [allocation, setAllocation] = useState({
        worker: '',
        amount: ''
    })
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [lastDepositAmount, setLastDepositAmount] = useState<string>('')

    // Track active transaction explicitly
    const [activeTx, setActiveTx] = useState<`0x${string}` | null>(null)

    // =========================
    // Contract Writes
    // =========================
    const { writeContractAsync, isPending } = useWriteContract()

    const { isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash: activeTx ?? undefined,
    })

    const USDC_ADDRESS = usdcBaseSepoliaAddress

    // =========================
    // Reads
    // =========================
    const { data: balance, refetch: refetchBalance } = useReadContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address!],
        query: { enabled: !!address },
    })

    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address!, vaultAddress],
        query: { enabled: !!address },
    })

    const { data: employer, isLoading: isLoadingEmployer } = useReadContract({
        address: vaultAddress,
        abi: krypVaultAbi,
        functionName: 'employer',
    })

    // ✅ FIXED: correct function name
    const { data: vaultBalance, refetch: refetchVaultBalance } = useReadContract({
        address: vaultAddress,
        abi: krypVaultAbi,
        functionName: 'totalDeposited',
    })

    // =========================
    // Derived State
    // =========================
    const isEmployer =
        address &&
        employer &&
        address.toLowerCase() === (employer as string).toLowerCase()

    const amount = depositAmount ? parseUnits(depositAmount, 6) : BigInt(0)

    const hasBalance = balance !== undefined && balance >= amount
    const hasAllowance = allowance !== undefined && allowance >= amount

    const needsApproval = amount > BigInt(0) && hasBalance && !hasAllowance
    const canDeposit = amount > BigInt(0) && hasBalance && hasAllowance

    // =========================
    // Handlers
    // =========================
    const handleApprove = useCallback(async () => {
        if (!depositAmount) return

        const txHash = await writeContractAsync({
            address: USDC_ADDRESS,
            abi: erc20Abi,
            functionName: 'approve',
            args: [vaultAddress, maxUint256],
        })

        setTxType('approve')
        setActiveTx(txHash)
    }, [depositAmount, writeContractAsync, vaultAddress])

    const handleDeposit = useCallback(async () => {
        if (!depositAmount) return

        setLastDepositAmount(depositAmount)

        const txHash = await writeContractAsync({
            address: vaultAddress,
            abi: krypVaultAbi,
            functionName: 'deposit',
            args: [amount],
        })

        setTxType('deposit')
        setActiveTx(txHash)
    }, [depositAmount, amount, writeContractAsync, vaultAddress])

    const handleConfirmDeposit = useCallback(() => {
        setShowConfirmation(false)
    }, [])

    const handleAllocate = useCallback(() => {
        alert('Cofhe FHE Encryption integration coming in the next build.')
    }, [])

    // =========================
    // TX Confirmation 
    // =========================
    useEffect(() => {
        if (!isConfirming && activeTx && txType) {
            if (txType === 'approve') {
                // wait until tx is mined, THEN refetch
                refetchAllowance()
            }

            if (txType === 'deposit') {
                refetchBalance()
                refetchVaultBalance()

                setShowConfirmation(true)
                setDepositAmount('')
            }

            setActiveTx(null)
            setTxType(null)
        }
    }, [
        isConfirming,
        activeTx,
        txType,
        refetchAllowance,
        refetchBalance,
        refetchVaultBalance,
    ])


    // =========================
    // Return
    // =========================
    return {
        // State
        depositAmount,
        setDepositAmount,
        allocation,
        setAllocation,
        showConfirmation,
        setShowConfirmation,
        lastDepositAmount,
        isConfirming,
        isPending,

        // Data
        balance,
        allowance,
        employer,
        vaultBalance,
        isLoadingEmployer,
        isEmployer,
        address,

        // Computed
        hasBalance,
        hasAllowance,
        needsApproval,
        canDeposit,
        amount,

        // Handlers
        handleApprove,
        handleDeposit,
        handleConfirmDeposit,
        handleAllocate,

        // Refetch
        refetchBalance,
        refetchVaultBalance,
    }
}