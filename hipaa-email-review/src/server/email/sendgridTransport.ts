/**
 * SendGrid transport over an explicitly TLS-1.2-minimum HTTPS agent.
 *
 * Implemented directly against `node:https` rather than pulling in a vendor SDK,
 * so the TLS floor and certificate validation are visible and enforced here
 * instead of being inherited from a dependency's defaults (AGENTS.md § HIPAA 3,
 * § Prohibited Actions).
 */

import { Agent, request } from 'node:https';
import type { Socket } from 'node:net';
import type { TLSSocket } from 'node:tls';
import { DELIVERY_STATUS } from '../../shared/types.ts';
import type { SecureEmail } from '../../shared/compose.ts';
import { TransportSecurityError, type EmailTransport, type TransportResult } from './transport.ts';

const API_HOST = 'api.sendgrid.com';
const API_PATH = '/v3/mail/send';
const ACCEPTED_STATUS_FLOOR = 200;
const ACCEPTED_STATUS_CEILING = 300;

export interface SendGridOptions {
  readonly apiKey: string;
  readonly fromAddress: string;
  /** Must be true: a signed BAA is a precondition for any PHI-bearing dispatch. */
  readonly baaConfirmed: boolean;
}

export class SendGridTransport implements EmailTransport {
  readonly name = 'sendgrid';
  readonly baaCovered: boolean;
  readonly tlsMinVersion = 'TLSv1.2' as const;

  private readonly apiKey: string;
  private readonly fromAddress: string;
  private readonly agent: Agent;

  constructor(options: SendGridOptions) {
    if (options.apiKey.length === 0) {
      throw new TransportSecurityError('SendGrid transport requires an API key.');
    }
    this.apiKey = options.apiKey;
    this.fromAddress = options.fromAddress;
    this.baaCovered = options.baaConfirmed;
    this.agent = new Agent({ minVersion: this.tlsMinVersion, rejectUnauthorized: true, keepAlive: true });
  }

  send(email: SecureEmail): Promise<TransportResult> {
    const body = JSON.stringify({
      personalizations: [{ to: [{ email: email.to }] }],
      from: { email: this.fromAddress },
      subject: email.subject,
      content: [{ type: 'text/plain', value: email.textBody }],
    });

    return new Promise<TransportResult>((resolve, reject) => {
      const req = request(
        {
          host: API_HOST,
          path: API_PATH,
          method: 'POST',
          agent: this.agent,
          protocol: 'https:',
          headers: {
            authorization: `Bearer ${this.apiKey}`,
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
          },
        },
        (res) => {
          // The response body may echo request content, so it is drained, never read.
          res.resume();
          const status = res.statusCode ?? 0;
          const accepted = status >= ACCEPTED_STATUS_FLOOR && status < ACCEPTED_STATUS_CEILING;
          const messageId = res.headers['x-message-id'];
          resolve({
            status: accepted ? DELIVERY_STATUS.ACCEPTED : DELIVERY_STATUS.FAILED,
            providerRef: typeof messageId === 'string' ? messageId : null,
          });
        },
      );

      // Belt and braces: verify the negotiated protocol, not just the agent floor.
      req.on('socket', (socket: Socket | TLSSocket) => {
        if (!('getProtocol' in socket)) return;
        socket.on('secureConnect', () => {
          const protocol = socket.getProtocol();
          if (protocol !== 'TLSv1.2' && protocol !== 'TLSv1.3') {
            req.destroy(new TransportSecurityError(`Refusing to send over ${protocol ?? 'an unencrypted channel'}.`));
          }
        });
      });

      req.on('error', reject);
      req.end(body);
    });
  }
}
