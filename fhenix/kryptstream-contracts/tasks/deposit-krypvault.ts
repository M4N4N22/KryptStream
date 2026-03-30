import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getDeployment } from './utils'

const BASE_SEPOLIA_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
const DEFAULT_AMOUNT = '1000000'

const ERC20_ABI = [
	'function approve(address spender, uint256 amount) external returns (bool)',
	'function allowance(address owner, address spender) external view returns (uint256)',
	'function balanceOf(address account) external view returns (uint256)',
	'function decimals() external view returns (uint8)',
]

task('deposit-krypvault', 'Approve the vault and deposit ERC20 tokens for verification')
	.addOptionalParam('vault', 'KrypVault contract address; falls back to deployments/<network>.json')
	.addOptionalParam('token', 'ERC20 token address for the vault', BASE_SEPOLIA_USDC)
	.addOptionalParam('amount', 'Amount in token base units', DEFAULT_AMOUNT)
	.setAction(async ({ vault, token, amount }, hre: HardhatRuntimeEnvironment) => {
		const { ethers, network } = hre
		const [deployer] = await ethers.getSigners()

		const vaultAddress = vault || getDeployment(network.name, 'KrypVault')
		if (!vaultAddress) {
			throw new Error(`No KrypVault deployment found for ${network.name}. Run deploy-krypvault first or pass --vault.`)
		}

		const tokenContract = await ethers.getContractAt(ERC20_ABI, token, deployer)
		const vaultContract = await ethers.getContractAt('KrypVault', vaultAddress, deployer)

		console.log(`Depositing into KrypVault on ${network.name}...`)
		console.log(`Deployer: ${deployer.address}`)
		console.log(`Vault: ${vaultAddress}`)
		console.log(`Token: ${token}`)
		console.log(`Amount (base units): ${amount}`)

		const balance = await tokenContract.balanceOf(deployer.address)
		if (balance < BigInt(amount)) {
			throw new Error(`Insufficient token balance. Wallet has ${balance.toString()} base units, needs ${amount}.`)
		}

		const approveTx = await tokenContract.approve(vaultAddress, amount)
		console.log(`Approve tx submitted: ${approveTx.hash}`)
		await approveTx.wait()

		const allowance = await tokenContract.allowance(deployer.address, vaultAddress)
		console.log(`Allowance after approval: ${allowance.toString()}`)

		const depositTx = await vaultContract.deposit(amount)
		console.log(`Deposit tx submitted: ${depositTx.hash}`)
		await depositTx.wait()

		const totalDeposited = await vaultContract.totalDeposited()
		console.log(`Vault totalDeposited: ${totalDeposited.toString()}`)
	})
