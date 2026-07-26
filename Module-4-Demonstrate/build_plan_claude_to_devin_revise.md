# Build Plan: HIPAA Shield Agent (Devin)

> This document is the as-built specification for HIPAA Shield Agent. It captures the
> customer context and product framing from the original planning discussion, plus the
> exact detection, scoring, and UI behavior implemented in the delivered prototype, so
> the app can be understood, demoed, or rebuilt from this file alone.

---

## Product Objective

Build a single-page browser prototype called **HIPAA Shield Agent**.

It lets healthcare administrative staff paste a patient communication, instantly see
potential HIPAA Safe Harbor risks scored by severity, and copy a **purpose-appropriate
safe version** for human review before sending.

This is a rapid prototype for a course and executive demonstration — not a production
compliance product. Prioritize clarity and a 30-second "aha" over technical
sophistication.

---

## Customer Context

Kenstrel Health Alliance is a regional medical group with 8 clinics sending 1,500+
patient communications per week. Administrative staff manually write appointment
confirmations, follow-ups, reminders, scheduling updates, and pre-visit instructions,
and self-audit each one for PHI before sending — creating friction. Leadership wants
to see whether a lightweight compliance-assist workflow could flag PHI risk and
suggest a safer message before sending.

---

## Business Question

Can a lightweight compliance-assist workflow reduce administrative review effort,
increase employee confidence, and lower PHI exposure risk — without a major email
platform replacement, EHR integration, or secure messaging build?

---

## Target User

Healthcare administrative staff responsible for routine patient communications:
scheduling coordinators, clinic administrators, patient support staff, back-office
teams. Non-technical. No login, no configuration.

---

## Core Workflow

```
Input Draft  →  Instant Evaluation (scored)  →  Purpose-Adaptive Safe Version  →  One-Click Copy
```

---

## Hard Constraints

- Stack: React (Vite) + Tailwind CSS (v4, via `@tailwindcss/vite`) + `lucide-react`.
- 100% client-side. No API keys, no backend, no network calls of any kind.
- All detection/scoring logic is deterministic, local JavaScript (regex/heuristics) —
  **not** a real ML/NLP/LLM classifier. Never claim actual HIPAA certification anywhere
  in the UI copy.
- Single-page app. No routing library needed.
- Light, healthcare-appropriate theme: white background, light-gray borders, rounded
  cards, clear typography. Blue/neutral for input, red/amber for risk findings and
  scoring (red = High/Critical, amber = Medium, green = Safe), green for the safe
  output panel. Avoid futuristic AI styling, dark mode, dense dashboards, jargon,
  legalistic language, or production-system claims.

---

## Screen Layout

Single-page app, three primary panels left to right, plus a header, a collapsible
identifier reference, and a footer disclaimer.

### Header
- Product name: **HIPAA Shield Agent**
- Subtitle: "Rapid prototype for reviewing patient communications before sending"
- Disclaimer chip: "Prototype only · Synthetic data · Human review required"
- "Secure Sandbox Mode (no outbound data)" indicator with a subtle pulsing green dot
  — all processing is client-side.

---

### Panel 1: Input Draft

**Purpose:** paste or write a patient communication.

**Components**
- Large text area
- Test scenario buttons: **High Risk (Full PHI)** · **Medium Risk (First Name /
  Date)** · **Safe Example**
- Button: "Clear Draft" (disabled while textarea is empty)
- Helper text: "Paste a patient communication to scan for potential identifiers."

**Behavior:** clicking a scenario button loads that message and runs the scan
automatically. Manual typing re-scans on change (debounced ~300ms). Clear Draft resets
the input, findings, coverage summary, score, and safe output back to their empty
states.

---

### Panel 2: Instant Evaluation (Detection + Scoring)

**Purpose:** show the risk tier, the score behind it, and every category scanned.

#### 2a. Risk Scoring Logic (the "number logic")

Each finding is assigned a **severity weight**, the weights are summed into a **risk
score**, and the score maps to a tier. Any single high-severity (Direct) identifier
forces the top tier regardless of score — because one exposed SSN or phone number is a
critical leak on its own.

**Severity weights**

