# Business Use Case: Invoice-to-PO Reconciliation Assistant

**Industry Vertical:** Financial Services / Corporate Finance (Accounts Payable)
**Demo Type:** Art of the Possible — Interactive Prototype
**Audience:** Finance leaders (CFO, Controller, AP Director), Shared Services leadership
**Intended Consumer of This Document:** AI coding assistant generating a working demo application

---

## 1. Use Case Definition

### 1.1 Problem Statement

Accounts Payable (AP) teams manually match supplier invoices against purchase orders (POs) and goods receipt notes (GRNs) — the classic **3-way match**. This process is slow, error-prone, and expensive:

- AP analysts spend 60–80% of their time on exceptions (price variances, quantity mismatches, missing POs, duplicate invoices).
- Late matching leads to missed early-payment discounts, late-payment penalties, and strained supplier relationships.
- Manual review creates audit-trail gaps and fraud exposure (duplicate or inflated invoices slipping through).

### 1.2 Proposed Solution

An **AI-powered Invoice-to-PO Reconciliation Assistant** that:

1. **Ingests** invoices (structured data for the demo; simulated OCR extraction for scanned documents).
2. **Matches** each invoice line against open PO lines and goods receipts using deterministic rules first, then AI-assisted fuzzy matching for near-misses (e.g., unit-of-measure differences, partial shipments, description variants).
3. **Classifies** each invoice into: `Auto-Match`, `Match with Tolerance`, `Exception — Needs Review`, or `Reject/Hold`.
4. **Explains** every decision in plain language (why it matched, what variance was found, what policy applies).
5. **Recommends** a next action for exceptions (e.g., "Request credit memo from supplier," "Route to buyer for PO amendment") and drafts the communication.
6. **Surfaces** a dashboard: match rate, exception aging, dollars at risk, discount capture opportunity.

### 1.3 Business Value Narrative (for the demo storyline)

| Metric | Before | Target After |
|---|---|---|
| Touchless (auto-match) rate | ~35% | 75–85% |
| Avg. exception resolution time | 5–9 days | < 2 days |
| Early-payment discount capture | ~40% of eligible | > 90% |
| Duplicate invoice leakage | 0.1–0.5% of spend | Near zero |

---

## 2. Scope

### 2.1 In Scope (build these in the demo)

- **Data model:** Suppliers, POs (header + lines), Goods Receipts, Invoices (header + lines), Match Results, Exceptions, Audit Log.
- **Synthetic dataset:** 20–30 invoices spanning all match outcomes (see Section 6 for required scenarios).
- **Matching engine:**
  - Exact match on PO number + line + quantity + unit price.
  - Tolerance-based match (configurable: e.g., ±2% price, ±5% quantity, capped at $500/line).
  - Fuzzy/AI-assisted match for missing or malformed PO references (description similarity, supplier + amount + date proximity).
  - Duplicate-invoice detection (same supplier + invoice number, or same supplier + amount + date window).
- **Exception workbench UI:** queue of exceptions with severity, aging, dollar value, AI explanation, and one-click recommended actions (simulated — no real emails sent).
- **Explainability panel:** for any invoice, show the reasoning chain (rules evaluated, tolerances applied, confidence score).
- **Dashboard:** KPIs listed in 1.3, plus exception breakdown by root cause and supplier.
- **Audit trail:** every automated decision and human override logged with timestamp and rationale.

### 2.2 Out of Scope (do NOT build)

- Real ERP integration (SAP, Oracle, NetSuite) — mock the data layer; optionally show a stubbed "connector" config screen.
- Real OCR/document AI — simulate extraction results; a sample "scanned invoice" view with pre-extracted fields is acceptable.
- Actual payment execution or bank connectivity.
- Real email/notification delivery — show drafted messages only.
- User authentication/SSO — a simple role toggle (AP Analyst vs. AP Manager) is sufficient.
- Multi-currency FX rate lookups — hardcode 2–3 currencies with fixed rates if desired, or keep single currency (USD).
- Tax engine logic (VAT/GST validation) — display tax as a passthrough field only.

---

## 3. Guardrails

These constraints are mandatory for the coding assistant and must be visibly reflected in the demo behavior:

1. **Human-in-the-loop for money movement:** The assistant never approves payment autonomously. `Auto-Match` items are marked *"Ready for payment run — pending scheduled batch approval."* Everything else requires explicit human action.
2. **No silent overrides:** Any tolerance-based match must display the variance and the policy that permitted it. AI fuzzy matches must show a confidence score and require analyst confirmation when confidence < 90%.
3. **Explainability everywhere:** Every classification must have a human-readable explanation. No "black box" outcomes.
4. **Segregation of duties:** The user who overrides an exception cannot also be shown as the final approver in the audit log (simulate with the role toggle).
5. **Data handling:** Use only synthetic data. No real company names resembling actual suppliers' legal entities; use clearly fictional names (e.g., "Meridian Industrial Supply Co.").
6. **Fraud posture:** Duplicate detection and bank-detail-change flags are advisory alerts, never auto-dismissed.
7. **Configurable tolerances:** Tolerance thresholds live in a visible settings panel — not hardcoded magic numbers — reinforcing that policy is controlled by finance, not the AI.
8. **No fabricated compliance claims:** The demo may reference SOX-style controls conceptually but must not claim certification or regulatory approval.

---

## 4. Assumptions

