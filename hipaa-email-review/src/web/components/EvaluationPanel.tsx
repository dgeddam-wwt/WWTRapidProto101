import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { RISK_TIER, SEVERITY, type Finding, type ReviewResult } from '../../shared/types.ts';

const SEVERITY_STYLES: Readonly<Record<string, string>> = {
  [SEVERITY.DIRECT]: 'border-red-200 bg-red-50 text-red-800',
  [SEVERITY.QUASI]: 'border-amber-200 bg-amber-50 text-amber-900',
  [SEVERITY.CONTEXTUAL]: 'border-slate-200 bg-slate-50 text-slate-700',
  [SEVERITY.MANUAL_REVIEW]: 'border-blue-200 bg-blue-50 text-blue-800',
  [SEVERITY.INFO]: 'border-slate-200 bg-white text-slate-500',
};

const TIER_STYLES: Readonly<Record<string, string>> = {
  [RISK_TIER.SAFE]: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  [RISK_TIER.MEDIUM]: 'border-amber-200 bg-amber-50 text-amber-900',
  [RISK_TIER.HIGH]: 'border-red-200 bg-red-50 text-red-800',
};

function FindingRow({ finding }: { readonly finding: Finding }): React.JSX.Element {
  return (
    <li className={`rounded-lg border p-3 ${SEVERITY_STYLES[finding.severity] ?? ''}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-sm break-all">{finding.text}</span>
        <span className="shrink-0 text-xs font-semibold whitespace-nowrap">
          {finding.severity} · {finding.points} pt
        </span>
      </div>
      <p className="mt-1 text-xs font-medium">
        {finding.safeHarborNumber === null ? 'Context signal' : `Safe Harbor #${String(finding.safeHarborNumber)}`} ·{' '}
        {finding.category}
      </p>
      <p className="mt-1 text-xs opacity-90">{finding.note}</p>
    </li>
  );
}

interface EvaluationPanelProps {
  readonly result: ReviewResult | null;
  readonly pending: boolean;
}

export default function EvaluationPanel({ result, pending }: EvaluationPanelProps): React.JSX.Element {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-900 uppercase">Instant evaluation</h2>
        {pending && <span className="text-xs text-slate-400">scanning…</span>}
      </div>

      {result === null ? (
        <p className="text-sm text-slate-500">Findings appear here as soon as there is a draft to review.</p>
      ) : (
        <>
          {result.risk.isCriticalLeak && (
            <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-sm font-semibold text-red-900">
              <ShieldAlert className="h-4 w-4" aria-hidden />
              CRITICAL LEAK — direct identifier present. Do not send this draft.
            </div>
          )}

          <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${TIER_STYLES[result.risk.tier] ?? ''}`}>
            <span className="flex items-center gap-2 text-sm font-semibold">
              {result.risk.tier === RISK_TIER.SAFE ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden />
              ) : (
                <AlertTriangle className="h-4 w-4" aria-hidden />
              )}
              {result.risk.badge}
            </span>
            <span className="text-xs font-medium">
              Risk score: {result.risk.score} · {result.risk.tier}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Detected purpose: <span className="font-medium text-slate-700">{result.purpose.label}</span> · dispatch class{' '}
            <span className="font-mono">{result.purpose.messageType}</span>
          </p>

          {result.findings.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              No potential identifiers detected. Human review is still required.
            </p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
              {result.findings.map((finding) => (
                <FindingRow key={`${finding.index}-${finding.category}`} finding={finding} />
              ))}
            </ul>
          )}

          <p className="flex items-start gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Deterministic pattern matching, not a compliance determination. Every finding requires human review.
          </p>
        </>
      )}
    </section>
  );
}
