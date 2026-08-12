/** @synthetic-data-only — anonymized values only, per AGENTS.md § Prohibited Actions. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from '../src/server/app.ts';
import { loadConfig } from '../src/server/config.ts';
import { AuditLog } from '../src/server/audit/auditLog.ts';
import { DryRunTransport } from '../src/server/email/dryRunTransport.ts';
import { createLogger } from '../src/server/logging/logger.ts';
import { SYNTHETIC_DISPATCHES, SYNTHETIC_SCENARIOS } from '../src/shared/fixtures/syntheticDrafts.ts';
import type { DispatchResponse, ReviewResult } from '../src/shared/types.ts';

const config = loadConfig({ PORTAL_TOKEN_SECRET: 'test-secret', RECIPIENT_HASH_SALT: 'test-salt' });
const auditLog = new AuditLog({ salt: config.recipientHashSalt });
const transport = new DryRunTransport();
const app = createApp({ config, transport, auditLog, logger: createLogger({ level: 'silent' }) });

let server: Server;
let baseUrl = '';

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      baseUrl = `http://127.0.0.1:${String(port)}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => {
      resolve();
    });
  });
});

async function post(path: string, body: unknown): Promise<{ status: number; json: Record<string, unknown> }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, json: (await response.json()) as Record<string, unknown> };
}

describe('review API', () => {
  it('returns findings, a generic subject, and a safer draft', async () => {
    const draft = SYNTHETIC_SCENARIOS.find((s) => s.id === 'high')?.draft ?? '';
    const { status, json } = await post('/api/review', { draft });
    const result = json as unknown as ReviewResult;

    expect(status).toBe(200);
    expect(result.risk.isCriticalLeak).toBe(true);
    expect(result.proposedSubject).toBe('You have a new secure message regarding your appointment');
    expect(result.safeVersion).not.toContain('Testpatient Alpha');
    expect(result.coverage).toHaveLength(18);
  });

  it('routes a results draft to the test_result dispatch class', async () => {
    const draft = SYNTHETIC_SCENARIOS.find((s) => s.id === 'results')?.draft ?? '';
    const { json } = await post('/api/review', { draft });
    const result = json as unknown as ReviewResult;
    expect(result.purpose.messageType).toBe('test_result');
    expect(result.proposedSubject).toBe('Your lab results are ready');
    expect(result.safeVersion).not.toMatch(/cholesterol|prescription/i);
  });

  it('sets no-store and rejects a non-string draft', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');

    const { status } = await post('/api/review', { draft: { text: 'nope' } });
    expect(status).toBe(400);
  });
});

describe('dispatch API', () => {
  it('sends a schedule email with a generic subject and audits it', async () => {
    const { status, json } = await post('/api/emails/dispatch', SYNTHETIC_DISPATCHES.schedule);
    const result = json as unknown as DispatchResponse;

    expect(status).toBe(200);
    expect(result.subject).toBe('You have a new secure message regarding your appointment');
    expect(result.deliveryStatus).toBe('accepted');
    expect(result.tlsMinVersion).toBe('TLSv1.3');
    expect(auditLog.entries().at(-1)?.message_type).toBe('schedule');
  });

  it('sends a results notification as an expiring portal handoff', async () => {
    const { status, json } = await post('/api/emails/dispatch', SYNTHETIC_DISPATCHES.testResult);
    const result = json as unknown as DispatchResponse;

    expect(status).toBe(200);
    expect(result.subject).toBe('Your lab results are ready');
    expect(result.portalLinkExpiresAt).toBeDefined();
    expect(auditLog.entries().at(-1)?.message_type).toBe('test_result');
  });

  it('rejects a request that exceeds minimum necessary, and audits the rejection', async () => {
    const before = auditLog.entries().length;
    const { status, json } = await post('/api/emails/dispatch', {
      ...SYNTHETIC_DISPATCHES.schedule,
      payload: { ...SYNTHETIC_DISPATCHES.schedule.payload, diagnosis: 'elevated cholesterol' },
    });

    expect(status).toBe(422);
    expect(json['rule']).toBe('minimum-necessary');
    expect(auditLog.entries().length).toBe(before + 1);
    expect(auditLog.entries().at(-1)?.delivery_status).toBe('rejected');
  });

  it('keeps the audit chain verifiable and free of recipient addresses', async () => {
    const response = await fetch(`${baseUrl}/api/audit/verify`);
    const body = (await response.json()) as { valid: boolean; entryCount: number };
    const raw = JSON.stringify(body);

    expect(body.valid).toBe(true);
    expect(body.entryCount).toBeGreaterThan(0);
    expect(raw).not.toContain('example.invalid');
  });
});
