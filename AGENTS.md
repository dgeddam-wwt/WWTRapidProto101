# AGENTS.md — Repository guidance

## Authoritative project guidelines

`Module-4-Demonstrate/AGENTS.md` holds the binding HIPAA, tech-stack, and validation
rules for this repository. Read it before changing anything under `hipaa-email-review/`.

Supporting context (customer scenario, concept definition, as-built prototype spec) is in
`Module-4-Demonstrate/`. Where the older `build_plan_claude_to_devin_revise.md` prototype
spec conflicts with `AGENTS.md` (it describes a 100%-client-side React app with no
backend), `AGENTS.md` wins.

## Application

`hipaa-email-review/` — TypeScript (strict) Express API + React/Vite UI. See its README
for architecture and per-rule enforcement points.

### Verification (run all three before opening a PR)

```bash
cd hipaa-email-review
npm install
npm run lint        # oxlint + tsc --noEmit
npm test            # vitest
npm run audit:phi   # must report 0 errors
```

`npm run build` compiles the server (`tsc -p tsconfig.server.json`) and the UI (Vite).
Dev: `npm run dev:server` (port 8787) plus `npm run dev:web` (port 5173, proxies `/api`).

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
