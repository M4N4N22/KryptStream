# Krypstream (Kryptstream)

**Version:** 0.1 (Wave 1)  
**Chain:** Base Sepolia  
**Stack:** CoFHE / Fhenix + Privara SDK + Wagmi/Viem + Next.js 

---

## Project Summary

Krypstream is a non-custodial, privacy-by-design payment protocol that enables organisations to manage salaries, contributor streams, and treasury flows without leaking financial strategy on-chain.

Two primitives. One protocol:

- **Discrete payments** — encrypted discrete payroll. Employer funds a vault; workers claim their allocation without any on-chain observer seeing individual amounts.
- **Continuous payments** — encrypted continuous streaming. Protocols stream compensation at a hidden per-second rate; recipients accrue a private balance claimable at any time.

No backend. No database. No server to breach. Privacy guaranteed by FHE cryptography, not infrastructure promises.

Current implementation includes:
- `/fhenix` (smart contracts, CoFHE-enabled backend)  
- `/next-app` (React + Wagmi frontend connected to Base Sepolia contracts)

---

## What is implemented today

### 1) `/fhenix` (cofhe-powered smart contracts)

- `KrypVault.sol` (discrete payments vault)
  - `deposit(uint256 amount)` -> employer deposits USDC into vault
  - `setAllocation(address worker, InEuint128 encryptedAmount)` -> encrypted worker allocation via CoFHE
  - `claim()` -> worker claims allocated funds
  - public `totalDeposited` tracking (proof-of-solvency) + encrypted allocation map

- `KrypVaultFactory.sol` (deploy new vault instances)
- `MinimalVault.sol` and `MockUSDC.sol` for local test/dev
- `KrypStream` and `KrypstreamRouter` are included at architecture level in `Architecture.md` but are not present as source files in this repo yet
- FHE-safe patterns in existing contracts:
  - `FHE.allowThis` & `FHE.allow(handle, addr)` for access control
  - `FHE.lte` comparison and overflow guard

- CoFHE engine integration:
  - Contracts compile and test with `cofhe-hardhat-plugin`
  - `cofhejs` helpers for encrypt/decrypt/unseal flows

- Contracts are deployed to Base Sepolia (addresses in `/fhenix/deployments/base-sepolia.json`)

### 2) `/next-app` (React frontend)

Implemented employer dashboard flows:
- Connect wallet (WalletConnect/MetaMask via Wagmi)
- Vault tenant route: `/employer/[vault]`
- Employer authorization checks by reading vault owner
- USDC balance + allowance checks (via `erc20Abi` + `balanceOf`/`allowance`)
- `approve` + `deposit` workflow for USDC token + vault deposit path
- Vault metrics / copy wallet UI / toast-like state updates
- Post-deposit confirmation modal with deposit amount
- “Assign allocation” form UI placeholder for CoFHE encrypted allocation (pending full integration)

Core code pieces:
- `hooks/useVault.ts` – core interaction logic, encapsulates read/write hooks + state
- `components/EmployerVault/VaultHeader.tsx`
- `components/EmployerVault/VaultBalance.tsx`
- `components/EmployerVault/DepositSection.tsx`
- `components/EmployerVault/AllocationSection.tsx`
- `components/EmployerVault/ConfirmationDialog.tsx`

---

## Repository structure

```
Kryptstream/
  README.md                # this file
  Architecture.md          # high-level validator + protocol docs
  fhenix/
    kryptstream-contracts/ # hardhat + cofhe contract implementation
      contracts/
      test/
      tasks/
      deployments/
      hardhat.config.ts
  next-app/
    app/
      employer/[vault]/page.tsx  # main employer flow
    components/
    hooks/
    lib/contracts.ts
    abi/
    package.json
```

---

## Setup and local development

### Prerequisites
- Node.js v18+  
- pnpm (preferred)  
- yarn/npm works too for parts

### Smart contract environment (`/fhenix/kryptstream-contracts`)

```bash
cd fhenix/kryptstream-contracts
pnpm install

# Compile
pnpm compile

# Run tests (including CoFHE mocks)
pnpm test

# Deploy to Base Sepolia
npx hardhat deploy-krypvault --network base-sepolia
```

Common package scripts (from contract README):
- `pnpm clean`
- `pnpm localcofhe:start`, `pnpm localcofhe:stop`
- `pnpm localcofhe:deploy`
- `pnpm task:deploy`

### Frontend environment (`/next-app`)

```bash
cd next-app
pnpm install
pnpm dev
```

Open browser: `http://localhost:3000`

### Required env vars
- `NEXT_PUBLIC_RPC_URL` (Base Sepolia or local RPC)  
- Private key/wallet can be injected via web3 provider; no server secret needed for protocol flows.

---

## Frontend flows implemented today

### 1. Employer -> Vault route
- URL: `/employer/[vault]`
- Reads vault config from query param vault address
- Verifies caller is employer via contract read
- Displays:
  - Vault address (copy button)
  - USDC token info
  - Wallet USDC balance
  - `deposit` input + status
  - Approval / deposit transaction button

### 2. Approve + Deposit
- On amount typed:
  - verifies token balance using `balanceOf`
  - verifies allowance using `allowance`
  - calculates `needsApproval` or `canDeposit`
- `Approve` triggers ERC20 `approve(vault, amount)`
- `Deposit` triggers vault `deposit(amount)`
- Shows in-progress spinner via `isPending`, `isConfirming`

### 3. Post-deposit confirmation
- UI modal dialog after successful deposit flow
- shows last deposited amount
- triggers `refetchBalance` and `refetchVaultBalance` in hook

### 4. Allocation UI (stub)
- input worker address + amount  
- currently message: ‘Cofhe FHE Encryption integration coming in the next build’

---

## Base Sepolia deployment status

Contracts are currently wired to hard-coded addresses for testnet + local in `next-app/lib/contracts.ts`:
- `usdcBaseSepoliaAddress = 0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- `krypVaultFactoryAddress` + `krypVaultAddress` in contract config

Confirm these addresses post-deployment under `fhenix/kryptstream-contracts/deployments/base-sepolia.json`.

---

## Security & privacy

- Vault staking is public (totalDeposited) for solvency auditing  
- Per-worker allocations are encrypted (CoFHE) and available only to payer + worker  
- Claim and encrypted comparison safeguarding in contract design  
- No privileged admin keys in production path

---

## Tests

- Solidity unit tests in `fhenix/kryptstream-contracts/test/`:
  - `Counter.test.ts`
  - `KrypVault.test.ts`
  - `MinimalVault.test.ts`

- Run with `pnpm test` on `fhenix/kryptstream-contracts`

- Add future coverage to ensure:
  - `setAllocation` FHE handle ACL
  - `claim` / stream semantics
  - decryption flow + event privacy

---

## Helpful docs
- `Architecture.md` (core system architecture, contract privacy model)
- `fhenix/kryptstream-contracts/README.md` (CoFHE Hardhat guide)

---

## Next milestone (Wave 2+)

1. Worker dashboard (claim flow + decrypts)
2. Full `KrypStream` continuous stream integration
3. Privara SDK offchain settlement hooks
4. End-to-end tests (employer -> vault -> worker claim)
5. Production deployment with environment parameterization

---

## Contribution

- Fork repo, branch from `main`, add tests, PR
- Keep implementation tests green and update architecture docs

---

## License
MIT
