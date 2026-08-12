/**
 * AGENTS.md § HIPAA 2 — test result emails must hand off to a secure portal via a
 * tokenized, expiring authentication link.
 *
 * Tokens are HMAC-SHA256 signed, carry only a salted recipient reference plus an
 * expiry, and are verified in constant time. No clinical data is encoded.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export interface PortalTokenOptions {
  readonly secret: string;
  readonly baseUrl: string;
  readonly ttlSeconds: number;
}

export interface PortalHandoffResult {
  readonly url: string;
  readonly expiresAt: Date;
  readonly ttlMinutes: number;
}

interface TokenClaims {
  readonly sub: string;
  readonly exp: number;
  readonly jti: string;
}

const SECONDS_PER_MINUTE = 60;
const MILLIS_PER_SECOND = 1000;

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Builds a one-time, expiring portal link for a results notification. */
export function createPortalHandoff(
  recipientIdHash: string,
  options: PortalTokenOptions,
  now: Date = new Date(),
): PortalHandoffResult {
  if (!options.baseUrl.startsWith('https://')) {
    throw new Error('Portal links must be https.');
  }
  const expiresAt = new Date(now.getTime() + options.ttlSeconds * MILLIS_PER_SECOND);
  const claims: TokenClaims = {
    sub: recipientIdHash,
    exp: Math.floor(expiresAt.getTime() / MILLIS_PER_SECOND),
    jti: randomBytes(12).toString('base64url'),
  };
  const payload = base64url(JSON.stringify(claims));
  const token = `${payload}.${sign(payload, options.secret)}`;
  const url = new URL(options.baseUrl);
  url.searchParams.set('t', token);

  return {
    url: url.toString(),
    expiresAt,
    ttlMinutes: Math.round(options.ttlSeconds / SECONDS_PER_MINUTE),
  };
}

export type PortalTokenVerification =
  | { readonly valid: true; readonly recipientIdHash: string; readonly expiresAt: Date }
  | { readonly valid: false; readonly reason: 'malformed' | 'bad_signature' | 'expired' };

export function verifyPortalToken(token: string, secret: string, now: Date = new Date()): PortalTokenVerification {
  const [payload, signature] = token.split('.');
  if (payload === undefined || signature === undefined) return { valid: false, reason: 'malformed' };

  const expected = Buffer.from(sign(payload, secret));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return { valid: false, reason: 'bad_signature' };
  }

  let claims: TokenClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TokenClaims;
  } catch {
    return { valid: false, reason: 'malformed' };
  }
  if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number') {
    return { valid: false, reason: 'malformed' };
  }

  const expiresAt = new Date(claims.exp * MILLIS_PER_SECOND);
  if (expiresAt.getTime() <= now.getTime()) return { valid: false, reason: 'expired' };
  return { valid: true, recipientIdHash: claims.sub, expiresAt };
}
