import { detectFindings } from './detection.ts';
import { assessRisk } from './risk.ts';
import { classifyPurpose } from './purpose.ts';
import { safeTemplateFor } from './safeTemplates.ts';
import { subjectFor } from './subjects.ts';
import { SAFE_HARBOR_CATEGORIES } from './safeHarbor.ts';
import type { CoverageItem, Finding, ReviewResult } from './types.ts';

function coverage(findings: readonly Finding[]): CoverageItem[] {
  return SAFE_HARBOR_CATEGORIES.map((category) => ({
    safeHarborNumber: category.id,
    name: category.name,
    detection: category.detection,
    findingCount: findings.filter((f) => f.safeHarborNumber === category.id).length,
  }));
}

/**
 * Full review of a staff-authored draft. Pure function: nothing is persisted and
 * the draft never reaches a log sink.
 */
export function reviewDraft(draft: string, now: Date = new Date()): ReviewResult {
  const findings = detectFindings(draft);
  const purpose = classifyPurpose(draft);
  return {
    risk: assessRisk(findings),
    findings,
    purpose,
    safeVersion: safeTemplateFor(purpose.purpose),
    proposedSubject: subjectFor(purpose.messageType),
    coverage: coverage(findings),
    reviewedAt: now.toISOString(),
  };
}
