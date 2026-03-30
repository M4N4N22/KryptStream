# Krypstream — Buildathon Roadmap

> Confidential treasury infrastructure for the encrypted web.
> Built natively on Fhenix CoFHE + Privara/ReinieraOS.

---

## Product Vision

Krypstream is a non-custodial, privacy-by-design payment protocol that enables organisations to manage salaries, contributor streams, and treasury flows without leaking financial strategy on-chain.

Two primitives. One protocol:

- **Discrete payments** — encrypted discrete payroll. Employer funds a vault; workers claim their allocation without any on-chain observer seeing individual amounts.
- **Continuous payments** — encrypted continuous streaming. Protocols stream compensation at a hidden per-second rate; recipients accrue a private balance claimable at any time.

No backend. No database. No server to breach. Privacy guaranteed by FHE cryptography, not infrastructure promises.

---

## Wave Overview

| Wave | Period | Focus | Deliverable |
|------|--------|-------|-------------|
| Wave 1 | Mar 21 – Mar 28 | Ideation + architecture | Docs, spec, proof-of-concept vault |
| Wave 2 | Mar 30 – Apr 6 | Discrete payments core | Working payroll contract + basic UI |
| Wave 3 | Apr 8 – May 8 | Discrete payments complete + Continuous payments foundation | Full payroll flow + streaming primitives |
| Wave 4 | May 11 – May 20 | Continuous payments complete + protocol unification | Combined Krypstream protocol |
| Wave 5 | May 23 – Jun 1 | Production hardening + ecosystem integrations | Mainnet-ready protocol |

---

## Wave 1 — Ideation and Architecture (Mar 21–28)

**Goal:** Establish the full technical and product foundation. Demonstrate clear understanding of the FHE ecosystem and produce a credible protocol architecture.

**Deliverables:**
- `ROADMAP.md` — this document
- `ARCHITECTURE.md` — system design, contract architecture, CoFHE integration pattern
- `PRD.md` — product requirements, user flows, acceptance criteria
- `TECH_AUDIT.md` — FHE feasibility analysis, CoFHE operation mapping, known constraints
- Proof-of-concept encrypted vault: deploy a minimal `euint128` balance contract to Base Sepolia demonstrating `FHE.allow(handle, addr)` access control

**Key decisions locked in:**
- Chain: Base Sepolia (primary), Arbitrum Sepolia (Wave 3+ if stability issues arise)
- Token: USDC (primary), USDT + other ERC20s from Wave 4
- Stack: CoFHE Solidity lib + `@cofhe/sdk` + `@cofhe/web/app` + Privara SDK for disbursement rails
- Privacy model: native FHE (Stage 2+), not TEE or ZK-proxy

**Differentiation established:**
- Zalary (direct competitor) is TEE-based with a Django/PostgreSQL backend — we are fully on-chain, no server
- No other submission is building encrypted streaming — Continuous payments is unclaimed territory

---

## Wave 2 — Discrete payments Core (Mar 30–Apr 6)

**Goal:** Ship a working encrypted payroll contract with a functional employer/worker UI.

**Contract work:**
- `KrypVault.sol` — employer deposits USDC, encrypted per-address allocations stored as `euint128`
- `claim()` function — worker claims their allocation using `FHE.allow(handle, workerAddr)` permit pattern
- `setAllocation(address worker, InEuint128 amount)` — employer sets encrypted amounts
- Overflow guard: manual encrypted comparison before any subtraction
- Deploy to Base Sepolia

**Frontend work:**
- Employer dashboard: fund vault, set allocations (encrypted inputs via `useEncrypt` hook)
- Worker dashboard: view personal balance (via `decryptForView`, off-chain only, zero gas)
- Claim flow: one-click claim that triggers Privara SDK payment disbursement
- Connect wallet (wagmi pattern, same as Privara SDK interface)

**Integration:**
- Confirm Privara SDK transfer capability (book Alexander Calendly call before Wave 2 starts)
- If SDK handles full ERC20 transfer: use Privara as disbursement layer
- Fallback: standard `IERC20.transferFrom()` on claim — Privara used for UX/permit layer only

**Milestone:** End-to-end demo — employer funds vault, sets encrypted allocations for 3 addresses, worker claims and receives USDC, observer sees nothing except total vault balance.

---

## Wave 3 — Discrete payments Complete + Continuous payments Foundation (Apr 8–May 8)

**Goal:** Harden Discrete payments to production quality. Lay the cryptographic and contract foundation for Continuous payments.

**Discrete payments hardening:**
- Multi-token support: extend `KrypVault.sol` to accept any ERC20 (USDC + USDT)
- Batch allocation: employer sets multiple worker amounts in one transaction
- Revocation: employer can zero out an allocation before it is claimed
- Access control audit: review all `FHE.allow` / `FHE.allowThis` permissions
- Test coverage: 90%+ on all contract paths using CoFHE mock environment

**Continuous payments foundation:**
- `KrypStream.sol` — core streaming contract
- `createStream(address recipient, InEuint128 ratePerSecond, uint256 startTime, uint256 endTime)` — stores encrypted rate, plaintext timestamps
- Lazy evaluation: `accrued = FHE.mul(encryptedRate, plaintext_elapsed)` computed at claim time — no per-block updates
- `FHE.allow(rateHandle, recipient)` — only recipient can decrypt their own rate
- Cancel stream: zero out encrypted rate via `FHE.asEuint128(FHE.trivialEncrypt(0))`
- Deploy to Base Sepolia

