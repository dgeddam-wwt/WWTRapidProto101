/** @synthetic-data-only — anonymized values only, per AGENTS.md § Prohibited Actions. */
import { describe, expect, it } from 'vitest';
import { SUBJECT_ALLOWLIST, assertSubjectCompliant, subjectFor, SubjectComplianceError } from '../src/shared/subjects.ts';
import { detectFindings } from '../src/shared/detection.ts';
import { MESSAGE_TYPE } from '../src/shared/types.ts';

describe('AGENTS.md HIPAA 1 — no raw PHI in subject lines', () => {
  it('uses the mandated generic subjects', () => {
    expect(subjectFor(MESSAGE_TYPE.SCHEDULE)).toBe('You have a new secure message regarding your appointment');
    expect(subjectFor(MESSAGE_TYPE.TEST_RESULT)).toBe('Your lab results are ready');
  });

  it('carries no Safe Harbor identifier and no diagnostic value in any allowlisted subject', () => {
    for (const subject of Object.values(SUBJECT_ALLOWLIST)) {
      expect(() => {
        assertSubjectCompliant(subject);
      }).not.toThrow();
      const identifiers = detectFindings(subject).filter((f) => f.points > 0 && f.safeHarborNumber !== null);
      expect(identifiers).toHaveLength(0);
    }
  });

  it('rejects a subject carrying a specific diagnostic value', () => {
    expect(() => {
      assertSubjectCompliant('Your cholesterol is elevated');
    }).toThrow(SubjectComplianceError);
  });

  it('rejects any subject that is not byte-identical to the allowlist', () => {
    expect(() => {
      assertSubjectCompliant('Lab results for Testpatient Alpha (MRN 4471902)');
    }).toThrow(SubjectComplianceError);
    expect(() => {
      assertSubjectCompliant('Your lab results are ready.');
    }).toThrow(SubjectComplianceError);
  });
});
