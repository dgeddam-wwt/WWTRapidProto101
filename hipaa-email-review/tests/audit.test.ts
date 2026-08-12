import { describe, expect, it } from 'vitest';
import { AuditLog, AuditIntegrityError, assertNoPayloadContent } from '../src/server/audit/auditLog.ts';
import { MESSAGE_TYPE, DELIVERY_STATUS } from '../src/shared/types.ts';

const SALT = 'test-salt-not-a-secret';
const RECIPIENT = 'patient-id-test-001@example.invalid';

function log(): AuditLog {
  return new AuditLog({ salt: SALT });
}

describe('AGENTS.md HIPAA 4 — audit logging', () => {
  it('records the four required fields for every dispatch', () => {
    const entry = log().record({
      recipientEmail: RECIPIENT,
      messageType: MESSAGE_TYPE.TEST_RESULT,
      deliveryStatus: DELIVERY_STATUS.ACCEPTED,
      transport: 'dry-run',
    });

    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(entry.recipient_id_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(entry.message_type).toBe(MESSAGE_TYPE.TEST_RESULT);
    expect(entry.delivery_status).toBe(DELIVERY_STATUS.ACCEPTED);
  });

  it('never stores the raw recipient address, and hashes are stable and salted', () => {
    const auditLog = log();
    const entry = auditLog.record({
      recipientEmail: RECIPIENT,
      messageType: MESSAGE_TYPE.SCHEDULE,
      deliveryStatus: DELIVERY_STATUS.ACCEPTED,
      transport: 'dry-run',
    });

    expect(JSON.stringify(entry)).not.toContain(RECIPIENT);
    expect(entry.recipient_id_hash).toBe(auditLog.hashRecipient(RECIPIENT.toUpperCase()));
    expect(new AuditLog({ salt: 'other-salt' }).hashRecipient(RECIPIENT)).not.toBe(entry.recipient_id_hash);
  });

  it('rejects any attempt to attach payload content to an entry', () => {
    expect(() => {
      assertNoPayloadContent({ timestamp: 'x', body: 'Your results are ready.' });
    }).toThrow(AuditIntegrityError);
  });

  it('freezes entries so they cannot be mutated in place', () => {
    const auditLog = log();
    const entry = auditLog.record({
      recipientEmail: RECIPIENT,
      messageType: MESSAGE_TYPE.SCHEDULE,
      deliveryStatus: DELIVERY_STATUS.ACCEPTED,
      transport: 'dry-run',
    });
    expect(Object.isFrozen(entry)).toBe(true);
    expect(() => {
      (entry as unknown as Record<string, unknown>)['delivery_status'] = DELIVERY_STATUS.REJECTED;
    }).toThrow(TypeError);
  });

  it('hash-chains entries so tampering or deletion is detectable', () => {
    const auditLog = log();
    for (const status of [DELIVERY_STATUS.ACCEPTED, DELIVERY_STATUS.REJECTED, DELIVERY_STATUS.ACCEPTED]) {
      auditLog.record({ recipientEmail: RECIPIENT, messageType: MESSAGE_TYPE.SCHEDULE, deliveryStatus: status, transport: 'dry-run' });
    }

    const verification = auditLog.verify();
    expect(verification.valid).toBe(true);
    expect(verification.entryCount).toBe(3);

    const entries = auditLog.entries();
    expect(entries[0]?.prev_hash).toBe('0'.repeat(64));
    expect(entries[1]?.prev_hash).toBe(entries[0]?.entry_hash);
    expect(entries[2]?.prev_hash).toBe(entries[1]?.entry_hash);
    expect(Object.isFrozen(entries)).toBe(true);
  });

  it('requires a salt', () => {
    expect(() => new AuditLog({ salt: '' })).toThrow(AuditIntegrityError);
  });
});
