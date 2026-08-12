import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import express from 'express';
import { loadConfig } from './config.ts';
import { createLogger } from './logging/logger.ts';
import { AuditLog } from './audit/auditLog.ts';
import { createTransport } from './email/factory.ts';
import { createApp } from './app.ts';

const config = loadConfig();
const logger = createLogger();
const auditLog = new AuditLog({ salt: config.recipientHashSalt, filePath: config.auditLogPath });
const transport = createTransport(config);
const app = createApp({ config, transport, auditLog, logger });

if (config.nodeEnv === 'production') {
  const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../web');
  app.use(express.static(webRoot, { maxAge: 0 }));
}

if (config.usingEphemeralSecrets) {
  logger.warn('Using ephemeral development secrets. Set PORTAL_TOKEN_SECRET and RECIPIENT_HASH_SALT for real use.');
}

app.listen(config.port, () => {
  logger.info({ port: config.port, transport: transport.name, tlsMinVersion: transport.tlsMinVersion }, 'server listening');
});
