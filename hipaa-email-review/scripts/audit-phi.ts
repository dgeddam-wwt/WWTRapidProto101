/**
 * `npm run audit:phi` — static PHI-leak audit (AGENTS.md § PR & Validation Rules).
 *
 * Fails the build when it finds:
 *  1. PHI/PII-shaped literals outside a file explicitly marked `@synthetic-data-only`
 *  2. synthetic fixtures that break the anonymization conventions
 *     (`Patient_ID_Test_00n`, `Testpatient …` / `Dr. Testprovider`, reserved
 *     555-555-01xx numbers, reserved `.invalid` / `.example` / `.test` domains)
 *  3. subject lines that are interpolated or carry a detectable identifier
 *  4. logging that could bypass the pino masking transform (`console.*`, missing
 *     redaction paths)
 *  5. audit entries that permit payload content
 *  6. relaxed TypeScript strictness
 *
 * This file audits the rest of the repository and is excluded from its own scan.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { detectFindings } from '../src/shared/detection.ts';
import { SUBJECT_ALLOWLIST, assertSubjectCompliant } from '../src/shared/subjects.ts';
import { REDACTED_FIELDS } from '../src/server/logging/logger.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['src', 'tests', 'scripts'];
const SCAN_EXTENSIONS = ['.ts', '.tsx'];
const SELF = join('scripts', 'audit-phi.ts');
const SYNTHETIC_MARKER = '@synthetic-data-only';

interface Violation {
  readonly file: string;
  readonly rule: string;
  readonly detail: string;
}

const violations: Violation[] = [];
const checks: string[] = [];

function fail(file: string, rule: string, detail: string): void {
  violations.push({ file, rule, detail });
}

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return SCAN_EXTENSIONS.some((ext) => full.endsWith(ext)) ? [full] : [];
  });
}

function sourceFiles(): string[] {
  return SCAN_DIRS.flatMap((dir) => walk(join(ROOT, dir)))
    .map((file) => relative(ROOT, file))
    .filter((file) => file !== SELF && !file.split(sep).includes('node_modules'));
}

const STRING_LITERAL = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/gs;
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;

/**
 * Block comments are stripped first: doc comments quote conventions in backticks
 * and would otherwise be read as template literals.
 */
function literals(source: string): string[] {
  return [...source.replace(BLOCK_COMMENT, '').matchAll(STRING_LITERAL)].map((m) => m[0].slice(1, -1));
}

// --- Rule 1 & 2: PHI-shaped literals and fixture conventions -----------------

