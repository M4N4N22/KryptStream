# Krypstream — Technical Feasibility Audit

> Version: 0.1 (Wave 1)
> Purpose: Validate every required operation against CoFHE and Privara capabilities before writing production code. This document exists because ecosystem constraints have killed ideas mid-build before. It is updated each wave as new constraints are discovered.

---

## Audit Methodology

For each feature in Krypstream, we map the exact FHE operation required, confirm it against the CoFHE documentation, flag any constraints, and define the mitigation. A feature marked **BLOCKED** does not proceed to implementation until resolved.

---

## CoFHE — Encrypted Types Available

Confirmed from `cofhe-docs.fhenix.zone/fhe-library/core-concepts/encrypted-operations`:

| Type | Bit size | Our usage |
|------|----------|-----------|
| `euint8` | 8 | Not used |
| `euint16` | 16 | Not used |
| `euint32` | 32 | Not used |
| `euint64` | 64 | Not used |
| `euint128` | 128 | Primary type for all monetary values |
| `ebool` | 8 | Encrypted conditionals (overflow guard, access checks) |
| `eaddress` | 160 | Potential use for encrypted recipient in future |

**Why `euint128` for all amounts:** USDC has 6 decimal places. Even $1 trillion in USDC = 10^18 units, well within `euint128` range of 2^128 - 1 ≈ 3.4 × 10^38. Using the largest available integer type eliminates a class of overflow bugs.

---

## CoFHE — Operations Audit

### Confirmed supported operations (from docs)

| Operation | CoFHE function | Status | Our use |
|-----------|---------------|--------|---------|
| Addition | `FHE.add(a, b)` | Confirmed | Accumulate stream balance |
| Subtraction | `FHE.sub(a, b)` | Confirmed | Deduct from vault on claim |
| Multiplication | `FHE.mul(a, b)` | Confirmed | `rate × elapsed` in streaming |
| Division | `FHE.div(a, b)` | Confirmed | Not currently used |
| Less-than-or-equal | `FHE.lte(a, b)` | Confirmed | Overflow guard |
| Equal | `FHE.eq(a, b)` | Confirmed | Check allocation exists |
| Select (ternary) | `FHE.select(cond, a, b)` | Confirmed | Safe subtraction pattern |
| Bitwise AND/OR/XOR | `FHE.and / or / xor` | Confirmed | Not currently used |

### Access control operations (confirmed)

| Operation | Behaviour | Our use |
|-----------|-----------|---------|
| `FHE.allowThis(handle)` | Contract retains access across txs | Store encrypted allocations |
| `FHE.allow(handle, addr)` | Permanent access for specific address | Grant worker access to their allocation |
| `FHE.allowSender(handle)` | Grant msg.sender access | Used in claim flow |
| `FHE.allowTransient(handle, addr)` | Temporary, single-tx access | Cross-contract calls if needed |
| `FHE.allowPublic(handle)` | Anyone can decrypt | NOT used — would expose amounts |
| `FHE.allowGlobal(handle)` | Fully public | NOT used — would expose amounts |

### Decryption operations (confirmed)

| Method | Where | Gas | Our use |
|--------|-------|-----|---------|
| `decryptForView` | Off-chain client only | Zero | Worker views their balance in UI |
| `decryptForTx` | On-chain, public once published | Yes | Settlement proof if required |

**Key insight:** For Discrete payments and Continuous payments, we never need `decryptForTx` in normal operation. The worker views their balance via `decryptForView` (private, off-chain) and the claim triggers a transfer without revealing the amount on-chain. `decryptForTx` is only needed if we later add an auditor/compliance view.

---

## Feature-by-Feature Feasibility

### Discrete payments Features

**F1 — Store encrypted salary per worker**
- Required: `euint128` mapping `address => euint128`
- Operation: `FHE.asEuint128(InEuint128 input)` converts user-provided encrypted input to compute type
- Persist: `FHE.allowThis(handle)` so contract retains access
- Status: **CLEAR**

