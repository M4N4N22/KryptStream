# Krypstream — Architecture

> Version: 0.1 (Wave 1)
> Chain: Base Sepolia
> Stack: Fhenix CoFHE + Privara SDK + ReinieraOS

---

## System Overview

Krypstream is a fully on-chain, non-custodial payment protocol. There is no backend server, no database, no admin key. Privacy is guaranteed by Fully Homomorphic Encryption — the protocol's correctness does not depend on trusting any infrastructure operator.

The system has two runtime components:

1. **Smart contracts** — deployed on Base Sepolia, using CoFHE's FHE library for encrypted state management
2. **Client application** — a React frontend using `@cofhe/sdk` and the Privara SDK; all sensitive operations happen client-side

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  useEncrypt · useDecrypt · useWrite · Privara SDK            │
│  Employer Dashboard · Worker Dashboard · Stream Manager      │
└───────────────────────────┬─────────────────────────────────┘
                            │ wagmi / viem
┌───────────────────────────▼─────────────────────────────────┐
│                  KrypstreamRouter.sol                         │
│         Single entry point — routes to vault or stream        │
└──────────────┬────────────────────────┬─────────────────────┘
               │                        │
┌──────────────▼──────────┐  ┌──────────▼──────────────────┐
│     KrypVault.sol        │  │      KrypStream.sol          │
│  (Discrete payments primitive)   │  │   (Continuous payments primitive)   │
│  encrypted allocations   │  │   encrypted streaming rate   │
└──────────────┬──────────┘  └──────────┬──────────────────┘
               │                        │
┌──────────────▼────────────────────────▼─────────────────────┐
│                     FHE.sol (CoFHE)                           │
│  euint128 · FHE.add · FHE.sub · FHE.mul · FHE.lte           │
│  FHE.allow · FHE.allowThis · decryptForView · decryptForTx   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              CoFHE Coprocessor + Threshold Network            │
│   Executes FHE operations off-chain · Returns encrypted      │
│   results + threshold signatures for on-chain verification   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              Privara SDK + ReinieraOS Settlement              │
│   Routes payment intent · Executes USDC transfer on-chain   │
└─────────────────────────────────────────────────────────────┘
```

---

## Contract Architecture

### KrypVault.sol (Discrete payments)

Handles discrete encrypted payroll allocations.

**State:**
```solidity
// Total vault balance (public — proves solvency)
uint256 public totalDeposited;

// Per-worker encrypted allocation
mapping(address => euint128) private encryptedAllocations;

// Tracks if allocation is set for a worker
mapping(address => bool) public hasAllocation;

// ERC20 token (USDC)
IERC20 public immutable token;
```

**Key functions:**

`deposit(uint256 amount)`
- Transfers USDC from employer to vault
- Updates `totalDeposited` (public)
- No FHE involvement — amounts visible at deposit stage
- Note: total balance visible is intentional — proves employer solvency without revealing splits

`setAllocation(address worker, InEuint128 encryptedAmount)`
- Employer sets per-worker encrypted allocation
- Calls `FHE.asEuint128(encryptedAmount)` to convert input type to compute type
- Calls `FHE.allowThis(handle)` so contract retains access across transactions
- Calls `FHE.allow(handle, worker)` so only that worker can later decrypt their amount
- Overwrites any previous allocation for that worker

`claim()`
- Called by worker (`msg.sender`)
- Reads `encryptedAllocations[msg.sender]`
- Validates: `FHE.lte(allocation, totalVaultBalance_encrypted)` — encrypted comparison, no plaintext leak
- Subtracts from encrypted vault balance
- Triggers Privara SDK disbursement (or direct `IERC20.transfer` as fallback)
- Zeroes out worker's encrypted allocation

**Access control pattern:**
```
Employer → FHE.allowThis(handle)   // contract retains access for bookkeeping
         → FHE.allow(handle, workerAddr)  // only worker can decrypt
