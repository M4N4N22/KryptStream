import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

const BASE_SEPOLIA_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'

task('deploy-krypvault', 'Deploy KrypVault + Factory')
  .addOptionalParam('token', 'ERC20 token address for the vault', BASE_SEPOLIA_USDC)
  .setAction(async ({ token }, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre

    console.log(`Deploying contracts to ${network.name}...`)

    const [deployer] = await ethers.getSigners()
    console.log(`Deployer: ${deployer.address}`)
    console.log(`Vault token: ${token}`)

    // =========================
    // 1. Deploy KrypVault (standalone - optional but useful)
    // =========================
    console.log('\nDeploying KrypVault (standalone)...')

    const KrypVault = await ethers.getContractFactory('KrypVault')

    // IMPORTANT: new constructor requires employer
    const krypVault = await KrypVault.deploy(token, deployer.address)
    await krypVault.waitForDeployment()

    const krypVaultAddress = await krypVault.getAddress()
    console.log(`KrypVault deployed to: ${krypVaultAddress}`)

    saveDeployment(network.name, 'KrypVault', krypVaultAddress)

    // =========================
    // 2. Deploy Factory (primary entrypoint)
    // =========================
    console.log('\nDeploying KrypVaultFactory...')

    const Factory = await ethers.getContractFactory('KrypVaultFactory')
    const factory = await Factory.deploy()
    await factory.waitForDeployment()

    const factoryAddress = await factory.getAddress()
    console.log(`KrypVaultFactory deployed to: ${factoryAddress}`)

    saveDeployment(network.name, 'KrypVaultFactory', factoryAddress)

    // =========================
    // Done
    // =========================
    console.log('\nDeployment complete.')

    return {
      krypVault: krypVaultAddress,
      factory: factoryAddress,
    }
  })