**F2 — Only worker can see their own allocation**
- Required: `FHE.allow(handle, workerAddress)` after setting allocation
- Behaviour: Any address other than `workerAddress` and the contract itself will receive `ACLNotAllowed` on any FHE operation on this handle
- Status: **CLEAR**

**F3 — Deduct from vault on worker claim**
- Required: `FHE.sub(encryptedVaultBalance, workerAllocation)`
- Constraint: Arithmetic wraps silently on underflow (no revert) — must guard
- Mitigation: `ebool isSafe = FHE.lte(allocation, vaultBalance)` before subtraction; use `FHE.select(isSafe, allocation, FHE.asEuint128(0))` to produce zero-amount claim if insufficient funds
- Status: **CLEAR with mitigation**

**F4 — Worker views balance privately in UI**
- Required: `decryptForView(handle)` via `@cofhe/sdk`
- Behaviour: Off-chain only, no transaction, no gas, no on-chain trace
- Status: **CLEAR**

**F5 — Employer cannot see other employers' vaults**
- Design: Each vault is a separate contract instance or isolated mapping — not shared state
- No FHE cross-vault access possible without explicit `FHE.allow`
- Status: **CLEAR by design**

**F6 — Prevent overflow on 128-bit values**
- Constraint (from docs): "arithmetic on euint types is unchecked — there is wrap-around on overflow"
- This is the single most important constraint in CoFHE for a payment protocol
- Mitigation: Always use `euint128` (largest type). Always guard subtraction with `FHE.lte` comparison first. Documented overflow pattern:
```solidity
ebool canClaim = FHE.lte(workerAllocation, encryptedVaultBalance);
euint128 safeAmount = FHE.select(canClaim, workerAllocation, FHE.asEuint128(FHE.trivialEncrypt(0)));
// proceed with safeAmount — if canClaim is false, safeAmount is 0 and no transfer happens
```
- Status: **CLEAR with mitigation — mandatory pattern in all contracts**

---

### Continuous payments Features

**F7 — Store encrypted rate per stream**
- Required: `euint128` field in `Stream` struct
- Same pattern as F1 — `FHE.allowThis` + `FHE.allow(handle, recipient)`
- Status: **CLEAR**

**F8 — Compute accrued = rate × elapsed at claim time (lazy evaluation)**
- Required: `FHE.mul(euint128 encryptedRate, uint elapsed)`
- Note: CoFHE supports mixed operations: `FHE.mul(euint128, euint128)` confirmed. Mixed `FHE.mul(euint128, plaintext_uint)` — requires converting plaintext to trivial encryption first:
```solidity
uint256 elapsed = block.timestamp - stream.lastClaimedAt;
euint128 encryptedElapsed = FHE.asEuint128(FHE.trivialEncrypt(uint128(elapsed)));
euint128 accrued = FHE.mul(stream.ratePerSecond, encryptedElapsed);
```
- Trivial encryption: wraps a public value in FHE ciphertext for use in FHE operations. The value is not secret — it's just needed for type compatibility.
- Status: **CLEAR — trivial encrypt pattern is documented**

**F9 — Elapsed time from block.timestamp**
- `block.timestamp` is plaintext — always public
- The rate stays encrypted; the timestamp does not
- Limitation: observers can see when `claim()` was called and approximately how much time elapsed since last claim. Combined with multiple observations, rate can potentially be estimated.
- Mitigation: document as known limitation (see Privacy Trade-offs section below)
- Status: **AWARE — known limitation, not a blocker**

**F10 — Cancel stream: zero out encrypted rate**
- Required: Set `ratePerSecond` to encrypted zero
- Pattern: `FHE.asEuint128(FHE.trivialEncrypt(0))` — trivially encrypt the value 0
- Note: needs to verify this correctly overwrites the existing handle and that `FHE.allowThis` is re-applied to the new zero handle
- Status: **NEEDS VERIFICATION in mock environment — mark as Wave 2 test case**