Worker   → decryptForView(handle)  // off-chain, private, zero gas
         → claim()                 // on-chain, triggers transfer
```

**Overflow guard:**
```solidity
// Before any subtraction, verify amount does not exceed balance
ebool isSafe = FHE.lte(claimAmount, encryptedVaultBalance);
// Use FHE.select to conditionally proceed — no plaintext branch leak
euint128 safeAmount = FHE.select(isSafe, claimAmount, FHE.asEuint128(0));
```

---

### KrypStream.sol (Continuous payments)

Handles continuous encrypted payment streaming.

**State:**
```solidity
struct Stream {
    euint128 ratePerSecond;   // encrypted — only recipient can see
    uint256 startTime;         // plaintext — public
    uint256 endTime;           // plaintext — public
    uint256 lastClaimedAt;     // plaintext — public
    bool active;               // plaintext — public
    address payer;             // plaintext — public
    address recipient;         // plaintext — public
    address token;             // plaintext — public
}

mapping(bytes32 => Stream) public streams;
mapping(address => bytes32[]) public recipientStreams;
```

**Key functions:**

`createStream(address recipient, InEuint128 encryptedRate, uint256 duration, address token)`
- Payer creates a stream with a hidden per-second rate
- `FHE.asEuint128(encryptedRate)` converts input
- `FHE.allowThis(rateHandle)` — contract retains rate for accrual calculations
- `FHE.allow(rateHandle, recipient)` — only recipient can view their rate
- Generates `streamId = keccak256(payer, recipient, startTime)`

`claim(bytes32 streamId)`
- Called by `stream.recipient`
- Computes elapsed: `uint256 elapsed = block.timestamp - stream.lastClaimedAt` (plaintext)
- Computes accrued: `euint128 accrued = FHE.mul(stream.ratePerSecond, FHE.asEuint128(elapsed))`
- Note: `elapsed` is plaintext, `ratePerSecond` stays encrypted — accrued is encrypted
- Overflow guard on multiplication: use `euint128` for rate, cap elapsed to reasonable max
- Updates `lastClaimedAt = block.timestamp`
- Triggers Privara SDK disbursement for accrued amount

`cancelStream(bytes32 streamId)`
- Payer cancels stream
- Final claim computed and disbursed to recipient
- Rate zeroed: `stream.ratePerSecond = FHE.asEuint128(FHE.trivialEncrypt(0))`
- `stream.active = false`

**Lazy evaluation — why it works:**

Instead of updating encrypted state every block (infeasible — each FHE operation is an async coprocessor call), we store the encrypted rate once and compute accrued balance only when `claim()` is called:

```
accrued = encryptedRate × elapsed_seconds
```

`elapsed_seconds` is derived from `block.timestamp` — public information. The rate stays encrypted throughout. An observer can see _when_ someone claims, but cannot compute the rate or the amount.

**Known limitation:** If a recipient claims at regular, predictable intervals, a persistent observer could attempt to correlate claim events with protocol-level events to estimate the rate. For most payroll and retainer use cases this is an acceptable trade-off. Documented in `TECH_AUDIT.md`.

---

### KrypstreamRouter.sol

Thin routing contract. Single interface for integrators.

```solidity
function pay(address recipient, InEuint128 amount, address token) external;
// → routes to KrypVault.setAllocation + claim in one flow

function stream(address recipient, InEuint128 rate, uint256 duration, address token) external;
// → routes to KrypStream.createStream

