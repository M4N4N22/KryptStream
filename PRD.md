# Krypstream — Product Requirements Document

> Version: 0.1 (Wave 1)
> Status: Draft

---

## 1. Problem Statement

Public blockchains made transparency the default. That was the right trade-off for trustless settlement — but it created a hard ceiling on what financial applications can be built.

On any transparent chain today, when an organisation pays contributors:
- Every salary amount is visible to every team member, competitor, and observer
- Vesting schedules expose the cap table to governance attackers
- LP incentive rates can be front-run before they're even claimed
- Contractor margins reveal agency pricing strategy to clients

These are not edge cases. They are the reason most organisations that need to pay people on-chain don't — and why the ones that try (Sablier, Superfluid, Gnosis Safe) ultimately leak financial strategy.

Existing "solutions" fall into two categories:

**Centralised (Deel, Request Finance, Coinshift):** Privacy through infrastructure promises. A server breach, subpoena, or rogue employee exposes everything. Custodial.

**TEE-based (Zalary and similar):** Privacy through hardware trust. TEE collapses if the enclave is compromised. Still requires centralised infrastructure.

Neither is privacy-by-design. Both are retrofits.

**Krypstream's approach:** encrypt the financial state itself, on-chain, using Fully Homomorphic Encryption. There is no plaintext to steal because there is no server that holds plaintext. Privacy is a cryptographic guarantee, not an infrastructure promise.

---

## 2. Target Users

### Primary: Crypto-native organisations paying contributors

**Who:** DAOs, DeFi protocols, web3 startups with distributed contributor bases
**Pain:** Salary visibility causes renegotiation requests, contributor churn, and compensation drama
**Current solution:** Multisig + Gnosis Safe — fully transparent
**Job to be done:** Pay contributors fairly without leaking individual compensation to the team or to the chain

### Secondary: Agencies and freelance platforms

**Who:** Web3 development agencies, design studios, bounty platforms
**Pain:** Client can see on-chain that agency pays contractors less than the client rate — destroys margin
**Current solution:** Off-chain invoicing (defeats the purpose of crypto payroll)
**Job to be done:** Execute on-chain payments without revealing agency margins to clients

### Tertiary: Protocol treasuries doing strategic incentives

**Who:** DeFi protocols running liquidity mining or security retainer programmes
**Pain:** Publicly visible incentive rates attract mercenary capital and can be front-run
**Current solution:** No good option — either transparent rates or centralised off-chain deals
**Job to be done:** Stream payments to LPs, auditors, and ecosystem partners at rates that don't leak strategy

---

## 3. Product Primitives

### 3.1 Discrete payments — Encrypted Discrete Payroll

A non-custodial vault where an employer deposits stablecoins, sets per-worker encrypted allocations, and workers claim their own amount at any time — with no other party able to see individual amounts.

**Core properties:**
- Employer knows all allocations (they set them)
- Each worker knows only their own allocation
- Observers know the total vault balance and that a payment happened — not the amount
- No admin key — employer can update pre-claim, but cannot access funds post-claim
- Non-custodial: funds stay in the smart contract, not on a server

### 3.2 Continuous payments — Encrypted Continuous Streaming

A streaming primitive where a payer opens a continuous payment stream to a recipient at an encrypted per-second rate. The recipient accrues a private balance and can claim at any time. The rate itself is never visible on-chain.

**Core properties:**
- Rate is encrypted — only payer and recipient can see it
- Start/end time and duration are public (stream scheduling visible)
- Recipient's accrued balance computed at claim time via lazy evaluation
- Payer can cancel with final settlement to recipient
- Supports vesting patterns (cliff enforcement in contract logic)

---

## 4. User Stories

### Employer / Payer

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| E1 | As an employer, I want to fund a vault with USDC so contributors can claim their salary | Deposit tx accepted; total balance visible in dashboard |
| E2 | As an employer, I want to set an encrypted salary amount for each contributor address | `setAllocation` tx accepted; amount encrypted on-chain; no observer can see individual amounts |
| E3 | As an employer, I want to update a contributor's allocation before they claim | `setAllocation` called again on same address; overwrites previous allocation |
| E4 | As an employer, I want to see total vault balance to know if I need to top up | Total balance readable as public `uint256` |
| E5 | As a protocol, I want to open a continuous stream to a security researcher at an encrypted rate | `createStream` tx accepted; rate stored encrypted; researcher can decrypt their own rate |
| E6 | As a protocol, I want to cancel a stream with fair final settlement to the recipient | `cancelStream` computes and disbursed accrued amount; stream marked inactive |

### Worker / Recipient

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| W1 | As a worker, I want to see my own salary allocation privately in the app | `decryptForView` returns plaintext to me only; no on-chain transaction; no gas cost |
| W2 | As a worker, I want to claim my salary at any time | `claim()` triggers USDC transfer to my wallet; my allocation zeroed in vault |
| W3 | As a worker, I cannot see any other worker's allocation | Any attempt to decrypt another worker's handle fails ACL check |
| W4 | As a stream recipient, I want to see how much I've accrued so far | `decryptForView` on accrued balance (computed lazily); shown in UI |
| W5 | As a stream recipient, I want to claim my accrued balance at any time | `claim(streamId)` disburses accrued USDC; updates `lastClaimedAt` |
| W6 | As a recipient, I want to see all my active streams in one place | Dashboard lists all streams where `msg.sender == recipient` |

