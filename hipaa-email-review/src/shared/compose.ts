/**
 * Builds the outbound email from validated, minimum-necessary input.
 *
 * Bodies are static templates. Only allowlisted schedule fields and the secure
 * portal URL are interpolated, and the result is re-scanned before it can be
 * handed to a transport.
 */

import { MESSAGE_TYPE, SEVERITY, type MessageType } from './types.ts';
import type { DispatchRequest } from './minimumNecessary.ts';
import { detectFindings } from './detection.ts';
import { assertSubjectCompliant, subjectFor } from './subjects.ts';

export interface SecureEmail {
  readonly to: string;
  readonly subject: string;
  readonly textBody: string;
  readonly messageType: MessageType;
}

export class BodyComplianceError extends Error {
  override readonly name = 'BodyComplianceError';
}

/** Safe Harbor categories permitted in an outbound body, per message type. */
const BODY_ALLOWED_CATEGORIES: Readonly<Record<MessageType, readonly number[]>> = Object.freeze({
  [MESSAGE_TYPE.SCHEDULE]: [1, 2, 3],
  // Only the tokenized portal URL may appear in a results notification.
  [MESSAGE_TYPE.TEST_RESULT]: [14],
});

function scheduleBody(payload: { date: string; time: string; location: string; providerName: string }): string {
  return `Hello,

Your upcoming appointment is scheduled as follows:

Date: ${payload.date}
Time: ${payload.time}
Location: ${payload.location}
Provider: ${payload.providerName}

Sign in to your patient portal for anything else related to this visit.`;
}

function testResultBody(portalUrl: string, ttlMinutes: number): string {
  return `Hello,

A new secure message from your care team is ready for you.

Use this one-time secure link to sign in and view it:
${portalUrl}

The link expires in ${String(ttlMinutes)} minutes. Nothing about your care is included in this email.

If the link has expired, sign in to your patient portal directly and we will send a new one.`;
}

/** Rejects any body that carries a direct identifier or clinical context. */
export function assertBodyCompliant(messageType: MessageType, body: string): void {
  const allowed = BODY_ALLOWED_CATEGORIES[messageType];
  for (const finding of detectFindings(body)) {
    if (finding.points === 0) continue;
    if (finding.severity === SEVERITY.DIRECT) {
      throw new BodyComplianceError(`Outbound body contains a direct identifier (${finding.category}).`);
    }
    if (finding.safeHarborNumber === null) {
      throw new BodyComplianceError('Outbound body contains clinical or sensitive context and cannot be sent.');
    }
    if (!allowed.includes(finding.safeHarborNumber)) {
      throw new BodyComplianceError(`Outbound body contains a disallowed identifier category (${finding.category}).`);
    }
  }
}

export interface PortalHandoff {
  readonly url: string;
  readonly ttlMinutes: number;
}

export function composeEmail(request: DispatchRequest, handoff?: PortalHandoff): SecureEmail {
  const subject = subjectFor(request.messageType);
  assertSubjectCompliant(subject);

  let textBody: string;
  if (request.messageType === MESSAGE_TYPE.TEST_RESULT) {
    if (handoff === undefined) {
      throw new BodyComplianceError('Test result emails require a tokenized secure-portal handoff.');
    }
    textBody = testResultBody(handoff.url, handoff.ttlMinutes);
  } else {
    textBody = scheduleBody(request.payload);
  }

  assertBodyCompliant(request.messageType, textBody);
  return { to: request.recipientEmail, subject, textBody, messageType: request.messageType };
}
