import express, { type ErrorRequestHandler, type Express, type Request, type Response } from 'express';
import { reviewDraft } from '../shared/review.ts';
import { MinimumNecessaryError } from '../shared/minimumNecessary.ts';
import { BodyComplianceError } from '../shared/compose.ts';
import { SubjectComplianceError } from '../shared/subjects.ts';
import { AuditIntegrityError } from './audit/auditLog.ts';
import { TransportSecurityError } from './email/transport.ts';
import { dispatchEmail, type DispatchDeps } from './dispatchService.ts';

const MAX_DRAFT_LENGTH = 20_000;
const JSON_BODY_LIMIT = '64kb';
const HTTP_BAD_REQUEST = 400;
const HTTP_UNPROCESSABLE = 422;
const HTTP_CONFLICT = 409;
const HTTP_SERVER_ERROR = 500;
const HTTP_BAD_GATEWAY = 502;
const AUDIT_TAIL_SIZE = 25;

function securityHeaders(_req: Request, res: Response, next: () => void): void {
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  // Patient communications must never be cached by intermediaries.
  res.setHeader('Cache-Control', 'no-store');
  next();
}

export function createApp(deps: DispatchDeps): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      transport: deps.transport.name,
      tlsMinVersion: deps.transport.tlsMinVersion,
      baaCovered: deps.transport.baaCovered,
    });
  });

  /**
   * Reviews a draft in-process and returns findings. The draft is not persisted,
   * cached, or logged — only aggregate metadata is logged.
   */
  app.post('/api/review', (req, res) => {
    const draft = (req.body as { draft?: unknown } | undefined)?.draft;
    if (typeof draft !== 'string') {
      res.status(HTTP_BAD_REQUEST).json({ error: 'draft must be a string.' });
      return;
    }
    if (draft.length > MAX_DRAFT_LENGTH) {
      res.status(HTTP_BAD_REQUEST).json({ error: `draft exceeds ${String(MAX_DRAFT_LENGTH)} characters.` });
      return;
    }

    const result = reviewDraft(draft);
    deps.logger.info(
      {
        riskTier: result.risk.tier,
        riskScore: result.risk.score,
        findingCount: result.findings.length,
        purpose: result.purpose.purpose,
      },
      'draft reviewed',
    );
    res.json(result);
  });

  app.post('/api/emails/dispatch', (req, res, next) => {
    dispatchEmail(req.body, deps)
      .then((result) => {
        res.json(result);
      })
      .catch(next);
  });

  app.get('/api/audit/verify', (_req, res) => {
    const verification = deps.auditLog.verify();
    res.json({ ...verification, entries: deps.auditLog.entries().slice(-AUDIT_TAIL_SIZE) });
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof MinimumNecessaryError) {
      res.status(HTTP_UNPROCESSABLE).json({ error: error.message, field: error.field, rule: 'minimum-necessary' });
      return;
    }
    if (error instanceof BodyComplianceError || error instanceof SubjectComplianceError) {
      res.status(HTTP_UNPROCESSABLE).json({ error: error.message, rule: 'phi-exposure-guard' });
      return;
    }
    if (error instanceof TransportSecurityError) {
      res.status(HTTP_BAD_GATEWAY).json({ error: error.message, rule: 'transport-security' });
      return;
    }
    if (error instanceof AuditIntegrityError) {
      res.status(HTTP_CONFLICT).json({ error: error.message, rule: 'audit-integrity' });
      return;
    }
    // Unknown failures are logged without the request body and reported generically.
    deps.logger.error({ err: error instanceof Error ? error.name : 'unknown' }, 'unhandled request failure');
    res.status(HTTP_SERVER_ERROR).json({ error: 'Request could not be completed.' });
  };
  app.use(errorHandler);

  return app;
}
