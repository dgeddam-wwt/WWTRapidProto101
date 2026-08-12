import { useState } from 'react';
import { ClipboardCheck, Copy, Mail } from 'lucide-react';
import type { ReviewResult } from '../../shared/types.ts';

interface SafeOutputPanelProps {
  readonly result: ReviewResult | null;
}

export default function SafeOutputPanel({ result }: SafeOutputPanelProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  async function copy(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    globalThis.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
      <h2 className="text-sm font-semibold tracking-wide text-emerald-900 uppercase">Safer version for review</h2>

      {result === null ? (
        <p className="text-sm text-slate-500">A regenerated, identifier-free draft appears here.</p>
      ) : (
        <>
          <div className="rounded-lg border border-emerald-200 bg-white p-3">
            <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              Subject (generic, allowlisted — never contains PHI)
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">{result.proposedSubject}</p>
          </div>

          <pre className="max-h-72 overflow-y-auto rounded-lg border border-emerald-200 bg-white p-3 text-sm whitespace-pre-wrap text-slate-800">
            {result.safeVersion}
          </pre>

          <button
            type="button"
            onClick={() => {
              void copy(`${result.proposedSubject}\n\n${result.safeVersion}`);
            }}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            {copied ? <ClipboardCheck className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? 'Copied' : 'Copy safer version'}
          </button>

          <p className="text-xs text-emerald-900/70">
            Regenerated from a static template rather than redacted, so no residual identifier can survive. A person still
            approves before anything is sent.
          </p>
        </>
      )}
    </section>
  );
}