**Key technical validation in this wave:**
- Confirm `FHE.mul(euint128, plaintext uint)` works correctly for accrual computation
- Benchmark gas costs on real Base Sepolia transactions (not mock)
- Confirm stream cancel pattern with Fhenix team if needed

**Milestone:** Continuous payments contract deployed with working `createStream` and `claim` in mock environment. Discrete payments fully hardened and gas-benchmarked.

---

## Wave 4 — Continuous payments Complete + Protocol Unification (May 11–May 20)

**Goal:** Ship Continuous payments to production quality and unify both primitives under the Krypstream protocol interface.

**Continuous payments completion:**
- Frontend for stream creation: funder sets recipient, encrypted rate, duration
- Recipient dashboard: view accrued balance (`decryptForView`), claim at any time
- Stream management: pause, resume, cancel with correct encrypted state transitions
- Multi-stream support: one address can hold multiple active streams
- Vesting mode: cliff enforcement in encrypted contract logic

**Protocol unification:**
- `KrypstreamRouter.sol` — single entry point routing to `KrypVault` (Discrete payments) or `KrypStream` (Continuous payments)
- Unified `useKrypstream` React hook wrapping both CoFHE hooks and Privara SDK
- Single dashboard: employer/payer sees both vaults and streams in one view
- Shared access control registry across both contracts

**Ecosystem integrations:**
- ReinieraOS settlement engine for streaming payment settlement
- Multi-token: USDC + USDT both confirmed working end-to-end
- Explore Arbitrum Sepolia deployment as secondary chain

**Milestone:** Full Krypstream protocol demo — payroll vault + active stream running simultaneously, unified dashboard, Privara SDK powering both disbursements.

---

## Wave 5 — Production Hardening + Showcase (May 23–Jun 1)

**Goal:** Production-ready protocol. Audit-ready contracts. Mainnet preparation. NY Tech Week presentation-ready.

**Contract hardening:**
- External security review (reach out to Fhenix team for architecture review session)
- Edge case handling: stream with zero duration, claim with zero balance, duplicate allocations
- Gas optimisation pass: minimise CoFHE coprocessor calls per transaction
- Natspec documentation on all public functions

**Frontend polish:**
- Mobile-responsive UI
- Error states: insufficient vault balance, expired stream, revoked allocation
- Transaction status: pending CoFHE coprocessor confirmation UX (async pattern)
- Demo mode: guided walkthrough for evaluators and investors

**Protocol documentation:**
- Integration guide for DAOs wanting to use Krypstream for contributor payments
- API reference for `KrypstreamRouter.sol`
- Privacy guarantees document: what is hidden, what is public, known trade-offs (timestamp visibility in streams)

**Ecosystem positioning:**
- Fhenix incubator application materials
- Comparison document vs Zalary (TEE vs FHE, custodial vs non-custodial)
- Mainnet deployment checklist (pending Fhenix mainnet availability)

**Milestone:** Full protocol live on Base Sepolia. Demo-ready for NY Tech Week. Incubator application submitted.

---

## Technical Stack Summary

| Layer | Technology |
|-------|------------|
| Encrypted compute | Fhenix CoFHE (`@fhenixprotocol/cofhe-contracts/FHE.sol`) |
| Client SDK | `@cofhe/sdk` — encrypt, decrypt, permit management |
| Payment rails | Privara SDK (`@reineira-os/sdk`) + ReinieraOS settlement |
| Development | Hardhat + `cofhe-hardhat-plugin` + mock contracts |
| Frontend | React + wagmi (same pattern as Privara SDK interface) |
| Primary chain | Base Sepolia → Base Mainnet |
| Secondary chain | Arbitrum Sepolia (Wave 3+) |
| Primary token | USDC → USDT + ERC20 (Wave 4) |

---

## Known Constraints and Mitigations

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| euint arithmetic wraps on overflow | Silent balance corruption | Use `euint128` + manual encrypted comparison guard before all subtractions |
| `block.timestamp` is public | Stream duration observable, rate estimation possible via multi-point observation | Document as known limitation; rate stays private, only timing is public |
| Gas benchmark docs incomplete | Cannot predict exact costs before deployment | Benchmark on real Base Sepolia in Wave 2 before building further |
| Privara SDK transfer capability unconfirmed | Disbursement layer design depends on answer | Book Alexander call before Wave 2; fallback is standard `IERC20.transferFrom()` |
| CoFHE is testnet-only | No mainnet deployment until Fhenix launch | Target testnet throughout buildathon; prepare mainnet checklist for Wave 5 |

---

## Success Metrics Per Wave

| Wave | Primary metric | Secondary metric |
|------|---------------|-----------------|
| Wave 1 | Architecture reviewed and approved by Fhenix team | PoC vault deployed to Base Sepolia |
| Wave 2 | End-to-end payroll flow working | Privara SDK integration confirmed |
| Wave 3 | Discrete payments 90%+ test coverage | Continuous payments contract deployed |
| Wave 4 | Unified protocol demo running | Both chains live |
| Wave 5 | Production-ready codebase | Incubator application submitted |