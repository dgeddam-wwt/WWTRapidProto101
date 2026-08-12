/**
 * AGENTS.md § Logging — pino with explicit data-masking transforms.
 *
 * Any field that could carry PHI is redacted at the serializer level, so a
 * careless `logger.info({ draft })` cannot leak a patient communication even if
 * it slips through review. Payload contents are never logged (§ HIPAA 4).
 */

import { pino, destination, type Logger, type DestinationStream } from 'pino';

/** Field names that must never reach a log sink in cleartext. */
export const REDACTED_FIELDS = [
  'draft',
  'body',
  'textBody',
  'subject',
  'payload',
  'recipientEmail',
  'to',
  'email',
  'findings',
  'safeVersion',
  'portalUrl',
  'token',
  'authorization',
  'apiKey',
] as const;

function redactPaths(): string[] {
  return REDACTED_FIELDS.flatMap((field) => [field, `*.${field}`, `req.body.${field}`]);
}

export interface LoggerOptions {
  readonly level?: string;
  readonly destination?: DestinationStream;
}

export function createLogger(options: LoggerOptions = {}): Logger {
  return pino(
    {
      level: options.level ?? process.env['LOG_LEVEL'] ?? 'info',
      base: { service: 'hipaa-email-review' },
      redact: { paths: redactPaths(), censor: '[REDACTED]', remove: false },
      formatters: {
        level: (label) => ({ level: label }),
      },
    },
    options.destination ?? destination({ dest: 1, sync: false }),
  );
}

/** Local-part masking for the rare case an address must appear in an ops log. */
export function maskEmail(address: string): string {
  const at = address.indexOf('@');
  if (at <= 0) return '[REDACTED]';
  return `***@${address.slice(at + 1)}`;
}
