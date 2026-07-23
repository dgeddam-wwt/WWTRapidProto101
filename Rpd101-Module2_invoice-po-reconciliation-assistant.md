# Use Case: Invoice-to-PO Reconciliation Assistant
**Industry Vertical:** Finance / Accounts Payable (AP)
**Document Type:** Art of the Possible — Coding Assistant Build Brief
**Status:** Draft for Prototype Scoping

---

## 1. Purpose of This Document

This document is written **for a coding assistant** (e.g., Claude, Copilot, or another LLM-based dev tool) that will generate a working prototype or proof-of-concept. It defines the use case tightly enough that the assistant can generate code, sample data, and a demo flow **without needing to guess business intent**. Every section below should be treated as binding context for code generation — not aspirational narrative.

If the coding assistant encounters ambiguity not resolved here, it should default to the **Assumptions** section (Section 6) rather than inventing new business logic.

---

## 2. Use Case Definition

**Name:** Invoice-to-PO Reconciliation Assistant

**One-line description:** An AI-assisted tool that automatically matches incoming vendor invoices against open Purchase Orders (POs) and Goods Receipt records, flags discrepancies (price, quantity, vendor, tax), and routes exceptions to the correct AP analyst with a recommended resolution.

**Business problem it solves:** AP teams manually perform "3-way match" (Invoice ↔ PO ↔ Goods Receipt) for every invoice before approving payment. This is slow, error-prone, and does not scale during month-end close. Mismatches (short shipments, price variances, duplicate invoices) cause payment delays, vendor friction, and audit risk.

**Primary users:**
- AP Analysts / AP Specialists (primary reviewers of exceptions)
- AP Manager / Controller (oversight, approval thresholds, audit trail)
- Vendor Management (secondary, for recurring discrepancy patterns)

**Trigger event:** A new invoice is received (via email, EDI, or AP portal upload) and ingested into the system.

---

## 3. Scope

### 3.1 In Scope (Prototype / PoC)
- Ingest a single invoice (structured input: JSON/CSV representing extracted invoice fields — **not raw OCR/document parsing** in this phase)
- Ingest corresponding PO and Goods Receipt records (sample/mock data)
- Perform 3-way match logic:
  - Vendor ID match
  - PO number match
  - Line-item quantity match (invoice qty ≤ received qty)
  - Line-item unit price match (within tolerance threshold)
  - Tax and total amount reconciliation (within tolerance threshold)
- Classify result: **Auto-Match (Clean)**, **Exception — Minor (auto-resolvable within tolerance)**, **Exception — Major (requires human review)**
- Generate a human-readable reconciliation summary explaining *why* an invoice matched or didn't
- Output a structured "exception record" with recommended next action (e.g., "Request revised invoice from vendor," "Escalate to Controller — over $10K variance")
- Simple front-end or CLI/notebook demo to show the flow end-to-end with mock data

### 3.2 Out of Scope (Explicitly Not Building in This Phase)
- OCR / document parsing from scanned PDFs or emailed invoice images
- Live integration with ERP systems (SAP, Oracle, NetSuite, etc.) — use mock/sample data structures that *resemble* typical ERP exports instead
- Automated payment execution or release of funds
- Vendor-facing communication automation (e.g., auto-emailing vendors)
- Multi-currency conversion logic (assume single currency, USD, for prototype)
- Historical trend analytics / vendor scorecarding (may be a Phase 2 use case)
- Any write-back to a production financial system

---

## 4. Functional Requirements (for the Coding Assistant)

The assistant should generate a prototype that includes:

1. **Data models** for:
   - `Invoice` (invoice_id, vendor_id, po_number, line_items[], subtotal, tax, total, invoice_date)
   - `PurchaseOrder` (po_number, vendor_id, line_items[], po_total, status)
   - `GoodsReceipt` (po_number, line_items[], received_qty, receipt_date)
2. **Matching engine** function(s) that compare Invoice ↔ PO ↔ Goods Receipt and return a structured match result object, not just a boolean
3. **Tolerance configuration** (see Section 6 — Assumptions) as an editable parameter, not a hardcoded magic number
4. **Exception classifier** that buckets results into Clean / Minor / Major per Section 3.1
5. **Explainability output**: a plain-English summary per invoice stating exactly which fields matched/mismatched and by how much
6. **Sample dataset generator or fixture set** with at least:
   - 3 clean-match invoices
   - 2 minor-variance invoices (within tolerance)
   - 3 major-exception invoices (price mismatch, quantity mismatch, missing PO, duplicate invoice)
7. A minimal demo interface (CLI output, Jupyter notebook, or simple web UI) that lets a reviewer see the invoice queue and drill into any single result

---

