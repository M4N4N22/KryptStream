import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

describe('KrypVault', function () {
	async function deployKrypVaultFixture() {
		const [employer, bob, alice] = await hre.ethers.getSigners()

		const MockUSDC = await hre.ethers.getContractFactory('MockUSDC')
		const token = await MockUSDC.deploy()

		const KrypVault = await hre.ethers.getContractFactory('KrypVault')
		const vault = await KrypVault.connect(employer).deploy(await token.getAddress())

		return { employer, bob, alice, token, vault }
	}

	async function makeEncryptedUint128(amount: bigint, userAddress: string) {
		const chainId = (await hre.ethers.provider.getNetwork()).chainId
		const mockZkVerifier = await hre.ethers.getContractAt(
			'MockZkVerifier',
			'0x0000000000000000000000000000000000001000',
		)

		const ctHash = await mockZkVerifier.zkVerifyCalcCtHash(amount, 6, userAddress, 0, chainId)
		await mockZkVerifier.insertCtHash(ctHash, amount)

		return {
			ctHash,
			securityZone: 0,
			utype: 6,
			signature: '0x',
		}
	}

	beforeEach(function () {
		if (!hre.cofhe.isPermittedEnvironment('MOCK')) this.skip()
	})

	it('supports deposit, allocation, claim, and overflow protection', async function () {
		const { employer, bob, alice, token, vault } = await loadFixture(deployKrypVaultFixture)
		const depositAmount = 1_000_000_000n
		const bobAmount = 400_000_000n
		const aliceAmount = 300_000_000n
		const overflowAmount = 2_000_000_000n

		await token.mint(employer.address, depositAmount)
		await token.connect(employer).approve(await vault.getAddress(), depositAmount)
		await vault.connect(employer).deposit(depositAmount)

		expect(await vault.totalDeposited()).to.equal(depositAmount)
		expect(await token.balanceOf(await vault.getAddress())).to.equal(depositAmount)

		const bobEncrypted = await makeEncryptedUint128(bobAmount, bob.address)
		const aliceEncrypted = await makeEncryptedUint128(aliceAmount, alice.address)

		await vault.connect(employer).setAllocation(bob.address, bobEncrypted)
		await vault.connect(employer).setAllocation(alice.address, aliceEncrypted)

		expect(await vault.hasAllocation(bob.address)).to.equal(true)
		expect(await vault.hasAllocation(alice.address)).to.equal(true)

		const bobHandleBefore = await vault.getAllocationHandle(bob.address)
		const aliceHandleBefore = await vault.getAllocationHandle(alice.address)
		await hre.cofhe.mocks.expectPlaintext(bobHandleBefore, bobAmount)
		await hre.cofhe.mocks.expectPlaintext(aliceHandleBefore, aliceAmount)

		await vault.connect(bob).claim()
		expect(await token.balanceOf(bob.address)).to.equal(bobAmount)
		expect(await vault.totalDeposited()).to.equal(depositAmount - bobAmount)
		expect(await vault.hasAllocation(bob.address)).to.equal(false)

		const bobHandleAfterClaim = await vault.getAllocationHandle(bob.address)
		await hre.cofhe.mocks.expectPlaintext(bobHandleAfterClaim, 0n)

		await vault.connect(alice).claim()
		expect(await token.balanceOf(alice.address)).to.equal(aliceAmount)
		expect(await vault.totalDeposited()).to.equal(depositAmount - bobAmount - aliceAmount)
		expect(await vault.hasAllocation(alice.address)).to.equal(false)

		const bobBalanceAfterFirstClaim = await token.balanceOf(bob.address)
		await vault.connect(bob).claim()
		expect(await token.balanceOf(bob.address)).to.equal(bobBalanceAfterFirstClaim)
		expect(await vault.totalDeposited()).to.equal(depositAmount - bobAmount - aliceAmount)

		const overflowEncrypted = await makeEncryptedUint128(overflowAmount, bob.address)
		await vault.connect(employer).setAllocation(bob.address, overflowEncrypted)
		expect(await vault.hasAllocation(bob.address)).to.equal(true)

		const remainingBeforeOverflowClaim = await vault.totalDeposited()
		const bobBalanceBeforeOverflowClaim = await token.balanceOf(bob.address)

		await vault.connect(bob).claim()

		expect(await token.balanceOf(bob.address)).to.equal(bobBalanceBeforeOverflowClaim)
		expect(await vault.totalDeposited()).to.equal(remainingBeforeOverflowClaim)
		expect(await vault.hasAllocation(bob.address)).to.equal(false)

		const bobHandleAfterOverflow = await vault.getAllocationHandle(bob.address)
		await hre.cofhe.mocks.expectPlaintext(bobHandleAfterOverflow, 0n)
	})

	it('restricts allocation updates and revoke to employer', async function () {
		const { bob, alice, vault } = await loadFixture(deployKrypVaultFixture)
		const bobEncrypted = await makeEncryptedUint128(100n, bob.address)

		await expect(vault.connect(bob).setAllocation(alice.address, bobEncrypted)).to.be.reverted
		await expect(vault.connect(bob).revokeAllocation(alice.address)).to.be.reverted
	})
})
