# HIPAA Email Review

Patient-communication review and dispatch service for Kenstrel Health Alliance, rebuilt
against the constraints in [`../Module-4-Demonstrate/AGENTS.md`](../Module-4-Demonstrate/AGENTS.md).

Administrative staff paste a draft, see potential HIPAA Safe Harbor exposure scored by
severity, and get an identifier-free replacement draft. Dispatch is a separate,
structured path: the service composes the email itself from a generic subject and the
minimum necessary fields, sends it over a TLS-1.2-minimum transport, and appends an
immutable audit entry.

> **Prototype heuristic, not a compliance determination.** Detection is deterministic
> regex/heuristic matching — not an ML/NLP classifier and not certified HIPAA
> compliance. Every finding requires human review. Synthetic data only.

## Commands

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npm run lint` | oxlint + `tsc --noEmit` (strict) |
| `npm test` | Vitest unit + API integration suite |
| `npm run audit:phi` | Static PHI-leak audit — must report 0 errors before a PR |
| `npm run dev:server` | API on `:8787` (dry-run transport) |
| `npm run dev:web` | Vite UI on `:5173`, proxying `/api` to the server |
| `npm run build` && `npm start` | Compile server + UI, then serve both |

Copy `.env.example` to `.env` to configure. Defaults are safe: dry-run transport, no
network, ephemeral dev secrets. `NODE_ENV=production` requires real secrets.

## How the AGENTS.md constraints are enforced

| Rule | Enforcement |
|---|---|
| No raw PHI in subject lines | `src/shared/subjects.ts` — frozen allowlist of static strings, zero interpolation; `assertSubjectCompliant` re-scans before send |
| Minimum necessary | `src/shared/minimumNecessary.ts` — schedule accepts only `date`/`time`/`location`/`providerName` (per-field category allowlist); `test_result` accepts no content field at all |
| Secure portal handoff | `src/server/email/portalLink.ts` — HMAC-SHA256 tokens, 15-minute expiry, https-only, carry only a recipient hash |
| TLS 1.2+ transport | `src/server/email/transport.ts` — `assertTransportSecure` rejects sub-TLS-1.2 and non-BAA transports; SendGrid adapter pins `minVersion` and verifies the negotiated protocol. No plain-text fallback exists |
| Audit logging | `src/server/audit/auditLog.ts` — frozen, hash-chained entries with `timestamp`, `recipient_id_hash`, `message_type`, `delivery_status`; a key allowlist blocks payload content |
| Never log raw PHI | `src/server/logging/logger.ts` — pino with 14 redacted field names; `no-console` is a lint error in `src/` |
| BAA-only dependencies | Dry-run default; SendGrid refuses to start without `SENDGRID_BAA_CONFIRMED=true` |
| Strict TypeScript | `tsconfig.json` strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`; `audit:phi` fails if strictness is relaxed |
| Anonymized fixtures only | `src/shared/fixtures/syntheticDrafts.ts` (`Patient_ID_Test_00n`, `Testpatient …`, reserved 555-555-01xx numbers, `.invalid` domains); `audit:phi` enforces the conventions repo-wide |

## Risk scoring

Severity weights are summed into a score; the score maps to a tier.

| Tier | Points | Examples |
|---|---|---|
| Direct | 3 | SSN, MRN, account/beneficiary number, patient phone/fax/email |
| Quasi | 2 | Full patient name, dates, address/ZIP, device/vehicle/license ID, IP, URL, specific clinical value |
| Contextual | 1 | Provider reference, generic clinical vocabulary ("lab results", "medication list") |
| Manual Review | 1 | Phone/email whose context does not mark it as the patient's |
| Info | 0 | First name alone — surfaced, excluded from the score |

`Safe` = 0 · `Medium` = 1–5 with no Direct identifier · `High` = any Direct identifier or
score ≥ 6 · `CRITICAL LEAK` = any Direct identifier. A full name (2) plus a date (2) = 4
stays Medium by design.

## Security checklist for PRs

- [ ] `npm run lint`, `npm test`, and `npm run audit:phi` (0 errors) all pass
- [ ] No new subject-line interpolation; subjects still come from the allowlist
- [ ] No new field accepted on the dispatch path without a minimum-necessary rule
- [ ] No clinical value can reach an email body; results still hand off to the portal
- [ ] No transport added without BAA + TLS 1.2 enforcement
- [ ] No new log statement can emit a draft, subject, payload, or recipient address
- [ ] New fixtures follow the anonymization conventions