## 5. Guardrails (Hard Constraints for Code Generation)

The coding assistant **must** follow these constraints. These are not preferences — they are compliance and safety requirements for a finance-adjacent prototype.

1. **No financial transactions.** The prototype must never simulate, execute, or stub out actual payment release, fund transfer, or bank API calls. It only classifies and recommends.
2. **No real vendor, customer, or PII data.** All sample/mock data must be synthetic. Do not pull in or reference real company names, real invoice numbers, or real financial figures from any uploaded source.
3. **Human-in-the-loop by default.** Any invoice classified as "Major Exception" must be routed to a human reviewer — the system must never auto-approve a major exception, regardless of confidence score.
4. **Deterministic core logic.** The core 3-way match comparison (numbers, IDs, quantities) must be deterministic, rule-based code — not an LLM "guessing" whether numbers match. An LLM/AI component, if used, should be limited to generating the plain-English explanation and recommended next action, not the underlying match determination.
5. **Auditability.** Every match decision must produce a logged, timestamped record showing input values, tolerance thresholds applied, and the resulting classification — sufficient for an audit trail.
6. **No silent overrides.** If tolerance thresholds are edited, the system should log the change; the assistant should not allow thresholds to be modified inline without that being visible in output.
7. **Currency and rounding precision.** All monetary comparisons must use fixed-point/decimal arithmetic, not floating point, to avoid rounding-error false positives/negatives.
8. **No external network calls** in the prototype unless explicitly required and approved — this should run self-contained on sample data.

---

## 6. Assumptions (Defaults the Assistant Should Use Unless Told Otherwise)

| Area | Assumption |
|---|---|
| Currency | Single currency, USD |
| Price tolerance | ±2% or ±$25 per line item, whichever is greater, counts as "Minor" |
| Quantity tolerance | Invoice qty must be ≤ received qty; any invoice qty > received qty is a "Major" exception |
| Duplicate detection | Same vendor_id + same invoice_number + same total = duplicate → auto "Major" exception |
| Missing PO | If po_number on invoice has no matching PO record → "Major" exception, cannot auto-resolve |
| Approval threshold | Any single invoice variance over $10,000 is escalated to Controller regardless of tolerance math |
| Data format | Input data arrives as pre-structured JSON or CSV (OCR/extraction is assumed to have already happened upstream) |
| Environment | Prototype runs locally / in a notebook or lightweight app — not a production deployment |
| Users | Single-tenant demo (one company's AP team), not multi-tenant SaaS |

---

## 7. Context (Business Background)

- Finance/AP teams typically process high invoice volumes during month-end and quarter-end close, when reconciliation backlogs create the most risk (late payments, missed early-payment discounts, strained vendor relationships).
- The "3-way match" (Invoice, PO, Goods Receipt) is a standard internal control referenced in most SOX/audit frameworks for AP — any prototype touching this space should visibly respect that control rather than trying to shortcut it.
- This is an "Art of the Possible" prototype meant to demonstrate value to stakeholders (Controller, AP Manager, IT) — it is not the production system and should be clearly labeled as such in any demo output.

---

## 8. Success Criteria

The prototype will be considered successful if it can demonstrate:

1. **Accuracy:** Correctly classifies all sample invoices (clean / minor / major) according to the rules in Section 4 and thresholds in Section 6, with 100% accuracy on the provided fixture set.
2. **Explainability:** For every invoice, produces a clear, non-technical explanation a human AP analyst could read and immediately understand — no need to inspect code or raw data to understand the "why."
3. **Auditability:** Every classification decision is logged with enough detail (values compared, thresholds used, timestamp) to satisfy a hypothetical audit review.
4. **Guardrail adherence:** No payment actions are simulated; no major exception is auto-approved; no real data is used.
5. **Demo-readiness:** A non-technical stakeholder (e.g., AP Manager) can watch a walkthrough of the invoice queue and understand, without a developer narrating code, how and why each invoice was routed.
6. **Extensibility signal:** The data models and matching engine are structured cleanly enough that a future phase could plausibly plug in real ERP data or OCR output without a full rewrite.

---

## 9. Suggested Prompt for the Coding Assistant

> "Using the use case, scope, guardrails, and assumptions defined in this document, generate a working prototype of the Invoice-to-PO Reconciliation Assistant. Build the data models, the deterministic matching engine, the exception classifier, and a sample fixture dataset first. Then generate a plain-English explanation layer for each result. Do not implement any payment execution, ERP integration, or OCR parsing — treat these as explicitly out of scope. Flag any point where you have to assume something not covered in Section 6, rather than silently deciding for me."

---

*This document is a sample/template for scoping AI-assisted prototypes in the finance vertical. Replace vendor/company-specific details as needed before sharing externally.*