**F11 — Cliff enforcement for vesting streams**
- Required: `require(block.timestamp >= cliffTime)` before first claim
- `cliffTime` is plaintext — not encrypted, just a uint256 in the struct
- The cliff date itself is visible — only the amount per unit time is hidden
- Status: **CLEAR — purely plaintext logic**

---

## CoFHE Architecture Constraints

### Async coprocessor pattern

CoFHE FHE operations do not execute synchronously in the EVM. The contract emits an event requesting computation, the CoFHE coprocessor executes the FHE operation off-chain, and the result is returned. This means:

- FHE operations add latency beyond normal transaction confirmation
- UI must handle pending states explicitly — not just waiting for tx confirmation
- In the mock environment, operations are synchronous (for testing speed)
- Do NOT design UI assuming instant FHE results

**Impact on Krypstream:** The `claim()` call will have a two-phase experience: transaction submitted → FHE computation pending → result returned → transfer executed. The frontend must communicate this clearly.

### Gas costs

The gas benchmark page in CoFHE docs is blank ("coming soon"). What is confirmed:
- FHE compute is offloaded to the coprocessor — gas is for the on-chain coordination, not the FHE arithmetic itself
- Base Sepolia has negligible gas costs relative to mainnet
- Mock environment has higher simulated gas costs than real testnet (by design)

**Action for Wave 2:** Run actual gas benchmarks on Base Sepolia for:
- `setAllocation` (1 FHE store + 2 FHE.allow calls)
- `claim` (1 FHE.lte + 1 FHE.select + 1 FHE.sub)
- `createStream` (1 FHE store + 2 FHE.allow calls)
- `claim(streamId)` (1 FHE.mul + 1 FHE.lte + 1 FHE.select)

### No revert on overflow (critical)

Confirmed from docs: "revert on overflow is not supported as this would leak some information about the encrypted integers."

This is not a bug — it is a deliberate FHE property. If the FHE circuit reverted on overflow, an attacker could probe values by attempting arithmetic and observing reverts — leaking information.

**Every subtraction and multiplication in Krypstream must be guarded.** This is non-negotiable. See F3 and F6 above for the mitigation pattern.

---

## Privara SDK Audit

### Confirmed

- Package exists: `@reineira-os/sdk` on npm
- Purpose: confidential payment flows and stablecoin interactions at application layer
- ReinieraOS: settlement engine powering P2P stablecoin payments
- Team is active and in the Telegram — Alexander has a public Calendly
- Prebuilt contract patterns for compliant payment rails

### Not yet confirmed (open questions)

**Question 1 (Critical):** Does the SDK execute the actual ERC20 token transfer, or does it handle intent routing and the calling contract must execute the transfer itself?

- If SDK handles transfer: our `claim()` calls `PrivaraSDK.disburse(recipient, amount, token)` and the SDK manages the rest
- If SDK is intent-routing only: our contract calls `IERC20(token).transfer(recipient, amount)` directly; Privara used only for UI/permit orchestration

**This changes the contract architecture.** Must be resolved before Wave 2 starts.

**Question 2 (High):** Does the SDK require an API key, on-chain registration, or any KYC step to use?

**Question 3 (Medium):** What networks does the SDK currently support? Is Base Sepolia confirmed?

**Action: Book Alexander's Calendly before Wave 2 starts.** Link from Telegram: `https://calendly.com/alexander-privara/30min`

### Fallback plan

If Privara SDK is not compatible with our architecture or requires unavailable features:

**Fallback:** Use standard `IERC20.transfer(recipient, amount)` in the claim function. The privacy guarantees are unchanged — the transfer amount is determined by the encrypted computation, so even though the transfer itself uses a standard ERC20 call, the amount was never plaintext on-chain until the moment of disbursement. Privara is used for the UI permit layer only.

This fallback is architecturally sound and does not compromise the core value proposition.

---

## Privacy Trade-offs and Known Limitations