function claimAll() external;
// → claims all available vault allocations + accrued stream balances for msg.sender
```

---

## Data Privacy Model

| Data | On-chain visibility | Who can decrypt |
|------|-------------------|-----------------|
| Total vault balance | Public (uint256) | Everyone |
| Per-worker allocation amount | Encrypted (euint128) | Employer + that worker only |
| Per-worker allocation exists | Public (bool mapping) | Everyone |
| Stream rate per second | Encrypted (euint128) | Payer + recipient only |
| Stream start/end time | Public (uint256) | Everyone |
| Stream last claimed time | Public (uint256) | Everyone |
| Payment happened (event) | Public (event log) | Everyone |
| Payment amount transferred | Encrypted until disbursement | Payer + recipient only |

**What privacy guarantees are NOT provided:**
- Wallet address linkability: the fact that address X has an allocation or stream is public
- Timing of claims: visible on-chain
- Rate estimation: possible with sustained multi-point observation of stream claims
- Total compensation: if a worker has multiple streams/allocations, each is independently private but their total is not aggregated

---

## Client Architecture

### Encryption flow (employer sets allocation)

```
1. Employer enters amount in UI (plaintext, in browser)
2. useEncrypt hook encrypts amount client-side → InEuint128
3. wagmi sends transaction to KrypVault.setAllocation(worker, InEuint128)
4. CoFHE coprocessor processes encrypted input
5. Encrypted handle stored in contract mapping
6. FHE.allow grants worker address permission on handle
```

### Decryption flow (worker views balance)

```
1. Worker connects wallet and opens dashboard
2. useDecrypt hook calls @cofhe/sdk decryptForView(handle)
3. SDK requests decryption from CoFHE off-chain — no transaction
4. Threshold Network returns plaintext + signature (off-chain only)
5. Worker sees their amount in UI — never touches the chain as plaintext
```

### Claim flow (worker claims payment)

```
1. Worker clicks "Claim" in UI
2. Contract executes claim() — encrypted subtraction from vault
3. Privara SDK routes USDC transfer to worker wallet
4. Event emitted: PaymentClaimed(worker, streamId) — no amount in event log
5. Worker's encrypted allocation zeroed in contract
```

---

## Development Environment

**Local development (no testnet required):**
```bash
git clone https://github.com/fhenixprotocol/cofhe-hardhat-starter
pnpm install
pnpm test  # runs with cofhe-mock-contracts — fast, local, no FHE latency
```

**Mock environment behaviour:**
- FHE operations execute synchronously (real CoFHE is async via coprocessor)
- Gas costs are higher in mock due to simulation overhead
- `mock_expectPlaintext()` helper for assertions in tests

**Testnet deployment:**
```bash
# Base Sepolia
pnpm base-sepolia:deploy
# Arbitrum Sepolia (Wave 3+)
pnpm arb-sepolia:deploy
```

**Environment variables:**
```
PRIVATE_KEY=
BASE_SEPOLIA_RPC_URL=
ARB_SEPOLIA_RPC_URL=
PRIVARA_API_KEY=   # if required by SDK — confirm with Alexander
```

---

## Security Considerations

**No admin keys by design.** Once deployed, neither the Krypstream team nor any third party can access encrypted worker balances. Privacy is enforced by cryptography, not access policy.

**Employer can revoke unspent allocations.** This is a deliberate design choice — the vault is funded by the employer and allocations can be updated before claim. Post-claim, funds are irreversible.

**Re-entrancy:** All state mutations follow checks-effects-interactions. Encrypted state is updated before any external call to Privara SDK / ERC20 transfer.

**Overflow:** `euint128` supports values up to 2^128 - 1 (≈ 3.4 × 10^38). USDC has 6 decimals — even a $1 trillion payroll is well within range. Subtraction protected by encrypted comparison guard.

**Access control:** All FHE handles created in a transaction are only accessible to the creating contract by default. Explicit `FHE.allow(handle, addr)` calls are auditable on-chain via the ACL contract events.

---

## Deployment Checklist (Wave 2 target)

- [ ] `KrypVault.sol` deployed to Base Sepolia
- [ ] `KrypStream.sol` deployed to Base Sepolia (Wave 3)
- [ ] `KrypstreamRouter.sol` deployed to Base Sepolia (Wave 4)
- [ ] Privara SDK integration confirmed and tested
- [ ] All FHE.allow permissions verified correct
- [ ] Overflow guard tested with mock environment edge cases
- [ ] Contract addresses published in `deployments/base-sepolia.json`