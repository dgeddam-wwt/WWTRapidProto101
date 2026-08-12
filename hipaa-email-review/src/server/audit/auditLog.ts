/**
 * AGENTS.md § HIPAA 4 — Audit Logging.
 *
 * Every dispatch attempt appends exactly one entry containing `timestamp`,
 * `recipient_id_hash`, `message_type`, and `delivery_status`. Entries are frozen
 * and hash-chained (each carries the digest of its predecessor) so tampering or
 * deletion is detectable, and a key allowlist guarantees no payload content can
 * ever be attached to an entry.
 */

import { createHash, createHmac } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import type { AuditEntry, DeliveryStatus, MessageType } from '../../shared/types.ts';

const GENESIS_HASH = '0'.repeat(64);

const ALLOWED_ENTRY_KEYS: readonly string[] = [
  'timestamp',
  'recipient_id_hash',
  'message_type',
  'delivery_status',
  'seq',
  'transport',
  'prev_hash',
  'entry_hash',
];

export class AuditIntegrityError extends Error {
  override readonly name = 'AuditIntegrityError';
}

export interface AuditRecordInput {
  readonly recipientEmail: string;
  readonly messageType: MessageType;
  readonly deliveryStatus: DeliveryStatus;
  readonly transport: string;
  readonly at?: Date;
}

export interface AuditVerification {
  readonly valid: boolean;
  readonly entryCount: number;
  readonly brokenAtSeq: number | null;
  readonly headHash: string;
}

export interface AuditLogOptions {
  readonly salt: string;
  /** Optional append-only NDJSON sink. Entries are appended, never rewritten. */
  readonly filePath?: string | null;
}

function digest(entry: Omit<AuditEntry, 'entry_hash'>): string {
  const canonical = [
    entry.seq,
    entry.timestamp,
    entry.recipient_id_hash,
    entry.message_type,
    entry.delivery_status,
    entry.transport,
    entry.prev_hash,
  ].join('|');
  return createHash('sha256').update(canonical).digest('hex');
}

export class AuditLog {
  private readonly salt: string;
  private readonly filePath: string | null;
  private readonly chain: AuditEntry[] = [];

  constructor(options: AuditLogOptions) {
    if (options.salt.length === 0) throw new AuditIntegrityError('Audit log requires a recipient hash salt.');
    this.salt = options.salt;
    this.filePath = options.filePath ?? null;
  }

  /** One-way, salted recipient reference — the raw address is never stored. */
  hashRecipient(recipientEmail: string): string {
    return createHmac('sha256', this.salt).update(recipientEmail.trim().toLowerCase()).digest('hex');
  }

  record(input: AuditRecordInput): AuditEntry {
    const prev = this.chain.at(-1);
    const withoutHash: Omit<AuditEntry, 'entry_hash'> = {
      timestamp: (input.at ?? new Date()).toISOString(),
      recipient_id_hash: this.hashRecipient(input.recipientEmail),
      message_type: input.messageType,
      delivery_status: input.deliveryStatus,
      seq: (prev?.seq ?? 0) + 1,
      transport: input.transport,
      prev_hash: prev?.entry_hash ?? GENESIS_HASH,
    };

    const entry: AuditEntry = Object.freeze({ ...withoutHash, entry_hash: digest(withoutHash) });
    assertNoPayloadContent({ ...entry });
    this.chain.push(entry);
    this.persist(entry);
    return entry;
  }

  entries(): readonly AuditEntry[] {
    return Object.freeze([...this.chain]);
  }

  verify(): AuditVerification {
    let prevHash = GENESIS_HASH;
    for (const entry of this.chain) {
      const { entry_hash: entryHash, ...rest } = entry;
      if (rest.prev_hash !== prevHash || digest(rest) !== entryHash) {
        return { valid: false, entryCount: this.chain.length, brokenAtSeq: entry.seq, headHash: prevHash };
      }
      prevHash = entryHash;
    }
    return { valid: true, entryCount: this.chain.length, brokenAtSeq: null, headHash: prevHash };
  }

  private persist(entry: AuditEntry): void {
    if (this.filePath === null) return;
    appendFileSync(this.filePath, `${JSON.stringify(entry)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'a' });
  }
}

/** Guards the entry shape so message content can never be smuggled into the log. */
export function assertNoPayloadContent(entry: Readonly<Record<string, unknown>>): void {
  for (const key of Object.keys(entry)) {
    if (!ALLOWED_ENTRY_KEYS.includes(key)) {
      throw new AuditIntegrityError(`Audit entries may not contain '${key}'.`);
    }
  }
}
