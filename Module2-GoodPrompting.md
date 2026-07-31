# GOOD PROMPT — Invoice-to-PO Reconciliation Assistant

*Example of a well-specified prompt to a coding assistant. Produced the "Art of the Possible — Coding Assistant Build Brief" output.*

---

## 1. Role and Task

You are acting as a solutions engineer writing a **build brief** that another coding assistant will consume to generate a working prototype. Your output is a scoping document, not code.

**Task:** Write an "Art of the Possible" build brief for an **Invoice-to-PO Reconciliation Assistant** — a tool that matches incoming vendor invoices against open Purchase Orders and Goods Receipt records (3-way match), flags discrepancies in price, quantity, vendor, and tax, and routes exceptions to the correct AP analyst with a recommended resolution.

**Audience:** Two audiences, in this order of priority:

1. A coding assistant (Claude, Copilot, or similar) that will generate the prototype from this document
2. Human stakeholders — Controller, AP Manager, IT — who will read it to approve scoping

Write so that the coding assistant does not have to guess business intent, and so a non-technical Controller can still follow it.

---

## 2. Look and Feel (Output Design Spec)

Deliver a **single Markdown file**. Structure it exactly as follows, using these numbered H2 sections:

1. Purpose of This Document
2. Use Case Definition
3. Scope — with `3.1 In Scope` and `3.2 Out of Scope` as H3 subsections
4. Functional Requirements
5. Guardrails
6. Assumptions
7. Context
8. Success Criteria
9. Suggested Prompt for the Coding Assistant

Formatting rules:

- Open with a metadata block: Industry Vertical, Document Type, Status. Separate it from the body with a horizontal rule.
- Use `**bold labels:**` followed by content for definitional fields (Name, One-line description, Business problem, Primary users, Trigger event).
- Section 6 (Assumptions) must be a **two-column table** — `Area | Assumption` — not prose and not bullets. This is the section people will scan first; make it scannable.
- Sections 5 and 8 must be **numbered** lists, so individual items can be cited by number in review ("Guardrail 4 is non-negotiable").
- Sections 3.1 and 3.2 must be **bulleted** lists, with nested bullets for match criteria.
- Section 9 must be a **blockquote** containing a copy-pasteable prompt.
- Close with an italicized footer noting this is a reusable sample/template and that vendor-specific details should be replaced before external sharing.

Tone: declarative and binding. Write "the assistant **must**," not "it would be nice if." Avoid marketing language, avoid hedging, avoid emoji. Target 1,000–1,500 words — dense enough to be unambiguous, short enough that a Controller reads the whole thing.

---

## 3. Context Management

**What to treat as authoritative:**

- Everything in this prompt is binding context for the output. Do not contradict it.
- Where this prompt does not resolve a question, resolve it in the **Assumptions** section of your output and state it explicitly. Do not invent business logic silently.
- If you make an assumption I have not sanctioned, flag it inline rather than burying it.

**Domain context you should carry in:**

- AP teams process peak invoice volume at month-end and quarter-end close; backlogs there create the most risk — late payments, missed early-payment discounts, vendor friction.
- The 3-way match is a **standard internal control** referenced in SOX and most audit frameworks. The document must visibly respect that control rather than propose shortcutting it.
- This is a demo artifact for stakeholder buy-in, not a production system. Say so in the document.

**Scope boundaries — state these as explicitly out of scope so downstream readers cannot misread ambition as commitment:**

- OCR / document parsing of scanned PDFs or emailed invoice images
- Live ERP integration (SAP, Oracle, NetSuite) — use mock data that *resembles* typical ERP exports
- Automated payment execution or release of funds
- Vendor-facing communication automation
- Multi-currency conversion (assume USD)
- Historical trend analytics and vendor scorecarding (flag as possible Phase 2)
- Any write-back to a production financial system

**Assumption defaults to encode in the Assumptions table:**

| Area | Default |
|---|---|
| Currency | Single currency, USD |
| Price tolerance | ±2% or ±$25 per line item, whichever is greater = "Minor" |
| Quantity tolerance | Invoice qty must be ≤ received qty; qty > received = "Major" |
| Duplicate detection | Same vendor_id + invoice_number + total = duplicate → "Major" |
| Missing PO | No matching PO record → "Major," not auto-resolvable |
| Approval threshold | Variance over $10,000 escalates to Controller regardless of tolerance math |
| Data format | Pre-structured JSON or CSV; extraction assumed to have happened upstream |
| Environment | Local notebook or lightweight app; not production |
| Users | Single-tenant demo, one AP team |

Do not change these numbers. If you believe one is wrong, note it after the document rather than editing it in place.

---

## 4. Constraints, Security, and Guardrails

Write these into the document as **hard constraints on code generation**, framed as compliance requirements rather than preferences. Number them.

1. **No financial transactions.** The prototype must never simulate, execute, or stub payment release, fund transfer, or bank API calls. It classifies and recommends only.
2. **No real vendor, customer, or PII data.** All fixtures synthetic. No real company names, real invoice numbers, or real financial figures pulled from any uploaded or retrieved source.
3. **Human-in-the-loop by default.** Any invoice classified "Major Exception" routes to a human reviewer. The system must never auto-approve a major exception, regardless of model confidence.
4. **Deterministic core logic.** The 3-way match comparison — IDs, quantities, amounts — must be rule-based code, not an LLM judging whether numbers match. Restrict any LLM component to generating the plain-English explanation and recommended next action. Never let it make the match determination.
5. **Auditability.** Every decision produces a logged, timestamped record with input values, tolerance thresholds applied, and resulting classification — sufficient for audit review.
6. **No silent overrides.** Threshold edits must be logged and visible in output. No inline modification without a trace.
7. **Decimal arithmetic.** All monetary comparisons use fixed-point/decimal types, never floating point, to avoid rounding-error false positives and negatives.
8. **No external network calls.** The prototype runs self-contained on sample data unless a call is explicitly required and approved.

Additionally, constrain the *content* of the document itself: no real-world data, no named real vendors, and an explicit label that this is a prototype and not the production system.

---

## 5. Functional Requirements to Specify

The document must tell the downstream assistant to build:

1. Data models for `Invoice` (invoice_id, vendor_id, po_number, line_items[], subtotal, tax, total, invoice_date), `PurchaseOrder` (po_number, vendor_id, line_items[], po_total, status), `GoodsReceipt` (po_number, line_items[], received_qty, receipt_date)
2. A matching engine returning a **structured match result object**, not a boolean
3. Tolerance thresholds as **editable configuration**, not hardcoded magic numbers
4. An exception classifier bucketing into Clean / Minor / Major
5. An explainability layer: plain-English per-invoice summary of which fields matched, which didn't, and by how much
6. A fixture set of at least 3 clean matches, 2 minor variances, 3 major exceptions (price mismatch, quantity mismatch, missing PO, duplicate invoice)
7. A minimal demo interface — CLI, notebook, or simple web UI — showing the invoice queue with drill-down into any single result

---

## 6. Definition of Done

The document is complete when it specifies success criteria the prototype can be measured against:

- **Accuracy** — 100% correct classification on the provided fixture set per the stated thresholds
- **Explainability** — an AP analyst understands the "why" without reading code or raw data
- **Auditability** — every decision logged with values compared, thresholds used, timestamp
- **Guardrail adherence** — no simulated payments, no auto-approved major exceptions, no real data
- **Demo-readiness** — an AP Manager can follow a walkthrough without a developer narrating code
- **Extensibility** — data models and matching engine structured so real ERP data or OCR output could plug in later without a rewrite

Flag any point where you had to assume something Section 3 did not cover, rather than silently deciding for me.
