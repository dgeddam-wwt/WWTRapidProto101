# AGENTS.md — Devin Project Guidelines
## Project Overview
Healthcare patient communication service handling automated and manual email notifications for appointment schedules and lab/test results. Must strictly comply with HIPAA Security and Privacy Rules (45 CFR § 164.530).
## Build & Test Commands
- Install dependencies: `npm install`
- Run lint checks: `npm run lint`
- Run unit/integration tests: `npm test`
- Run security/PHI leak audits: `npm run audit:phi`
## Code Style & Tech Stack
- **Language:** TypeScript (Strict Mode enabled)
- **Backend:** Node.js, Express, SendGrid/Paubox HIPAA-compliant transport SDKs
- **Logging:** Use `pino` with explicit data-masking transforms (never log raw PHI).
## HIPAA & Security Constraints (CRITICAL)
1. **No Raw PHI in Subject Lines:** Email subjects for test results or schedules must *never* contain patient names, medical record numbers (MRNs), or specific diagnostic values. Use generic templates: *"You have a new secure message regarding your appointment"* or *"Your lab results are ready"*.
2. **Minimum Necessary Rule:** Schedule emails should only contain date, time, location, and provider name. Test result emails must *never* include clinical values in the email body; they must use secure portal-link handoffs with tokenized, expiring authentication links.
3. **Transport Security:** Enforce TLS 1.2+ for outbound SMTP/API transport. Reject fallback to unencrypted plain-text channels.
4. **Audit Logging:** Every email dispatch event must trigger an immutable audit log entry containing: `timestamp`, `recipient_id_hash`, `message_type` (schedule vs test_result), and `delivery_status`. Do not log payload contents.
## Prohibited Actions for Devin
- Do not add dependencies that lack an active Business Associate Agreement (BAA) capability or explicit TLS enforcement.
- Do not disable strict null checks or TypeScript strict constraints.
- Do not write mock tests that hardcode realistic or production Patient Health Information (PHI) / Personally Identifiable Information (PII). Use anonymized test fixtures only (`Patient_ID_Test_001`).
## PR & Validation Rules
- Before opening a PR, ensure all tests pass and `npm run audit:phi` returns zero errors.
- Include a security checklist confirmation in the PR description verifying no raw PHI exposure paths were introduced.

---

## Implementation Notes (added during the rebuild)

These rules govern the `hipaa-email-review/` app in this directory. Run every check from
here:

```bash
npm install
npm run lint        # oxlint + tsc --noEmit
npm test            # vitest
npm run audit:phi   # must report 0 errors
```

`npm run build` compiles the server (`tsc -p tsconfig.server.json`) and the UI (Vite).
Dev: `npm run dev:server` (port 8787) plus `npm run dev:web` (port 5173, proxies `/api`).

### Precedence

Where `../Module-4-Demonstrate/build_plan_claude_to_devin_revise.md` conflicts with this
file — it specifies a 100%-client-side React app with no backend, no network calls, and no
dispatch path — **this file wins**. Supporting context (customer scenario, concept
definition, as-built prototype spec) remains in `../Module-4-Demonstrate/`.

### Conventions worth preserving

- Imports use explicit `.ts`/`.tsx` extensions (`allowImportingTsExtensions` +
  `rewriteRelativeImportExtensions`), so one import style works for Vite, tsx, and tsc.
- Any file containing PHI-shaped literals must be marked `@synthetic-data-only` and follow
  the fixture conventions (`Patient_ID_Test_00n`, `Testpatient …` / `Dr. Testprovider`,
  reserved `555-555-01xx` numbers, reserved `.invalid` domains). `npm run audit:phi`
  enforces this repo-wide.
- `console.*` is a lint error in `src/` — log through the pino logger, which masks PHI.
- Email subjects come from the frozen allowlist in `src/shared/subjects.ts`. Never
  interpolate a subject.
- See `README.md` for the per-rule enforcement map and the PR security checklist.
