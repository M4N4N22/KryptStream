# Krypstream — Competitive Analysis

> Version: 0.1 (Wave 1)
> Purpose: Position Krypstream clearly relative to known buildathon submissions and broader market alternatives. Use this document in evaluator presentations and incubator applications.

---

## Within This Buildathon

### Zalary — Direct Competitor

**What it is:** A production-deployed payroll system being ported to use CoFHE FHE. Built with Django, Docker, PostgreSQL, Celery, Redis, TEE encryptor, and a viem worker.

**Privacy model:** Stage 0 per Fhenix's own Privacy Stages framework. TEE (Trusted Execution Environment) — privacy holds only as long as the hardware enclave is not compromised.

**Custodial model:** Centralised. Six Docker containers. Django backend. A server breach, subpoena, or rogue employee exposes all payroll data.

**Known weakness (their own words):** "We opted to store a mapping of employee addresses to their public key, but this still makes keys visible. We'll revisit this in Wave 2."

**How Krypstream beats it:**

| Dimension | Zalary | Krypstream |
|-----------|--------|------------|
| Privacy model | TEE (Stage 0) — hardware trust | Native FHE (Stage 2) — cryptographic proof |
| Backend required | Yes (Django + Postgres + 6 containers) | No — fully on-chain |
| Breach risk | Server breach exposes all payroll | No plaintext to steal — nothing to breach |
| Address privacy | Admitted gap — "keys still visible" | Solved from day one via `FHE.allow(handle, addr)` |
| Streaming | No | Yes (Continuous payments — Wave 3) |
| Ecosystem alignment | Partial port — not natively FHE | Built natively on CoFHE + Privara |

**Narrative:** Zalary is Deel with a TEE wrapper and a backend server. Krypstream is the protocol Zalary will eventually have to become — if it survives the architectural debt.

---

### HomoVault — Adjacent, Not Direct

**What it is:** AI agents spending USDC anywhere Visa is accepted, with FHE-secured spending policy controls.

**Different from us:** Targets AI agent payments, not human payroll or protocol treasury flows. Different user base entirely.

**How they're relevant:** They use a ClawRouter + MPC key protection pattern, which is interesting for future Krypstream integrations (AI agents as stream recipients is a plausible Wave 5 extension).

---

### BlindDeal — Different Category

**What it is:** Encrypted price negotiation and sealed-bid matching. Two parties submit encrypted bids; if they match within a range, the deal is confirmed.

**Different from us:** Negotiation/trading use case, not compensation. Strong technical execution (22/22 tests, deployed to Arb + Eth Sepolia) — possibly the best-executed FHE contract in the buildathon.

**What to learn from them:** Their FHE contract architecture is clean and well-tested. Worth reviewing their repo for patterns.

---

### Anonymous FHE Creator Platform

**What it is:** Private subscriptions and social graph — "no one knows who you follow, not even us."

**Different from us:** Social/creator economy. No overlap with our use cases.

---

## Broader Market

### Transparent payment protocols (Sablier, Superfluid)

**What they do:** Programmable token streaming — vesting, salaries, subscriptions — all on-chain.

**Fatal flaw for privacy-sensitive use cases:** The stream rate, recipient, and amount are all fully public. Sablier's entire value proposition relies on transparency — vesting schedules are designed to be auditable by all stakeholders.

**How Krypstream differs:** Continuous payments is the first streaming primitive where the rate itself is a private input. This is not incremental improvement — it is a categorically different product.

---

### Centralised payroll platforms (Deel, Request Finance, Coinshift, Bitwage)

**What they do:** Bridge fiat payroll and crypto disbursement. Privacy through server security.

**Fatal flaw:** Single point of failure. Server breach, subpoena, or rogue employee exposes all payroll data. Not non-custodial.

**How Krypstream differs:** No server, no database, no custodian. The only thing that can expose payroll data is a break in FHE cryptography itself — an academic problem, not an operational one.

---

### TEE-based approaches (Oasis Network, Secret Network, Phala)

**What they do:** Execute computations inside hardware enclaves (Intel SGX, AMD SEV) that keep data private from the host machine.

**Known weakness:** TEE collapses if the enclave is compromised — either via hardware exploit, supply chain attack, or government-compelled access. Intel SGX has had multiple serious vulnerabilities (Foreshadow, RIDL, SGAxe).

**How Krypstream differs:** FHE does not rely on hardware trust. The cryptographic guarantee holds even if every node in the network is adversarial.

---

## Positioning Summary

Krypstream occupies a unique position: the intersection of three properties that no existing product combines.

```
Non-custodial  ×  Native FHE privacy  ×  Streaming
      ↑                  ↑                   ↑
  (vs Deel)         (vs Zalary/TEE)    (vs Discrete payments alone)
```

Each axis alone has solutions. The intersection has none — until Krypstream.

---

## Talking Points for Evaluators

**Against "why not just use Sablier?"**
Sablier publishes the stream rate on-chain. For private contributor compensation, that defeats the purpose. Continuous payments encrypts the rate.

**Against "why not just use Deel?"**
Deel is custodial and centralised. A subpoena can expose your entire payroll. Krypstream has no server and no plaintext to compel.

**Against "Zalary is already building this"**
Zalary is a TEE-based app with a Django backend. Fhenix's own Privacy Stages framework rates TEE as Stage 0 — the weakest privacy model. Zalary is porting towards FHE but hasn't solved the address visibility problem they admitted in their own Wave 1 submission. We solve it architecturally from day one.

**Against "FHE is too slow / expensive"**
CoFHE offloads FHE computation to a coprocessor — gas costs are for on-chain coordination only, not FHE arithmetic. Base Sepolia gas costs are negligible. The latency is real (async coprocessor) but for payroll and streaming, seconds of latency are irrelevant.