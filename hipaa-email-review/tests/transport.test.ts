import { describe, expect, it } from 'vitest';
import { assertTransportSecure, TransportSecurityError, type EmailTransport } from '../src/server/email/transport.ts';
import { DryRunTransport } from '../src/server/email/dryRunTransport.ts';
import { DELIVERY_STATUS } from '../src/shared/types.ts';
import { loadConfig, ConfigError } from '../src/server/config.ts';

function fakeTransport(overrides: Partial<EmailTransport>): EmailTransport {
  return {
    name: 'fake',
    baaCovered: true,
    tlsMinVersion: 'TLSv1.2',
    send: () => Promise.resolve({ status: DELIVERY_STATUS.ACCEPTED, providerRef: null }),
    ...overrides,
  } as EmailTransport;
}

describe('AGENTS.md HIPAA 3 — transport security', () => {
  it('accepts the default dry-run transport', () => {
    const transport = new DryRunTransport();
    expect(() => {
      assertTransportSecure(transport);
    }).not.toThrow();
    expect(transport.tlsMinVersion).toBe('TLSv1.3');
  });

  it('refuses a transport below TLS 1.2', () => {
    expect(() => {
      assertTransportSecure(fakeTransport({ tlsMinVersion: 'TLSv1.1' as 'TLSv1.2' }));
    }).toThrow(TransportSecurityError);
  });

  it('refuses a transport without a BAA', () => {
    expect(() => {
      assertTransportSecure(fakeTransport({ baaCovered: false }));
    }).toThrow(TransportSecurityError);
  });

  it('refuses a plain-text portal base URL', () => {
    expect(() => loadConfig({ PORTAL_BASE_URL: 'http://portal.example.invalid' })).toThrow(ConfigError);
  });

  it('refuses the SendGrid transport unless a BAA is confirmed', () => {
    expect(() => loadConfig({ EMAIL_TRANSPORT: 'sendgrid', SENDGRID_API_KEY: 'test-key' })).toThrow(ConfigError);
    expect(() =>
      loadConfig({ EMAIL_TRANSPORT: 'sendgrid', SENDGRID_API_KEY: 'test-key', SENDGRID_BAA_CONFIRMED: 'true' }),
    ).not.toThrow();
  });

  it('requires secrets in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(ConfigError);
  });
});