| Tier | Categories | Points each |
|---|---|---|
| **Direct** (high severity) | Full name, SSN, MRN, account number, health plan beneficiary number, telephone, fax, email | **3** |
| **Quasi** (moderate) | Dates (except year), address/city/ZIP, license/certificate number, vehicle ID, device ID, IP address, URL, clinical/sensitive context | **2** |
| **Contextual** (low) | First-name-only, provider reference alone, general clinical terms (e.g. "medication list") without a person | **1** |

**Risk score = sum of the weights of all findings.**

**Tier mapping**

| Tier | Rule | Badge |
|---|---|---|
| **Safe** | score = 0 | Green — "Lower Risk Draft" |
| **Medium** | score 1–3 **and** no Direct identifier present | Amber — "Potential PHI Detected" |
| **High** | score ≥ 4 **or** any Direct identifier present | Red — "High Risk" |
| **Critical Leak** (sub-state of High) | any Direct identifier present | Red banner — "CRITICAL LEAK" (overrides the High badge text) |

**Worked examples (these are the three test buttons):**
- **High Risk (Full PHI):** full name (3, Direct) + clinical specialty (2, Quasi) +
  provider reference (1, Contextual) + date (2, Quasi) + "medication list" (1,
  Contextual) + phone (3, Direct) + email (3, Direct) + MRN (3, Direct) = **score 18**
  → High, and a Direct identifier is present → **CRITICAL LEAK**.
- **Medium Risk (First Name / Date):** first name (1) + date (2) = **score 3**, no
  Direct identifier → **Medium**.
- **Safe Example:** no identifiers = **score 0** → **Safe**.

Display the numeric score in the UI (e.g. "Risk score: 18 · High") so the tier is
explainable to a compliance officer, not opaque.

#### 2b. Coverage Summary (all 18 shown)

Above the findings, show a collapsible coverage header so full scanning is visible:

> **18 of 18 categories scanned · {detected} detected · {clear} clear · {manual}
> manual**

Render the full 18-category checklist with a per-category status:
- **Detected** — one or more matches
- **Clear** — scanned, nothing found
- **Manual** — not detectable from plain text (biometrics, full-face photos); shown
  for completeness and marked "manual check"

#### 2c. Finding Card Format

Each detected finding shows:
- **Detected text** (e.g. `John Smith`)
- **Category** — the Safe Harbor identifier name **and its number** (e.g.
  "Telephone numbers · Safe Harbor #4"), or, for clinical specialty/generic clinical
  terms, **"Sensitive context — not one of the 18"**
- **Why it matters** — one short sentence
- **Severity** — Direct / Quasi / Contextual and its point value

> Finding cards do not show a bracket "suggested replacement." The safe message is
> produced by regeneration in Panel 3, not by find-and-replace.

---

### Panel 3: Purpose-Adaptive Safe Version

**Purpose:** produce a clean, PHI-free message that preserves the *intent* of the
original and tells the patient what to do — adapted to the email's purpose.

#### 3a. Purpose Classification

Classify the draft into one purpose using keyword signals (deterministic, client-side,
no LLM). First match wins; fall back to General.

| Purpose | Trigger keywords (case-insensitive) |
|---|---|
| Appointment confirmation | confirm, confirming, scheduled, booked, you're all set |
| Appointment reminder | reminder, upcoming, don't forget, coming up |
| Follow-up | follow up, following up, after your visit, results, next steps |
| Reschedule / cancel | reschedule, cancel, move your appointment, change your time |
| Pre-visit instructions | bring, prepare, fasting, arrive early, paperwork, before your visit |
| Billing / statement | balance, payment, invoice, statement, amount due |
| General outreach | *(fallback — no keywords matched)* |

