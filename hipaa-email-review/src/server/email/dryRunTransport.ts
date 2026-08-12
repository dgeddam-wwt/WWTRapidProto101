/**
 * Default transport. Nothing leaves the process: the composed email is accepted,
 * counted, and discarded without being retained or logged. This keeps demos and
 * tests free of live PHI-bearing traffic and of provider credentials.
 */

import { DELIVERY_STATUS } from '../../shared/types.ts';
import type { SecureEmail } from '../../shared/compose.ts';
import type { EmailTransport, TransportResult } from './transport.ts';

export class DryRunTransport implements EmailTransport {
  readonly name = 'dry-run';
  /** No data leaves the process, so no business associate is involved. */
  readonly baaCovered = true;
  readonly tlsMinVersion = 'TLSv1.3' as const;

  private dispatched = 0;

  send(_email: SecureEmail): Promise<TransportResult> {
    this.dispatched += 1;
    return Promise.resolve({ status: DELIVERY_STATUS.ACCEPTED, providerRef: `dry-run-${String(this.dispatched)}` });
  }

  get dispatchCount(): number {
    return this.dispatched;
  }
}