### Observer (anyone else)

| ID | What they can see | What they cannot see |
|----|------------------|---------------------|
| O1 | That a vault exists and its total USDC balance | Individual worker allocations |
| O2 | That a payment claim was made (event log) | The amount of the claim |
| O3 | That a stream exists, its duration, its payer and recipient | The per-second rate |
| O4 | When a stream was last claimed | How much was claimed |

---

## 5. Feature Requirements

### Wave 2 MVP (Discrete payments)

**Must have:**
- Employer can deposit USDC to vault
- Employer can set encrypted allocations per worker address
- Worker can view their own allocation privately (off-chain decrypt)
- Worker can claim their allocation, triggering USDC transfer
- Basic employer dashboard: vault balance, list of allocated addresses (no amounts shown)
- Basic worker dashboard: personal balance (decrypted locally), claim button

**Should have:**
- Employer can update allocation before worker claims
- Empty state handling (no allocation set message)
- Transaction pending states (CoFHE coprocessor is async)

**Won't have in Wave 2:**
- Multi-token support (Wave 4)
- Batch allocation (Wave 3)
- Streaming (Wave 3)

### Wave 3 Addition (Continuous payments foundation)

**Must have:**
- Payer can create stream with encrypted rate, public duration
- Recipient can view accrued balance privately
- Recipient can claim accrued balance
- Stream list view for recipient

**Should have:**
- Payer can cancel stream with final settlement
- Stream status indicators (active, ended, cancelled)

### Wave 4 (Unification)

**Must have:**
- `KrypstreamRouter.sol` as unified entry point
- Unified dashboard showing both vault allocations and streams
- USDT support alongside USDC
- `claimAll()` — one-click claim everything available

---

## 6. Non-Functional Requirements

**Privacy:**
- Individual payment amounts must never appear in plaintext in any on-chain state, event log, or transaction calldata
- Per-worker access control must be enforced at the cryptographic layer (`FHE.allow`), not at the application layer
- Off-chain decryption (`decryptForView`) must be the default for balance display — never `decryptForTx` unless settlement requires on-chain proof

**Security:**
- No admin or upgrade key on vault or stream contracts
- All encrypted state access explicitly permissioned — no `FHE.allowGlobal()` on any monetary handle
- Re-entrancy protection on all external calls
- Overflow guard on all encrypted arithmetic

**Usability:**
- A non-technical employer should be able to fund a vault and set allocations within 3 minutes
- A worker with any Ethereum wallet should be able to view their balance and claim without installing anything beyond a browser extension
- Async CoFHE coprocessor latency must be communicated in the UI (not a blank loading state)

**Reliability:**
- Smart contracts are immutable post-deployment — no upgrade mechanism in MVP
- If Privara SDK is unavailable, fallback to direct `IERC20.transfer` must work transparently
- All FHE operations testable in mock environment before testnet deployment

---

## 7. Competitive Differentiation

| Dimension | Krypstream | Zalary | Sablier/Superfluid | Deel/Request Finance |
|-----------|------------|--------|--------------------|----------------------|
| Privacy model | Native FHE (Stage 2) | TEE (Stage 0) | None (transparent) | Centralised server |
| Custodial | No | Yes (Django backend) | No | Yes |
| Streaming | Yes (Wave 3) | No | Yes (but public) | No |
| Backend required | No | Yes (6 Docker containers) | No | Yes |
| Breach risk | Cryptographically none | Server breach exposes all | N/A | Server breach exposes all |
| Ecosystem alignment | Fhenix + Privara native | Partial Fhenix port | None | None |

**Primary wedge vs Zalary (direct competitor):**
Zalary is a TEE-wrapped traditional payroll app with a Django backend. A compromised enclave or server exposes all payroll data. Zalary also admits that employee address-to-public-key mappings are still visible on-chain and plans to address this "in Wave 2". Krypstream solves this from day one via `FHE.allow(handle, workerAddr)` — the handle permission system enforces access control at the cryptographic layer, not the application layer.

**Primary wedge vs streaming protocols:**
Sablier and Superfluid both leak the stream rate on-chain — their entire value proposition is transparency of vesting schedules. Continuous payments is the first streaming primitive where the rate itself is a private input. This is net-new, not incremental.

---

## 8. Open Questions (to be resolved Wave 2)

| Question | Owner | Priority |
|----------|-------|----------|
| Does Privara SDK handle the actual ERC20 transfer, or only intent/permit routing? | Alexander (Privara) — book Calendly | Critical |
| What is the gas cost of `FHE.mul(euint128, plaintext)` on real Base Sepolia? | Team — benchmark Wave 2 | High |
| Does `FHE.trivialEncrypt(0)` correctly zero a stream rate for cancellation? | Team — test in mock | High |
| Does Privara SDK require an API key or is it purely on-chain? | Docs + Alexander call | Medium |
| Should employer be able to see the total claimed vs unclaimed split? | Product decision | Medium |

---

## 9. Out of Scope (this buildathon)

- KYC / identity verification on recipients
- Fiat on/off ramps
- Multi-sig employer vault (single EOA only in MVP)
- Cross-chain streams (one chain per deployment)
- Gas abstraction / account abstraction
- Mobile native app
- Governance token or protocol fee mechanism