This section is deliberately included for intellectual honesty. We document what Krypstream does NOT hide, so evaluators and users have accurate expectations.

### What IS private
- Individual salary amounts in Discrete payments vaults
- Per-second streaming rate in Continuous payments
- Accrued stream balance at any point in time
- The split of total vault funds across workers

### What is NOT private
- That a vault exists and its total balance (employer solvency is intentionally public)
- That address X has an allocation (the mapping key is public, only the value is encrypted)
- That address X has an active stream (struct exists in mapping, rate is encrypted)
- When a stream claim was made (block.timestamp of `claim()` call)
- Stream duration (start and end time are public)
- That a payment happened (event log shows claim occurred, not the amount)

### Rate estimation attack

**Scenario:** A persistent observer watches a stream recipient claim multiple times. Each claim reveals the elapsed time since the last claim. If the observer also knows the payer's USDC balance before and after the claim, they can calculate the transfer amount and divide by elapsed time to derive the rate.

**Mitigation options:**
1. Privara SDK obscures the transfer amount at the settlement layer (if supported)
2. Recipients are advised to claim at irregular intervals for higher-value streams
3. Future: use `decryptForTx` with a ZK proof to unbind the transfer amount from the claim event

**Current status:** Documented known limitation. For most payroll and retainer use cases, the rate estimation attack requires sustained observation and is not practical. For high-value streams where rate confidentiality is critical, Wave 5 will explore mitigation options.

---

## Chain Compatibility

| Chain | CoFHE support | Privara SDK support | Our plan |
|-------|--------------|--------------------|----|
| Ethereum Sepolia | Confirmed | Assumed | Fallback only |
| Base Sepolia | Confirmed | Unconfirmed — verify | Primary (Wave 1+) |
| Arbitrum Sepolia | Confirmed | Unconfirmed — verify | Secondary (Wave 3+) |
| Mainnet (any) | Not yet | Unknown | Post-buildathon |

---

## Wave 1 Proof-of-Concept Scope

To validate the core architectural assumption before Wave 2 build begins, we deploy a minimal contract to Base Sepolia:

```solidity
// MinimalVault.sol — Wave 1 PoC only
import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MinimalVault {
    mapping(address => euint128) private allocations;

    function setAllocation(address worker, InEuint128 calldata encAmount) external {
        euint128 handle = FHE.asEuint128(encAmount);
        FHE.allowThis(handle);
        FHE.allow(handle, worker);
        allocations[worker] = handle;
    }

    // Worker calls this — decryptForView off-chain in the client
    function getAllocationHandle(address worker) external view returns (euint128) {
        return allocations[worker];
    }
}
```

**What this proves:**
- CoFHE Solidity library integrates correctly in our Hardhat environment
- `FHE.allow(handle, addr)` enforces per-worker access control
- Client-side `decryptForView` returns correct plaintext to the authorised address only
- Base Sepolia deployment works end-to-end

**What this does NOT include:** actual USDC transfer, overflow guard, claim function. Those are Wave 2.

---

## Audit Sign-off Checklist

Before proceeding to Wave 2 code:

- [x] All required FHE operations confirmed in docs (add, sub, mul, lte, select, trivialEncrypt)
- [x] Access control pattern confirmed (FHE.allowThis + FHE.allow per worker)
- [x] Decryption modes understood (decryptForView for UI, decryptForTx for settlement only)
- [x] Overflow constraint documented and mitigation pattern defined
- [x] Async coprocessor latency understood — UI design accounts for it
- [x] Lazy evaluation pattern for streaming confirmed (trivial encrypt elapsed time)
- [ ] Privara SDK transfer capability confirmed — **OPEN: book Calendly before Wave 2**
- [ ] Base Sepolia gas costs benchmarked — **OPEN: first week of Wave 2**
- [ ] Stream cancel zero-out pattern tested in mock — **OPEN: first days of Wave 2**
- [ ] MinimalVault.sol deployed to Base Sepolia — **Wave 1 target**