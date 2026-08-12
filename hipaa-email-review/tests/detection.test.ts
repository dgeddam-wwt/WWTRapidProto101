/** @synthetic-data-only — anonymized values only, per AGENTS.md § Prohibited Actions. */
import { describe, expect, it } from 'vitest';
import { detectFindings } from '../src/shared/detection.ts';
import { assessRisk, HIGH_SCORE_THRESHOLD } from '../src/shared/risk.ts';
import { reviewDraft } from '../src/shared/review.ts';
import { RISK_TIER, SEVERITY } from '../src/shared/types.ts';
import { SYNTHETIC_SCENARIOS } from '../src/shared/fixtures/syntheticDrafts.ts';

function scenario(id: string): string {
  const found = SYNTHETIC_SCENARIOS.find((s) => s.id === id);
  if (found === undefined) throw new Error(`Missing synthetic scenario '${id}'.`);
  return found.draft;
}

describe('detection + scoring', () => {
  it('escalates a draft containing an MRN to a critical leak', () => {
    const result = reviewDraft(scenario('high'));
    expect(result.risk.tier).toBe(RISK_TIER.HIGH);
    expect(result.risk.hasDirectIdentifier).toBe(true);
    expect(result.risk.isCriticalLeak).toBe(true);
    expect(result.risk.badge).toBe('CRITICAL LEAK');
    expect(result.findings.some((f) => f.safeHarborNumber === 8)).toBe(true);
  });

  it('keeps a full patient name plus a date at Medium (score 4, no direct identifier)', () => {
    const result = reviewDraft(scenario('medium'));
    expect(result.risk.score).toBe(4);
    expect(result.risk.tier).toBe(RISK_TIER.MEDIUM);
    expect(result.risk.hasDirectIdentifier).toBe(false);
    expect(result.risk.isCriticalLeak).toBe(false);
  });

  it('scores a portal-handoff draft as Safe', () => {
    const result = reviewDraft(scenario('safe'));
    expect(result.risk.score).toBe(0);
    expect(result.risk.tier).toBe(RISK_TIER.SAFE);
    expect(result.findings).toHaveLength(0);
  });

  it('treats a first name alone as Info worth zero points', () => {
    const findings = detectFindings('Hi Testpatient, your visit is confirmed.');
    const nameFindings = findings.filter((f) => f.safeHarborNumber === 1);
    expect(nameFindings).toHaveLength(1);
    expect(nameFindings[0]?.severity).toBe(SEVERITY.INFO);
    expect(assessRisk(findings).tier).toBe(RISK_TIER.SAFE);
  });

  it('classifies an unattributed phone number as Manual Review, not Direct', () => {
    const findings = detectFindings('To reschedule, call us at 555-555-0111.');
    const phone = findings.find((f) => f.safeHarborNumber === 4);
    expect(phone?.severity).toBe(SEVERITY.MANUAL_REVIEW);
    expect(assessRisk(findings).isCriticalLeak).toBe(false);
  });

  it('treats a phone number attributed to the patient as a direct identifier', () => {
    const findings = detectFindings('We have your phone as 555-555-0122 on file.');
    const phone = findings.find((f) => f.safeHarborNumber === 4);
    expect(phone?.severity).toBe(SEVERITY.DIRECT);
    expect(assessRisk(findings).tier).toBe(RISK_TIER.HIGH);
  });

  it('flags an SSN pattern as a direct identifier', () => {
    const findings = detectFindings('Reference 000-00-0000 for the record.');
    expect(findings.some((f) => f.safeHarborNumber === 7 && f.severity === SEVERITY.DIRECT)).toBe(true);
  });

  it('does not double-count overlapping matches', () => {
    const findings = detectFindings('Appointment on 07/22/2026.');
    const dateFindings = findings.filter((f) => f.safeHarborNumber === 3);
    expect(dateFindings).toHaveLength(1);
  });

  it('escalates to High only once accumulated quasi identifiers reach the threshold', () => {
    const belowThreshold = assessRisk(detectFindings('Confirming for Testpatient Bravo on 10/12.'));
    expect(belowThreshold.score).toBeLessThan(HIGH_SCORE_THRESHOLD);
    expect(belowThreshold.tier).toBe(RISK_TIER.MEDIUM);

    const atThreshold = assessRisk(
      detectFindings('Confirming cardiology for Testpatient Bravo on 10/12 at 100 Main Street.'),
    );
    expect(atThreshold.score).toBeGreaterThanOrEqual(HIGH_SCORE_THRESHOLD);
    expect(atThreshold.tier).toBe(RISK_TIER.HIGH);
  });

  it('does not treat common capitalised phrases as patient names', () => {
    const findings = detectFindings('Please Log in to the Patient Portal. Thank You.');
    expect(findings.filter((f) => f.safeHarborNumber === 1)).toHaveLength(0);
  });
});
