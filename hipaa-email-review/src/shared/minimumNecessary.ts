/**
 * AGENTS.md § HIPAA 2 — Minimum Necessary Rule.
 *
 * Schedule emails may carry only date, time, location, and provider name.
 * Test result emails may carry no clinical content at all; they are limited to a
 * tokenized, expiring secure-portal handoff. Anything else is rejected at the
 * boundary rather than sanitised silently.
 */

import { MESSAGE_TYPE, SCHEDULE_PAYLOAD_FIELDS, type MessageType, type SchedulePayload } from './types.ts';
import { detectFindings } from './detection.ts';
import { SEVERITY } from './types.ts';

export class MinimumNecessaryError extends Error {
  override readonly name = 'MinimumNecessaryError';
  readonly field: string;

  constructor(message: string, field: string) {
    super(message);
    this.field = field;
  }
}

export interface ScheduleDispatchRequest {
  readonly messageType: typeof MESSAGE_TYPE.SCHEDULE;
  readonly recipientEmail: string;
  readonly payload: SchedulePayload;
}

export interface TestResultDispatchRequest {
  readonly messageType: typeof MESSAGE_TYPE.TEST_RESULT;
  readonly recipientEmail: string;
}

export type DispatchRequest = ScheduleDispatchRequest | TestResultDispatchRequest;

const MAX_FIELD_LENGTH = 120;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/**
 * Safe Harbor categories tolerated per schedule field. Everything else — and any
 * Direct identifier or clinical context in any field — is rejected.
 */
const ALLOWED_CATEGORIES: Readonly<Record<keyof SchedulePayload, readonly number[]>> = Object.freeze({
  date: [3],
  time: [3],
  // A clinic address is the location; a patient name in it is not.
  location: [2, 3],
  // The provider's own name is expected here.
  providerName: [1],
});

function asRecord(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new MinimumNecessaryError(`${field} must be an object.`, field);
  }
  return value as Record<string, unknown>;
}

function assertRecipient(value: unknown): string {
  if (typeof value !== 'string' || !EMAIL_SHAPE.test(value)) {
    throw new MinimumNecessaryError('recipientEmail must be a single valid address.', 'recipientEmail');
  }
  return value;
}

function assertFieldContent(field: keyof SchedulePayload, value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new MinimumNecessaryError(`payload.${field} is required.`, `payload.${field}`);
  }
  if (value.length > MAX_FIELD_LENGTH) {
    throw new MinimumNecessaryError(`payload.${field} exceeds ${MAX_FIELD_LENGTH} characters.`, `payload.${field}`);
  }

  const allowed = ALLOWED_CATEGORIES[field];
  for (const finding of detectFindings(value)) {
    if (finding.points === 0) continue;
    const isDirect = finding.severity === SEVERITY.DIRECT;
    const isAllowedCategory = finding.safeHarborNumber !== null && allowed.includes(finding.safeHarborNumber);
    if (isDirect || !isAllowedCategory) {
      throw new MinimumNecessaryError(
        `payload.${field} contains content outside the minimum necessary set (${finding.category}).`,
        `payload.${field}`,
      );
    }
  }
  return value;
}

/** Validates and narrows an untrusted dispatch request. Throws on any violation. */
export function validateDispatchRequest(input: unknown): DispatchRequest {
  const body = asRecord(input, 'request');
  const recipientEmail = assertRecipient(body['recipientEmail']);
  const messageType = body['messageType'];

  if (messageType === MESSAGE_TYPE.TEST_RESULT) {
    for (const key of Object.keys(body)) {
      if (key !== 'messageType' && key !== 'recipientEmail') {
        throw new MinimumNecessaryError(
          `Test result emails may not carry '${key}'. Clinical values must stay behind the secure portal link.`,
          key,
        );
      }
    }
    return { messageType: MESSAGE_TYPE.TEST_RESULT, recipientEmail };
  }

  if (messageType !== MESSAGE_TYPE.SCHEDULE) {
    throw new MinimumNecessaryError("messageType must be 'schedule' or 'test_result'.", 'messageType');
  }

  for (const key of Object.keys(body)) {
    if (key !== 'messageType' && key !== 'recipientEmail' && key !== 'payload') {
      throw new MinimumNecessaryError(`Unexpected top-level field '${key}'.`, key);
    }
  }

  const payload = asRecord(body['payload'], 'payload');
  for (const key of Object.keys(payload)) {
    if (!(SCHEDULE_PAYLOAD_FIELDS as readonly string[]).includes(key)) {
      throw new MinimumNecessaryError(
        `Schedule emails may only contain ${SCHEDULE_PAYLOAD_FIELDS.join(', ')} — '${key}' is not permitted.`,
        `payload.${key}`,
      );
    }
  }

  return {
    messageType: MESSAGE_TYPE.SCHEDULE,
    recipientEmail,
    payload: {
      date: assertFieldContent('date', payload['date']),
      time: assertFieldContent('time', payload['time']),
      location: assertFieldContent('location', payload['location']),
      providerName: assertFieldContent('providerName', payload['providerName']),
    },
  };
}

export function messageTypeOf(request: DispatchRequest): MessageType {
  return request.messageType;
}