Show the detected purpose as a chip above the output ("Detected purpose: Appointment
confirmation") **and let the user override it via a dropdown**. This keeps human
oversight visible and demos well. Changing the dropdown re-renders the safe output
with the selected template.

#### 3b. Safe Templates (one per purpose)

```
Appointment confirmation →
Hello,
This message is to confirm your upcoming healthcare appointment.
Please log into your patient portal to review the date, time, and any preparation details.
If you need to make changes, contact our office through the portal or the number on file.

Appointment reminder →
Hello,
This is a reminder about your upcoming healthcare appointment.
Please log into your patient portal for the details and how to prepare.
Contact our office through the portal if you have any questions.

Follow-up →
Hello,
This message is regarding a follow-up related to your recent healthcare appointment.
Please log into your patient portal to view updates, results, or next steps.
Contact our office through the portal if you have any questions.

Reschedule / cancel →
Hello,
We need to update the timing of your upcoming healthcare appointment.
Please log into your patient portal to view available times and confirm a new slot.

Pre-visit instructions →
Hello,
This message contains preparation information for your upcoming appointment.
Please log into your patient portal to review what to bring and how to prepare.

Billing / statement →
Hello,
This message is regarding your account.
Please log into your patient portal to review your statement details and payment options securely.

General outreach (fallback) →
Hello,
This message is regarding your care with our office.
Please log into your patient portal for additional details.
Contact us through the portal if you have any questions.
```

#### 3c. Components & Behavior
- Read-only output text area showing the regenerated message
- Purpose chip + override dropdown
- Button: "Copy Safe Draft" → copies output, shows "Safe draft copied for review"
  confirmation for ~1.5s, then reverts
- Reminder text: "Review before use. This prototype does not guarantee compliance."

---

## Detection Rules

Deterministic, client-side pattern matching only. **No external LLM API, no network
calls.** Scan against all 18 Safe Harbor categories; be honest about which are
text-detectable.

**Tier A — regex-reliable**

| # | Category | Pattern / approach | Severity |
|---|---|---|---|
| 2 | Geographic (address/ZIP) | street: `\d{1,5}\s+\w+.*\s(Street\|St\|Ave\|Road\|Rd\|Blvd\|Lane\|Ln\|Drive\|Dr\|Way\|Ct)`; ZIP: `\b\d{5}(-\d{4})?\b` | Quasi |
| 3 | Dates (except year) | `Month DD, YYYY`, `MM/DD/YYYY`, `MM-DD-YYYY`, relative ("next Tuesday", "tomorrow") | Quasi |
| 4 | Telephone | `\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}` (excluded if immediately preceded by "fax") | Direct |
| 5 | Fax | phone pattern preceded by "fax" | Direct |
| 6 | Email | `[\w.+-]+@[\w-]+\.[\w.-]+` | Direct |
| 7 | SSN | `\b\d{3}-\d{2}-\d{4}\b` (hyphenated format only) | Direct |
| 8 | MRN | `MRN[-\s:]?\d+`, "Medical Record Number: \d+" | Direct |
| 9 | Health plan beneficiary | `HPB-\d+`, "Beneficiary ID \d+" | Direct |
| 10 | Account number | `Acct[-\s#]?\d+`, "Account #\d+" | Direct |
| 11 | License / certificate | `License #?[A-Z]{0,2}-?\d+`, `Cert-\d+` | Quasi |
| 14 | URL | `https?://\S+`, `www\.\S+` | Quasi |
| 15 | IP address | `\b(?:\d{1,3}\.){3}\d{1,3}\b` | Quasi |

**Tier B — heuristic**

| # | Category | Approach | Severity |
|---|---|---|---|
| 1 | Names | Synthetic name list (John Smith, Nina Specter, Audrey Miles, Marcus Lee); capitalized word(s) after a greeting ("Hi/Hello/Dear ___"); `Dr\.\s+[A-Z]\w+` for provider reference | Full name = Direct; first-name-only / provider reference = Contextual |
| 12 | Vehicle ID / plate | alphanumeric near "plate"/"VIN" | Quasi |
| 13 | Device ID / serial | alphanumeric near "Serial #"/"Device ID" | Quasi |
| 18 | Any other unique code | catch-all `\b[A-Z]{2,}-?\d{3,}\b` (excluding spans already matched by other categories) → "possible identifier code" (low confidence) | Quasi |

**Tier C — manual (not text-detectable, shown for completeness)**

| # | Category | UI treatment |
|---|---|---|
| 16 | Biometric identifiers | Checklist item marked "Manual check" |
| 17 | Full-face photos / comparable images | Checklist item marked "Manual check" |

**Sensitive context (NOT one of the 18)** — flag but label clearly as "Sensitive
context — not one of the 18": clinical specialties (cardiology, oncology,
dermatology, dental, psychiatry, therapy, biopsy, HIV, cancer), optionally paired with
a trailing word like "consultation"/"visit"/"appointment"; and generic terms like
"medication list," "follow-up," "pre-visit instructions." Severity: Quasi (specialty)
/ Contextual (generic term).

