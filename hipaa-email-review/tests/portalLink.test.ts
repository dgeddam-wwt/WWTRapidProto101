import { describe, expect, it } from 'vitest';
import { createPortalHandoff, verifyPortalToken } from '../src/server/email/portalLink.ts';

const SECRET = 'test-portal-secret-not-a-real-key';
const OPTIONS = { secret: SECRET, baseUrl: 'https://portal.example.invalid/secure-message', ttlSeconds: 900 };
const RECIPIENT_HASH = 'a'.repeat(64);

function tokenFrom(url: string): string {
  return new URL(url).searchParams.get('t') ?? '';
}

describe('AGENTS.md HIPAA 2 — tokenized, expiring portal handoff', () => {
  it('issues an https link with a signed, verifiable token', () => {
    const handoff = createPortalHandoff(RECIPIENT_HASH, OPTIONS);
    expect(handoff.url.startsWith('https://')).toBe(true);
    expect(handoff.ttlMinutes).toBe(15);

    const verification = verifyPortalToken(tokenFrom(handoff.url), SECRET);
    expect(verification.valid).toBe(true);
    if (verification.valid) expect(verification.recipientIdHash).toBe(RECIPIENT_HASH);
  });

  it('carries no clinical content — only a recipient hash and an expiry', () => {
    const token = tokenFrom(createPortalHandoff(RECIPIENT_HASH, OPTIONS).url);
    const claims = JSON.parse(Buffer.from(token.split('.')[0] ?? '', 'base64url').toString('utf8')) as Record<string, unknown>;
    expect(Object.keys(claims).toSorted()).toEqual(['exp', 'jti', 'sub']);
  });

  it('rejects an expired token', () => {
    const issued = new Date('2026-01-01T00:00:00.000Z');
    const handoff = createPortalHandoff(RECIPIENT_HASH, OPTIONS, issued);
    const later = new Date(issued.getTime() + (OPTIONS.ttlSeconds + 1) * 1000);
    expect(verifyPortalToken(tokenFrom(handoff.url), SECRET, later)).toEqual({ valid: false, reason: 'expired' });
  });

  it('rejects a tampered token and a wrong secret', () => {
    const token = tokenFrom(createPortalHandoff(RECIPIENT_HASH, OPTIONS).url);
    const [payload, signature] = token.split('.');
    expect(verifyPortalToken(`${payload ?? ''}x.${signature ?? ''}`, SECRET).valid).toBe(false);
    expect(verifyPortalToken(token, 'different-secret').valid).toBe(false);
    expect(verifyPortalToken('malformed', SECRET)).toEqual({ valid: false, reason: 'malformed' });
  });

  it('refuses to mint a link over plain http', () => {
    expect(() => createPortalHandoff(RECIPIENT_HASH, { ...OPTIONS, baseUrl: 'http://portal.example.invalid' })).toThrow();
  });

  it('issues a unique token per notification', () => {
    const first = tokenFrom(createPortalHandoff(RECIPIENT_HASH, OPTIONS).url);
    const second = tokenFrom(createPortalHandoff(RECIPIENT_HASH, OPTIONS).url);
    expect(first).not.toBe(second);
  });
});