- The target organization uses PO-backed procurement for the majority of indirect and direct spend; non-PO invoices exist but are a minority (include 2–3 in the dataset to show the "no PO found" flow).
- Invoice data arrives already digitized (EDI, supplier portal, or OCR upstream); the demo starts from structured invoice records.
- A 3-way match (PO + Receipt + Invoice) is the standard; 2-way match (PO + Invoice, services spend) applies to service-type PO lines — support both.
- Tolerance policy defaults: **±2% or $200 on unit price** (whichever is lower per line), **±5% on quantity for partial receipts**, demo currency **USD**.
- One legal entity, one ERP instance, one AP team — no intercompany complexity.
- The demo runs standalone in a browser with in-memory or embedded data; no external services required at runtime.
- Personas: **Alex (AP Analyst)** works the exception queue; **Jordan (AP Manager)** reviews KPIs and approves overrides above $5,000.

---

## 5. Context

### 5.1 Industry Context

Finance organizations are under pressure to cut cost-to-serve in shared services while tightening controls. Invoice matching is one of the highest-volume, most rules-dense AP activities — an ideal candidate for AI augmentation because outcomes are verifiable against source documents, tolerances are policy-defined, and exceptions have recognizable patterns.

### 5.2 Process Context (where this sits)

```
Procurement → PO Created → Goods Received (GRN) → Supplier Invoice Received
     → [THIS ASSISTANT: Match / Classify / Explain / Route]
     → Payment Run → Supplier Paid → GL Posting / Accruals
```

### 5.3 Stakeholders

| Role | Interest |
|---|---|
| AP Analyst | Smaller, smarter exception queue; clear next actions |
| AP Manager / Controller | Match rate, aging, control evidence, audit readiness |
| Procurement / Buyers | Fewer "chase the buyer" escalations; PO quality feedback |
| Internal Audit | Complete decision trail; tolerance policy enforcement |
| Suppliers | Faster payment; fewer disputed invoices |

---

## 6. Required Demo Scenarios (synthetic dataset must include all)

1. **Perfect 3-way match** → Auto-Match.
2. **Price within tolerance** (e.g., unit price $10.15 vs PO $10.00) → Match with Tolerance, variance shown.
3. **Price outside tolerance** → Exception; recommendation: request credit memo, draft email shown.
4. **Quantity over-billed vs. goods received** (partial shipment) → Exception; recommendation: pay received quantity, hold remainder.
5. **Missing/invalid PO number, strong fuzzy match found** (confidence ~94%) → suggested match, analyst confirm.
6. **Missing PO, weak candidates only** (confidence < 60%) → route to buyer to create/amend PO.
7. **Duplicate invoice** (same supplier + number, resubmitted) → Reject/Hold with fraud-advisory banner.
8. **Unit-of-measure mismatch** (invoice in EA, PO in CS/case of 12) → AI normalizes and matches, explanation shows conversion.
9. **2-way match service invoice** (no GRN required) → matched against service PO line.
10. **Early-payment discount at risk** (2/10 net 30, day 8) → flagged on dashboard as discount capture opportunity.
11. **Bank details changed on supplier record within 30 days of invoice** → advisory fraud flag requiring manager acknowledgment.
12. **High-value override** (> $5,000 variance approved by analyst) → requires manager approval, both appear in audit log.

---

## 7. Success Criteria

### 7.1 Functional (the demo works if…)

- [ ] All 12 scenarios in Section 6 are present and reach their specified outcome.
- [ ] Every invoice shows a classification, confidence (where AI-assisted), and plain-language explanation.
- [ ] Tolerance settings are editable in the UI, and changing them visibly reclassifies affected invoices.
- [ ] Exception queue supports: view detail, accept AI recommendation, override with reason, escalate to manager.
- [ ] Audit log captures every automated decision and human action with timestamp, actor role, and rationale.
- [ ] Dashboard renders match-rate, exception aging, dollars at risk, and discount-capture KPIs from live demo data.
- [ ] Guardrails in Section 3 are observably enforced (e.g., no path exists to auto-approve an exception).

### 7.2 Experience (the demo lands if…)

- [ ] A finance leader can follow the story in under 10 minutes: dashboard → drill into an exception → see explanation → accept recommendation → watch KPIs update.
- [ ] The explanation language reads like a seasoned AP analyst wrote it, not a rules-engine dump.
- [ ] The "before vs. after" value narrative (Section 1.3) is inferable from the dashboard without a slide deck.

### 7.3 Technical (the build is acceptable if…)

- [ ] Runs standalone (single-page app or lightweight local server); no external API keys required for core flow.
- [ ] Synthetic data is seeded deterministically so the demo is repeatable.
- [ ] Codebase is organized into clear modules: data, matching engine, classification, UI, audit.
- [ ] Matching logic is unit-testable independent of the UI.

---

## 8. Suggested Implementation Notes (non-binding)

- **Stack suggestion:** React (or plain HTML/JS) front end; matching engine as a pure TypeScript/JavaScript module; in-memory store seeded from JSON fixtures.
- **Matching pipeline order:** duplicate check → exact match → tolerance match → UoM normalization → fuzzy match → no-match routing.
- **Confidence scoring:** simple weighted similarity (supplier match, amount proximity, date proximity, line-description similarity) is sufficient — it need only *behave* plausibly for the demo.
- **Nice-to-have (only if time permits):** natural-language query over the exception queue ("show me all price variances over $1,000 aging more than 5 days").

---

## 9. Glossary

| Term | Definition |
|---|---|
| PO | Purchase Order — buyer's commitment to purchase at agreed price/quantity |
| GRN | Goods Receipt Note — confirmation goods/services were received |
| 3-way match | Invoice validated against both PO and GRN |
| 2-way match | Invoice validated against PO only (typical for services) |
| Tolerance | Policy-defined acceptable variance between invoice and PO |
| Touchless rate | % of invoices processed with zero human intervention |
| Exception | Invoice that fails matching rules and requires human review |
| Credit memo | Supplier document reducing the amount owed |
