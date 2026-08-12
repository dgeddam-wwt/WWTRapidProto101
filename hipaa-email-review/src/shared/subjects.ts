/**
 * AGENTS.md § HIPAA 1 — No Raw PHI in Subject Lines.
 *
 * Subjects are selected from a frozen allowlist of static strings. There is no
 * template interpolation anywhere in this module, so no caller can inject a
 * patient name, MRN, or diagnostic value into a subject line.
 */

import { MESSAGE_TYPE, SEVERITY_POINTS, SEVERITY, type MessageType } from './types.ts';
import { detectFindings } from './detection.ts';

/** A Quasi finding or worse is a value-level disclosure and is never allowed. */
const DISCLOSURE_POINT_FLOOR = SEVERITY_POINTS[SEVERITY.QUASI];

export const SUBJECT_ALLOWLIST: Readonly<Record<MessageType, string>> = Object.freeze({
  [MESSAGE_TYPE.SCHEDULE]: 'You have a new secure message regarding your appointment',
  [MESSAGE_TYPE.TEST_RESULT]: 'Your lab results are ready',
});

export function subjectFor(messageType: MessageType): string {
  return SUBJECT_ALLOWLIST[messageType];
}

export class SubjectComplianceError extends Error {
  override readonly name = 'SubjectComplianceError';
}

/**
 * Defence in depth: a subject may only leave this service if it is byte-identical
 * to an allowlisted string and carries no Safe Harbor identifier and no specific
 * diagnostic value. Generic care vocabulary ("lab results") is permitted, which is
 * what makes the mandated templates usable.
 */
export function assertSubjectCompliant(subject: string): void {
  const allowed = Object.values(SUBJECT_ALLOWLIST);
  if (!allowed.includes(subject)) {
    throw new SubjectComplianceError('Subject line is not on the approved generic-subject allowlist.');
  }
  for (const finding of detectFindings(subject)) {
    if (finding.points === 0) continue;
    if (finding.safeHarborNumber !== null) {
      throw new SubjectComplianceError(`Subject line contains a Safe Harbor identifier (${finding.category}).`);
    }
    if (finding.points >= DISCLOSURE_POINT_FLOOR) {
      throw new SubjectComplianceError('Subject line contains a specific diagnostic value and cannot be sent.');
    }
  }
}
