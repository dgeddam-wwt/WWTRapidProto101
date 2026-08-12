/**
 * Dispatch orchestration: validate → enforce transport security → compose from
 * static templates → send → audit. Every path (including rejections and
 * failures) produces exactly one audit entry.
 */

import type { Logger } from 'pino';
import { DELIVERY_STATUS, MESSAGE_TYPE, type DeliveryStatus, type DispatchResponse } from '../shared/types.ts';
import { validateDispatchRequest, MinimumNecessaryError } from '../shared/minimumNecessary.ts';
import { composeEmail, type PortalHandoff } from '../shared/compose.ts';
import type { AppConfig } from './config.ts';
import type { AuditLog } from './audit/auditLog.ts';
import { assertTransportSecure, type EmailTransport } from './email/transport.ts';
import { createPortalHandoff } from './email/portalLink.ts';

export interface DispatchDeps {
  readonly config: AppConfig;
  readonly transport: EmailTransport;
  readonly auditLog: AuditLog;
  readonly logger: Logger;
}

function recipientForAudit(input: unknown): string | null {
  if (typeof input !== 'object' || input === null) return null;
  const value = (input as Record<string, unknown>)['recipientEmail'];
  return typeof value === 'string' && value.includes('@') ? value : null;
}

export async function dispatchEmail(input: unknown, deps: DispatchDeps): Promise<DispatchResponse> {
  const { config, transport, auditLog, logger } = deps;

  let request;
  try {
    request = validateDispatchRequest(input);
  } catch (error: unknown) {
    const recipient = recipientForAudit(input);
    if (recipient !== null) {
      auditLog.record({
        recipientEmail: recipient,
        messageType: MESSAGE_TYPE.SCHEDULE,
        deliveryStatus: DELIVERY_STATUS.REJECTED,
        transport: transport.name,
      });
    }
    throw error;
  }

  assertTransportSecure(transport);

  let handoff: PortalHandoff | undefined;
  let portalExpiresAt: Date | undefined;
  if (request.messageType === MESSAGE_TYPE.TEST_RESULT) {
    const link = createPortalHandoff(auditLog.hashRecipient(request.recipientEmail), {
      secret: config.portalTokenSecret,
      baseUrl: config.portalBaseUrl,
      ttlSeconds: config.portalTokenTtlSeconds,
    });
    handoff = { url: link.url, ttlMinutes: link.ttlMinutes };
    portalExpiresAt = link.expiresAt;
  }

  const email = handoff === undefined ? composeEmail(request) : composeEmail(request, handoff);

  let status: DeliveryStatus = DELIVERY_STATUS.FAILED;
  try {
    const result = await transport.send(email);
    status = result.status;
  } catch (error: unknown) {
    // Transport failures are audited, then surfaced. The message is never retried
    // over a downgraded channel.
    const entry = auditLog.record({
      recipientEmail: request.recipientEmail,
      messageType: request.messageType,
      deliveryStatus: DELIVERY_STATUS.FAILED,
      transport: transport.name,
    });
    logger.error({ auditRef: entry.entry_hash, messageType: request.messageType }, 'email dispatch failed');
    throw error;
  }

  const entry = auditLog.record({
    recipientEmail: request.recipientEmail,
    messageType: request.messageType,
    deliveryStatus: status,
    transport: transport.name,
  });

  // Metadata only: no subject, body, payload, or recipient address.
  logger.info(
    {
      auditRef: entry.entry_hash,
      messageType: entry.message_type,
      deliveryStatus: entry.delivery_status,
      transport: entry.transport,
      tlsMinVersion: transport.tlsMinVersion,
    },
    'email dispatched',
  );

  return {
    auditRef: entry.entry_hash,
    subject: email.subject,
    messageType: request.messageType,
    deliveryStatus: status,
    transport: transport.name,
    tlsMinVersion: transport.tlsMinVersion,
    ...(portalExpiresAt === undefined ? {} : { portalLinkExpiresAt: portalExpiresAt.toISOString() }),
  };
}

export { MinimumNecessaryError };