Overlapping matches are de-duplicated by keeping the earliest-starting, longest match
per span.

**Known gaps (call these out in any demo):**
- SSN only matches the hyphenated `XXX-XX-XXXX` format — not spaced, dotted, or
  masked/partial forms.
- MRN / health plan beneficiary / account-number detectors are tied to specific label
  formats (`MRN`, `Medical Record Number`, `HPB-`, `Beneficiary ID`, `Acct`,
  `Account #`) — a differently labeled internal ID (e.g. "Member ID", "Chart #") will
  not be caught by those detectors specifically, though it may incidentally match the
  #18 catch-all if it happens to look like letters immediately followed by 3+ digits.
- Telephone/date regexes assume common US formatting conventions.

---

## Sample Scenarios

### Scenario A — High Risk (Full PHI)

**Input**
```
Hi John Smith,
I'm reaching out to confirm your cardiology consultation with Dr. Evans on July 22, 2026.
Please remember to bring your current medication list.
If you need to reschedule, call us at 415-555-0199 or email careteam@kenstrel.example.
Your patient ID is MRN-884392.
```

**Findings & score**

| Detected | Category | Severity | Points |
|---|---|---|---|
| John Smith | Names · #1 | Direct | 3 |
| cardiology consultation | Sensitive context — not one of the 18 | Quasi | 2 |
| Dr. Evans | Provider reference (contextual) | Contextual | 1 |
| July 22, 2026 | Dates (except year) · #3 | Quasi | 2 |
| medication list | Sensitive context — not one of the 18 | Contextual | 1 |
| 415-555-0199 | Telephone numbers · #4 | Direct | 3 |
| careteam@kenstrel.example | Email addresses · #6 | Direct | 3 |
| MRN-884392 | Medical record numbers · #8 | Direct | 3 |

**Risk score = 18 → High · CRITICAL LEAK** (multiple Direct identifiers present).
**Detected purpose:** Appointment confirmation (keyword "confirm").

**Safe output**
```
Hello,
This message is to confirm your upcoming healthcare appointment.
Please log into your patient portal to review the date, time, and any preparation details.
If you need to make changes, contact our office through the portal or the number on file.
```

### Scenario B — Medium Risk (First Name / Date)

