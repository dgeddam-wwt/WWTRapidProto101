import type { AppConfig } from '../config.ts';
import { DryRunTransport } from './dryRunTransport.ts';
import { SendGridTransport } from './sendgridTransport.ts';
import type { EmailTransport } from './transport.ts';

/** Dry-run is the default so no configuration mistake can cause a live send. */
export function createTransport(config: AppConfig, env: Record<string, string | undefined> = process.env): EmailTransport {
  if (config.transport === 'sendgrid') {
    return new SendGridTransport({
      apiKey: config.sendgridApiKey ?? '',
      fromAddress: env['SENDGRID_FROM_ADDRESS'] ?? 'no-reply@example.invalid',
      baaConfirmed: config.sendgridBaaConfirmed,
    });
  }
  return new DryRunTransport();
}
