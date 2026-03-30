import type { Address } from 'viem'

import krypVaultArtifact from '@/abi/KrypVault.json'
import krypVaultFactoryArtifact from '@/abi/KrypVaultFactory.json'

export const baseSepoliaChainId = 84532

export const usdcBaseSepoliaAddress =
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const

// =========================
// FACTORY (primary entry)
// =========================
export const krypVaultFactoryAddress =
  '0x4fE2Ce3f4Ab3E2957d9b9caD1Db1E2daAeD0a652' as Address

export const krypVaultFactoryAbi = krypVaultFactoryArtifact.abi

export const krypVaultFactoryConfig = {
  address: krypVaultFactoryAddress,
  abi: krypVaultFactoryAbi,
  chainId: baseSepoliaChainId,
} as const

// =========================
// VAULT ABI (reusable)
// =========================
export const krypVaultAbi = krypVaultArtifact.abi

// =========================
// ⚠️ DO NOT FIX ADDRESS HERE LONG TERM
// =========================
export const krypVaultAddress =
  '0x3616326c17e5C399C7832745a1eB4f6A9493de72' as Address

export const krypVaultConfig = {
  address: krypVaultAddress,
  abi: krypVaultAbi,
  chainId: baseSepoliaChainId,
} as const