**Input**
```
Hi John, just a note about your appointment on July 22, 2026. See you then!
```
**Findings & score:** first name "John" (Contextual, 1) + date "July 22, 2026"
(Quasi, 2) = **score 3 → Medium** (no Direct identifier).
**Detected purpose:** General outreach (no strong keyword) → user can override.
**Safe output:** General outreach template (or the overridden purpose's template).

### Scenario C — Safe Example

**Input**
```
Hello, please log into your patient portal to review your upcoming appointment details.
Contact our office with any questions.
```
**Findings & score:** none → **score 0 → Safe (Lower Risk Draft)**. Output panel
echoes a safe confirmation/general template; no changes required.

---

## Interaction Behavior

- **Load scenario:** populate input → auto-scan → show coverage summary, findings,
  score/tier → classify purpose → render safe output.
- **Manual input:** re-scan on change (debounced ~300ms). Update everything.
- **Clear Draft:** clear input, findings, coverage summary, score, output; reset badge
  to neutral/empty state.
- **Copy Safe Draft:** copy output to clipboard; show "Safe draft copied for review"
  confirmation, then revert after ~1.5s.
- **Purpose override:** changing the dropdown re-renders the safe output with the
  selected template.

---

## Visual Design

Clean, healthcare-appropriate, trustworthy. White background, light-gray borders,
rounded cards, clear typography.
- Blue / neutral — input panel
- Red / amber — risk findings and scoring (red for High/Critical, amber for Medium,
  green for Safe)
- Green — safe output panel

Avoid: futuristic AI styling, dark mode, dense dashboards, jargon, legalistic
language, production-system claims.

---

## Component List

1. `Header.jsx` — product name, subtitle, sandbox pill, disclaimer chip
2. `InputPanel.jsx` — Test Scenario buttons, textarea, Clear Draft
3. `EvaluationPanel.jsx` — risk badge + numeric score, coverage summary bar, findings
   panel
4. `CoverageChecklist.jsx` — all 18 categories, Detected / Clear / Manual status
5. `FindingCard.jsx` — detected text, category/Safe Harbor #, why-it-matters note,
   severity/points
6. `SafeOutputPanel.jsx` — purpose chip + override dropdown, regenerated safe output,
   Copy button + confirmation
7. `IdentifierReference.jsx` — collapsible "18 Safe Harbor Identifier Categories"
   reference
8. `App.jsx` — header + 3-panel layout + footer, state wiring, debounced re-scan

---

## Identifier Reference Section

Collapsible section titled **"18 Safe Harbor Identifier Categories"** listing all 18
concisely, each tagged with its detection tier (regex / heuristic / manual). Includes
a one-line note: "Clinical specialty is flagged as sensitive context but is not one of
the 18 Safe Harbor identifiers."

---

## Recommended File Structure

```
src/
  App.jsx
  main.jsx
  index.css
  components/
    Header.jsx
    InputPanel.jsx
    EvaluationPanel.jsx      // coverage summary + score + findings
    CoverageChecklist.jsx    // all 18 categories
    FindingCard.jsx
    SafeOutputPanel.jsx      // purpose chip + dropdown + regenerated output
    IdentifierReference.jsx
  utils/
    detectionRules.js        // all-18 patterns + severity tiers
    riskScore.js              // weights, sum, tier mapping, critical override
    classifyPurpose.js        // keyword → purpose
    safeTemplates.js          // one template per purpose
  data/
    sampleDrafts.js           // High / Medium / Safe scenarios
```

---

## State

- `activeScenario` (index or null)
- `draftText: string` — raw textarea value
- `scannedText: string` — debounced value actually run through detection
- `purposeOverride: string | null`
- Derived (memoized): `matches`, `scored` (`{ score, tier, hasDirect, isCriticalLeak,
  badge }`), `detectedPurposeId`

---

## Acceptance Criteria

The prototype is complete when:
1. The page loads successfully, client-side only.
2. Each of the three scenario buttons loads its message and auto-scans.
3. The coverage summary shows **all 18 categories** with Detected / Clear / Manual
   status.
4. Each finding shows detected text, category (with Safe Harbor number, or "sensitive
   context — not one of the 18"), why it matters, and its severity/points.
5. The risk badge shows the correct tier **and the numeric score**, following the
   documented formula, including the CRITICAL LEAK sub-state when a Direct identifier
   is present.
6. The safe output is a **purpose-adaptive regenerated message** (not bracket
   substitution) matching the detected purpose, with a working purpose-override
   dropdown.
7. "Copy Safe Draft" copies the output and confirms.
8. The three-step workflow (Input → Instant Evaluation → One-Click Copy) is visually
   clear.
9. A visible disclaimer states it is not production-ready or compliance-approved, and
   human review is required.
10. A stakeholder can understand the workflow in under 30 seconds.

---

## Out of Scope

No login, authentication, authorization, user roles, email sending, Outlook/Gmail
integration, EHR integration, patient portal connection, database or cloud storage,
audit logs, reporting dashboards, compliance certification, real PHI, external API
calls, or LLM API calls.

---

## Guardrails & Human Review

- Synthetic data only; no real patient information; no PHI storage.
- No message sending; no autonomous send/block decisions.
- No HIPAA compliance certification claims.
- Human review always required. UI text used: "Prototype only. Not a compliance
  guarantee. Human review required — this tool highlights potential risks using a
  local, deterministic rules engine but does not guarantee HIPAA compliance."

---

## Final Direction

HIPAA Shield Agent is a single-page, client-side browser prototype that makes this
story visible in under 30 seconds:

A staff member pastes a risky patient communication → the tool scans **all 18 Safe
Harbor categories**, shows which were detected, and gives a **scored risk tier** with
a clear number behind it → the tool generates a **safe message matched to the email's
purpose** for human review. Clarity over sophistication, always with a visible
disclaimer and human review requirement.
