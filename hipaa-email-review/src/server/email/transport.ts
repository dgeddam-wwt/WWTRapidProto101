/**
 * AGENTS.md § HIPAA 3 — Transport Security.
 *
 * A transport may only be used if it is covered by a Business Associate
 * Agreement and negotiates TLS 1.2 or better. There is deliberately no
 * plain-text/STARTTLS-optional fallback: a transport that cannot prove TLS is
 * refused rather than downgraded.
 */

import type { DeliveryStatus } from '../../shared/types.ts';
import type { SecureEmail } from '../../shared/compose.ts';

export type TlsVersion = 'TLSv1.2' | 'TLSv1.3';

const TLS_RANK: Readonly<Record<string, number>> = Object.freeze({ 'TLSv1.2': 2, 'TLSv1.3': 3 });
const MIN_ACCEPTABLE_TLS_RANK = 2;

export interface TransportResult {
  readonly status: DeliveryStatus;
  /** Opaque provider reference. Never contains message content. */
  readonly providerRef: string | null;
}

export interface EmailTransport {
  readonly name: string;
  /** Whether a signed BAA covers this transport. */
  readonly baaCovered: boolean;
  readonly tlsMinVersion: TlsVersion;
  send(email: SecureEmail): Promise<TransportResult>;
}

export class TransportSecurityError extends Error {
  override readonly name = 'TransportSecurityError';
}

export function assertTransportSecure(transport: EmailTransport): void {
  if (!transport.baaCovered) {
    throw new TransportSecurityError(`Transport '${transport.name}' is not covered by a Business Associate Agreement.`);
  }
  const rank = TLS_RANK[transport.tlsMinVersion];
  if (rank === undefined || rank < MIN_ACCEPTABLE_TLS_RANK) {
    throw new TransportSecurityError(`Transport '${transport.name}' does not enforce TLS 1.2 or higher.`);
  }
}
