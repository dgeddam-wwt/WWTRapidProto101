import { useState } from 'react';
import { Lock, Send } from 'lucide-react';
import { dispatchEmail, fetchAuditTrail, type AuditVerifyResponse } from '../api.ts';
import { SYNTHETIC_DISPATCHES } from '../../shared/fixtures/syntheticDrafts.ts';
import type { DispatchResponse, MessageType } from '../../shared/types.ts';

const HASH_PREVIEW_LENGTH = 12;

export default function DispatchPanel(): React.JSX.Element {
  const [result, setResult] = useState<DispatchResponse | null>(null);
  const [audit, setAudit] = useState<AuditVerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(messageType: MessageType): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const request = messageType === 'schedule' ? SYNTHETIC_DISPATCHES.schedule : SYNTHETIC_DISPATCHES.testResult;
      setResult(await dispatchEmail(request as unknown as Record<string, unknown>));
      setAudit(await fetchAuditTrail());
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Dispatch failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-slate-900 uppercase">Compliant dispatch (dry run)</h2>
        <p className="mt-1 text-sm text-slate-500">
          Dispatch accepts structured fields only — never free text. Schedule messages carry date, time, location, and
          provider; results messages carry an expiring portal link and nothing else.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void send('schedule');
          }}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
          Send schedule email
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void send('test_result');
          }}
          className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
        >
          <Lock className="h-3.5 w-3.5" aria-hidden />
          Send results notification
        </button>
      </div>

      {error !== null && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">Rejected: {error}</p>
      )}

      {result !== null && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
          <dt className="text-slate-500">Subject sent</dt>
          <dd className="text-slate-800">{result.subject}</dd>
          <dt className="text-slate-500">Message type</dt>
          <dd className="font-mono text-slate-800">{result.messageType}</dd>
          <dt className="text-slate-500">Delivery status</dt>
          <dd className="font-mono text-slate-800">{result.deliveryStatus}</dd>
          <dt className="text-slate-500">Transport / TLS floor</dt>
          <dd className="font-mono text-slate-800">
            {result.transport} · {result.tlsMinVersion}
          </dd>
          {result.portalLinkExpiresAt !== undefined && (
            <>
              <dt className="text-slate-500">Portal link expires</dt>
              <dd className="font-mono text-slate-800">{result.portalLinkExpiresAt}</dd>
            </>
          )}
        </dl>
      )}

      {audit !== null && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-700">
            Audit chain: {audit.entryCount} entries · integrity {audit.valid ? 'verified' : 'BROKEN'}
          </p>
          <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto font-mono text-[11px] text-slate-600">
            {audit.entries.map((entry) => (
              <li key={entry.entry_hash} className="rounded border border-slate-200 px-2 py-1">
                #{entry.seq} · {entry.timestamp} · {entry.message_type} · {entry.delivery_status} · recipient{' '}
                {entry.recipient_id_hash.slice(0, HASH_PREVIEW_LENGTH)}…
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400">
            Entries are hash-chained and hold only a salted recipient hash — no addresses, subjects, or bodies.
          </p>
        </div>
      )}
    </section>
  );
}
