import { randomBytes } from 'node:crypto';

export const MIN_TLS_VERSION = 'TLSv1.2' as const;

export type TransportName = 'dry-run' | 'sendgrid';

export interface AppConfig {
  readonly nodeEnv: string;
  readonly port: number;
  readonly transport: TransportName;
  readonly sendgridApiKey: string | null;
  readonly sendgridBaaConfirmed: boolean;
  readonly portalBaseUrl: string;
  readonly portalTokenSecret: string;
  readonly portalTokenTtlSeconds: number;
  readonly recipientHashSalt: string;
  readonly auditLogPath: string | null;
  /** True when dev-only ephemeral secrets were generated instead of supplied. */
  readonly usingEphemeralSecrets: boolean;
}

export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

type Env = Record<string, string | undefined>;

function required(env: Env, key: string, isProduction: boolean): string {
  const value = env[key]?.trim() ?? '';
  if (value.length > 0) return value;
  if (isProduction) {
    throw new ConfigError(`${key} must be set when NODE_ENV=production.`);
  }
  return '';
}

function parsePositiveInt(value: string | undefined, fallback: number, key: string): number {
  if (value === undefined || value.trim().length === 0) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ConfigError(`${key} must be a positive integer.`);
  }
  return parsed;
}

function parseTransport(value: string | undefined): TransportName {
  const transport = value?.trim() ?? 'dry-run';
  if (transport === 'dry-run' || transport === 'sendgrid') return transport;
  throw new ConfigError(`Unsupported EMAIL_TRANSPORT '${transport}'. Use 'dry-run' or 'sendgrid'.`);
}

/**
 * AGENTS.md § HIPAA 3 — Transport Security. The portal handoff must be https and
 * the SendGrid transport is refused unless a BAA has been explicitly confirmed
 * (AGENTS.md § Prohibited Actions).
 */
export function loadConfig(env: Env = process.env): AppConfig {
  const nodeEnv = env['NODE_ENV']?.trim() ?? 'development';
  const isProduction = nodeEnv === 'production';
  const transport = parseTransport(env['EMAIL_TRANSPORT']);

  const portalBaseUrl = (env['PORTAL_BASE_URL']?.trim() ?? '') || 'https://portal.example.invalid/secure-message';
  if (!portalBaseUrl.startsWith('https://')) {
    throw new ConfigError('PORTAL_BASE_URL must use https:// — plain-text portal links are not permitted.');
  }

  const suppliedTokenSecret = required(env, 'PORTAL_TOKEN_SECRET', isProduction);
  const suppliedSalt = required(env, 'RECIPIENT_HASH_SALT', isProduction);
  const usingEphemeralSecrets = suppliedTokenSecret.length === 0 || suppliedSalt.length === 0;

  const sendgridApiKey = env['SENDGRID_API_KEY']?.trim() ?? '';
  const sendgridBaaConfirmed = env['SENDGRID_BAA_CONFIRMED']?.trim() === 'true';
  if (transport === 'sendgrid') {
    if (sendgridApiKey.length === 0) {
      throw new ConfigError('SENDGRID_API_KEY is required when EMAIL_TRANSPORT=sendgrid.');
    }
    if (!sendgridBaaConfirmed) {
      throw new ConfigError('SENDGRID_BAA_CONFIRMED must be true: a signed BAA is required before any PHI-bearing dispatch.');
    }
  }

  const auditLogPath = env['AUDIT_LOG_PATH']?.trim() ?? '';

  return {
    nodeEnv,
    port: parsePositiveInt(env['PORT'], 8787, 'PORT'),
    transport,
    sendgridApiKey: sendgridApiKey.length > 0 ? sendgridApiKey : null,
    sendgridBaaConfirmed,
    portalBaseUrl,
    portalTokenSecret: suppliedTokenSecret.length > 0 ? suppliedTokenSecret : randomBytes(32).toString('hex'),
    portalTokenTtlSeconds: parsePositiveInt(env['PORTAL_TOKEN_TTL_SECONDS'], 900, 'PORTAL_TOKEN_TTL_SECONDS'),
    recipientHashSalt: suppliedSalt.length > 0 ? suppliedSalt : randomBytes(32).toString('hex'),
    auditLogPath: auditLogPath.length > 0 ? auditLogPath : null,
    usingEphemeralSecrets,
  };
}