const PHONE_SHAPE = /(?:\(\d{3}\)\s*|\b\d{3}[\s.-])\d{3}[\s.-]?\d{4}\b/g;
const RESERVED_PHONE = /^\(?555\)?[\s.-]?555[\s.-]?01\d{2}$/;
const EMAIL_SHAPE = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g;
const RESERVED_EMAIL_TLD = /\.(?:invalid|example|test|localhost)$/;
const SSN_SHAPE = /\b\d{3}-\d{2}-\d{4}\b/g;
const RESERVED_SSN = '000-00-0000';
const MRN_SHAPE = /\b(?:MRN|medical record (?:number|no\.?|#))\s*[:#]?\s*[A-Z]?\d{4,10}\b/gi;
const PATIENT_ID_SHAPE = /\bPatient_ID[\w]*/g;
const PATIENT_ID_CONVENTION = /^Patient_ID_Test_\d{3}$/;
const SYNTHETIC_NAME_CONVENTION = /^(?:Testpatient|Testprovider|Dr\.\s+Testprovider|Testpatient\s+\w+)$/;

function auditLiterals(file: string, source: string): void {
  const isSynthetic = source.includes(SYNTHETIC_MARKER);

  for (const literal of literals(source)) {
    for (const match of literal.match(PHONE_SHAPE) ?? []) {
      if (!RESERVED_PHONE.test(match.trim())) {
        fail(file, 'phi-literal', `Telephone-shaped literal outside the reserved 555-555-01xx range: '${match}'.`);
      } else if (!isSynthetic) {
        fail(file, 'unmarked-fixture', `Telephone fixture in a file not marked ${SYNTHETIC_MARKER}.`);
      }
    }

    for (const match of literal.match(EMAIL_SHAPE) ?? []) {
      const domain = match.slice(match.indexOf('@') + 1);
      if (!RESERVED_EMAIL_TLD.test(domain)) {
        fail(file, 'phi-literal', `Email literal using a routable domain: '${match}'.`);
      }
    }

    for (const match of literal.match(SSN_SHAPE) ?? []) {
      if (match !== RESERVED_SSN) {
        fail(file, 'phi-literal', `SSN-shaped literal that is not the all-zero placeholder: '${match}'.`);
      } else if (!isSynthetic) {
        fail(file, 'unmarked-fixture', `SSN placeholder in a file not marked ${SYNTHETIC_MARKER}.`);
      }
    }

    for (const match of literal.match(MRN_SHAPE) ?? []) {
      if (!isSynthetic) {
        fail(file, 'unmarked-fixture', `Medical record number literal ('${match}') requires a ${SYNTHETIC_MARKER} file.`);
      }
    }

    for (const match of literal.match(PATIENT_ID_SHAPE) ?? []) {
      if (!PATIENT_ID_CONVENTION.test(match)) {
        fail(file, 'fixture-convention', `Patient identifier '${match}' must use the Patient_ID_Test_00n convention.`);
      }
    }

    if (isSynthetic) {
      for (const finding of detectFindings(literal)) {
        if (finding.safeHarborNumber === 1 && !SYNTHETIC_NAME_CONVENTION.test(finding.text.trim())) {
          fail(
            file,
            'fixture-convention',
            `Person name '${finding.text}' in a fixture must use the reserved Testpatient/Testprovider form.`,
          );
        }
      }
    }
  }
}

// --- Rule 3: subject lines ---------------------------------------------------

function auditSubjects(): void {
  const subjectSource = readFileSync(join(ROOT, 'src/shared/subjects.ts'), 'utf8');
  const allowlistBlock = subjectSource.slice(
    subjectSource.indexOf('SUBJECT_ALLOWLIST'),
    subjectSource.indexOf('export function subjectFor'),
  );
  if (allowlistBlock.includes('${')) {
    fail('src/shared/subjects.ts', 'subject-interpolation', 'Subject allowlist must contain static strings only.');
  }
  for (const subject of Object.values(SUBJECT_ALLOWLIST)) {
    try {
      assertSubjectCompliant(subject);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'unknown';
      fail('src/shared/subjects.ts', 'subject-phi', `Allowlisted subject rejected by the subject guard: ${reason}`);
    }
    if (detectFindings(subject).some((f) => f.points > 0 && f.safeHarborNumber !== null)) {
      fail('src/shared/subjects.ts', 'subject-phi', `Allowlisted subject carries a Safe Harbor identifier: '${subject}'.`);
    }
  }
  checks.push(`${String(Object.keys(SUBJECT_ALLOWLIST).length)} allowlisted subjects are static and identifier-free`);
}

// --- Rule 4: logging --------------------------------------------------------

function auditLogging(file: string, source: string): void {
  if (file.startsWith('src') && /\bconsole\.(?:log|info|warn|error|debug)\s*\(/.test(source)) {
    fail(file, 'unmasked-logging', 'Use the pino logger (with masking) instead of console.*.');
  }
}

function auditRedaction(): void {
  const required = ['draft', 'body', 'textBody', 'subject', 'payload', 'recipientEmail', 'token'];
  const missing = required.filter((field) => !(REDACTED_FIELDS as readonly string[]).includes(field));
  if (missing.length > 0) {
    fail('src/server/logging/logger.ts', 'missing-redaction', `Redaction list is missing: ${missing.join(', ')}.`);
  }
  checks.push(`${String(REDACTED_FIELDS.length)} field names are redacted by the logger transform`);
}

// --- Rule 5: audit entries --------------------------------------------------

function auditAuditLog(): void {
  const source = readFileSync(join(ROOT, 'src/server/audit/auditLog.ts'), 'utf8');
  const block = source.slice(source.indexOf('ALLOWED_ENTRY_KEYS'), source.indexOf('export class AuditIntegrityError'));
  for (const forbidden of ['payload', 'body', 'subject', 'draft', 'recipientEmail']) {
    if (block.includes(`'${forbidden}'`)) {
      fail('src/server/audit/auditLog.ts', 'audit-payload', `Audit entries must not permit '${forbidden}'.`);
    }
  }
  for (const requiredField of ['timestamp', 'recipient_id_hash', 'message_type', 'delivery_status']) {
    if (!block.includes(`'${requiredField}'`)) {
      fail('src/server/audit/auditLog.ts', 'audit-required-field', `Audit entries must include '${requiredField}'.`);
    }
  }
  checks.push('audit entries are limited to metadata and include all four required fields');
}

// --- Rule 6: TypeScript strictness -----------------------------------------

function auditStrictness(): void {
  const config = JSON.parse(readFileSync(join(ROOT, 'tsconfig.json'), 'utf8')) as {
    compilerOptions?: Record<string, unknown>;
  };
  const options = config.compilerOptions ?? {};
  if (options['strict'] !== true) {
    fail('tsconfig.json', 'strictness', 'TypeScript strict mode must stay enabled.');
  }
  for (const flag of ['strictNullChecks', 'noImplicitAny']) {
    if (options[flag] === false) {
      fail('tsconfig.json', 'strictness', `${flag} must not be disabled.`);
    }
  }
  checks.push('TypeScript strict mode and null checks are enabled');
}

// --- Runner -----------------------------------------------------------------

function main(): void {
  const files = sourceFiles();
  for (const file of files) {
    const source = readFileSync(join(ROOT, file), 'utf8');
    auditLiterals(file, source);
    auditLogging(file, source);
  }
  checks.push(`${String(files.length)} source files scanned for PHI-shaped literals`);

  auditSubjects();
  auditRedaction();
  auditAuditLog();
  auditStrictness();

  console.log('PHI leak audit');
  for (const check of checks) console.log(`  ok  ${check}`);

  if (violations.length === 0) {
    console.log('\n0 errors. No raw PHI exposure paths detected.');
    return;
  }

  console.error(`\n${String(violations.length)} error(s):`);
  for (const violation of violations) {
    console.error(`  [${violation.rule}] ${violation.file}: ${violation.detail}`);
  }
  process.exitCode = 1;
}

main();
