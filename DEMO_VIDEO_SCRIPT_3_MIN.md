# 3-Minute Demo Video Script — LMA Loan Tokenization (LMA EDGE 2025)

## Goal
A crisp, judge-friendly walkthrough that explains:
- **The market problem** (loan settlement + STP + data fragmentation)
- **The solution** (AI parsing → NEL digitization → ERC-3643 token → compliant workflow → T+0 settlement)
- **Why it wins** (standards + governance + measurable impact + production path)

---

## Run-of-show (3:00)

### 0:00–0:15 — Hook (problem + stakes)
**On screen:** App landing on **Dashboard**.

**Say:**
“Today syndicated loan trades still take **27+ days** to settle, with manual confirmations and fragmented data. That ties up capital, increases counterparty risk, and blocks true straight-through processing. We built an end-to-end platform that turns a loan agreement into a **live, compliant digital asset** that settles in **seconds**.”


### 0:15–0:35 — One-sentence solution overview (simple + credible)
**On screen:** Point to the header tagline: *Digitize • Tokenize • Trade • Settle in Seconds*.

**Say:**
“Our pipeline is simple: **AI reads the document**, we standardize it into a **NEL Protocol Digital Credit Instrument**—so everyone speaks the same data language—then we mint an **ERC-3643 security token** with compliance rules built in, and we settle transfers with institutional controls.”

**Add (1 sentence, optional):**
“And the UX is intentionally ‘invisible crypto’: users sign in like Web2, while the system handles wallets and transactions under the hood.”


### 0:35–1:05 — Show the business impact on Dashboard
**On screen:** Stay on **Dashboard**. Hover/point at KPI cards and recent trades.

**Say:**
“On the Dashboard you can see the operational story: portfolio KPIs, tokenization progress, and trade history. The headline is settlement time: we move from weeks to **T+0 settlement**—in our demo, **~2.5 seconds**—a **99.7% reduction** in settlement cycle time.”

**Optional one-liner (if you need extra punch):**
“This is not just faster—it’s safer. Atomic settlement dramatically reduces failed trades and pipeline exposure.”


### 1:05–1:35 — Upload a loan and digitize it (AI → NEL)
**On screen:** Click **Upload Loan** tab. Drag-drop any PDF/Word.

**Say:**
“Now we start at the real source of truth: the legal document. I upload a loan agreement, and within seconds the system extracts key economics—facility amount, rate, maturity—plus covenants and lender positions. That becomes a standardized **NEL Protocol Digital Credit Instrument**—meaning the loan’s data is structured once, consistently, and can flow through the lifecycle without re-keying.”

**On screen:** Wait for upload/parsing success → it returns you to **Dashboard**.

**Say:**
“And you can see the new instrument appear back in the portfolio—no re-keying, no reconciliation across systems.”


### 1:35–1:55 — Tokenize (ERC-3643)
**On screen:** On the new or preloaded loan card, click **Tokenize**.

**Say:**
“Next is tokenization. With one click we mint an **ERC-3643 security token**—a standard specifically built for regulated assets. We represent the facility as **100 tradeable units**, and we keep an audit-friendly link back to the document via a cryptographic hash.”


### 1:55–2:50 — Trade workflow + compliance + T+0 settlement (the ‘wow’ moment)
**On screen:** Click **Transfer Demo** tab.

**Say:**
“This is where it becomes institutional-grade. We don’t just ‘move tokens’—we enforce the controls that loan trading actually needs.

First, you can see the **DB-backed holdings**. Then, before any transfer, we run clear eligibility checks—KYC status, accredited investor eligibility, jurisdiction rules, lockups, and balance sufficiency. If any check fails, the system blocks settlement with a human-readable reason.”

**On screen:** In the simulator, click **Validate** (optional), then **Propose**.

**Say:**
“Here I’m acting as the **Trader**. I propose a trade—for example, 10 units at a given price. This creates a workflow item, not an immediate settlement.”

**On screen:** Switch role selector to **Checker**, click **Load Inbox**, then **Approve** on the proposed trade.

**Say:**
“Now I switch to the **Checker**—segregation of duties. The checker sees the proposed trade, and the system **re-validates eligibility server-side** at approval time, so nothing slips through due to stale data.”

**On screen:** Switch role to **Agent**, click **Load Inbox**, then **Execute/Settle**.

**Say:**
“Finally the **Agent** executes settlement. Only approved, eligible trades can execute. When it passes, settlement completes in seconds and the trade is recorded—giving you speed plus an audit trail of who did what, and when.”


### 2:50–3:00 — Close with why this is the winning submission
**On screen:** Return to **Dashboard** (optional) showing updated trades.

**Say:**
“Why this matters for LMA is we’re aligning to the right industry building blocks:
**NEL Protocol** to digitize into a shared instrument model, **ERC-3643** to enforce compliant ownership transfer, and an institutional **maker-checker-agent** workflow to make STP operationally real.

This is how syndicated loans move from static PDFs to **live, compliant, instantly settleable assets**.”

---

## Recording notes (to keep it clean)
- Start already logged in so you don’t spend time on auth.
- If asked “is this real?”: “This MVP supports demo vs live execution; the workflow and controls are the same—the execution backend is configuration.”
- Keep mouse movements slow; pause 1–2 seconds on KPI cards and the workflow inbox.

---

## 20-second backup answer (if a judge interrupts)
“We reduce settlement time from 27+ days to seconds by converting loan docs into NEL-standard digital instruments, tokenizing them as ERC‑3643 compliant security tokens, and enforcing KYC/eligibility plus maker-checker-agent controls before atomic settlement.”
