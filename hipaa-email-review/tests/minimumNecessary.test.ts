/** @synthetic-data-only — anonymized values only, per AGENTS.md § Prohibited Actions. */
import { describe, expect, it } from 'vitest';
import { MinimumNecessaryError, validateDispatchRequest } from '../src/shared/minimumNecessary.ts';
import { assertBodyCompliant, composeEmail, BodyComplianceError } from '../src/shared/compose.ts';
import { MESSAGE_TYPE } from '../src/shared/types.ts';
import { SYNTHETIC_DISPATCHES } from '../src/shared/fixtures/syntheticDrafts.ts';

const validSchedule = SYNTHETIC_DISPATCHES.schedule;

describe('AGENTS.md HIPAA 2 — minimum necessary', () => {
  it('accepts a schedule request limited to date, time, location, and provider', () => {
    const request = validateDispatchRequest(validSchedule);
    expect(request.messageType).toBe(MESSAGE_TYPE.SCHEDULE);
  });

  it('rejects any extra schedule field', () => {
    expect(() =>
      validateDispatchRequest({
        ...validSchedule,
        payload: { ...validSchedule.payload, reasonForVisit: 'cardiology follow-up' },
      }),
    ).toThrow(MinimumNecessaryError);
  });

  it('rejects a patient name smuggled into an allowlisted schedule field', () => {
    expect(() =>
      validateDispatchRequest({
        ...validSchedule,
        payload: { ...validSchedule.payload, location: 'Kenstrel Clinic — Testpatient Alpha' },
      }),
    ).toThrow(MinimumNecessaryError);
  });

  it('rejects clinical context in an allowlisted schedule field', () => {
    expect(() =>
      validateDispatchRequest({
        ...validSchedule,
        payload: { ...validSchedule.payload, time: '10:30 AM cardiology' },
      }),
    ).toThrow(MinimumNecessaryError);
  });

  it('rejects any content field on a test result request', () => {
    expect(() =>
      validateDispatchRequest({
        messageType: MESSAGE_TYPE.TEST_RESULT,
        recipientEmail: 'patient-id-test-003@example.invalid',
        payload: { a1c: '7.4' },
      }),
    ).toThrow(MinimumNecessaryError);

    expect(() =>
      validateDispatchRequest({
        messageType: MESSAGE_TYPE.TEST_RESULT,
        recipientEmail: 'patient-id-test-003@example.invalid',
        body: 'Your cholesterol is elevated.',
      }),
    ).toThrow(MinimumNecessaryError);
  });

  it('rejects an unknown message type and a malformed recipient', () => {
    expect(() => validateDispatchRequest({ messageType: 'marketing', recipientEmail: 'a@b.invalid' })).toThrow(
      MinimumNecessaryError,
    );
    expect(() => validateDispatchRequest({ messageType: MESSAGE_TYPE.TEST_RESULT, recipientEmail: 'not-an-address' })).toThrow(
      MinimumNecessaryError,
    );
  });

  it('composes a schedule body holding only the four permitted fields', () => {
    const email = composeEmail(validateDispatchRequest(validSchedule));
    expect(email.subject).toBe('You have a new secure message regarding your appointment');
    expect(email.textBody).toContain(validSchedule.payload?.['location']);
    expect(email.textBody.toLowerCase()).not.toContain('cardiology');
  });

  it('requires a portal handoff for results notifications and keeps clinical values out of the body', () => {
    const request = validateDispatchRequest(SYNTHETIC_DISPATCHES.testResult);
    expect(() => composeEmail(request)).toThrow(BodyComplianceError);

    const email = composeEmail(request, { url: 'https://portal.example.invalid/secure-message?t=token', ttlMinutes: 15 });
    expect(email.subject).toBe('Your lab results are ready');
    expect(email.textBody).toContain('https://portal.example.invalid');
    expect(email.textBody).not.toMatch(/cholesterol|a1c|diagnos/i);
  });

  it('refuses to send a body carrying a direct identifier', () => {
    expect(() => {
      assertBodyCompliant(MESSAGE_TYPE.SCHEDULE, 'Your record MRN: 4471902 is attached.');
    }).toThrow(BodyComplianceError);
  });
});
