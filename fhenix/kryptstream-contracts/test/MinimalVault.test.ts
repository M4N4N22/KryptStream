import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import hre from 'hardhat'

describe('MinimalVault', function () {
	async function deployMinimalVaultFixture() {
		const [deployer, bob, alice] = await hre.ethers.getSigners()

		const MinimalVault = await hre.ethers.getContractFactory('MinimalVault')
		const minimalVault = await MinimalVault.deploy()

		return { deployer, bob, alice, minimalVault }
	}

	beforeEach(function () {
		if (!hre.cofhe.isPermittedEnvironment('MOCK')) this.skip()
	})

	it('sets an allocation for bob and only bob can decrypt it', async function () {
		const { bob, alice, minimalVault } = await loadFixture(deployMinimalVaultFixture)

		const chainId = (await hre.ethers.provider.getNetwork()).chainId
		const mockZkVerifier = await hre.ethers.getContractAt(
			'MockZkVerifier',
			'0x0000000000000000000000000000000000001000',
		)
		const mockQueryDecrypter = await hre.ethers.getContractAt(
			'MockQueryDecrypter',
			'0x0000000000000000000000000000000000002000',
		)

		const ctHash = await mockZkVerifier.zkVerifyCalcCtHash(250n, 6, bob.address, 0, chainId)
		await mockZkVerifier.insertCtHash(ctHash, 250n)

		const encryptedAmount = {
			ctHash,
			securityZone: 0,
			utype: 6,
			signature: '0x',
		}

		await minimalVault.setAllocation(bob.address, encryptedAmount)

		const handle = await minimalVault.getAllocationHandle(bob.address)
		await hre.cofhe.mocks.expectPlaintext(handle, 250n)

		const bobQuery = await mockQueryDecrypter.mockQueryDecrypt(handle, 0, bob.address)
		const aliceQuery = await mockQueryDecrypter.mockQueryDecrypt(handle, 0, alice.address)

		if (!bobQuery[0] || bobQuery[1] !== '' || bobQuery[2] !== 250n) {
			throw new Error(`Bob should have access to the allocation handle, got: ${String(bobQuery)}`)
		}

		if (aliceQuery[0] || aliceQuery[1] !== 'NotAllowed' || aliceQuery[2] !== 0n) {
			throw new Error(`Alice should be denied access to Bob's allocation handle, got: ${String(aliceQuery)}`)
		}
	})
})
