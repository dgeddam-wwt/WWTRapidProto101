import { ClipboardList, Copy, Check, FileSearch, ShieldAlert } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { riskExplanation } from '../lib/auditEngine'

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <FileSearch className="h-9 w-9 text-slate-700" />
      <p className="max-w-xs text-sm text-slate-500">
        Paste a draft and run audit to check compliance.
      </p>
    </div>
  )
}

function SkeletonState() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="skeleton h-6 w-32 rounded-full" />
      <div className="flex flex-col gap-2">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-5/6 rounded" />
        <div className="skeleton h-4 w-4/6 rounded" />
      </div>
      <div className="skeleton mt-2 h-24 w-full rounded-xl" />
    </div>
  )
}

function CopyButton({ sanitizedText, copyConfirmed, setCopyConfirmed }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sanitizedText)
    } catch {
      // clipboard API unavailable — fail silently in this demo
    }
    setCopyConfirmed(true)
    setTimeout(() => setCopyConfirmed(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        copyConfirmed
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
          : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
      }`}
    >
      {copyConfirmed ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copyConfirmed ? 'Copied!' : 'Copy Sanitized Draft'}
    </button>
  )
}

export default function ReportPanel({ isLoading, auditResult, copyConfirmed, setCopyConfirmed }) {
  return (
    <section className="flex min-h-[520px] flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-sky-400" />
        <h2 className="text-sm font-semibold text-slate-200">Live Audit Report</h2>
      </div>

      {isLoading && <SkeletonState />}

      {!isLoading && !auditResult && <EmptyState />}

      {!isLoading && auditResult && (
        <div className="fade-in-up flex flex-1 flex-col gap-5">
          <StatusBadge riskLevel={auditResult.riskLevel} />

          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ShieldAlert className="h-3.5 w-3.5" />
              Flagged Items ({auditResult.matches.length})
            </h3>
            {auditResult.matches.length === 0 ? (
              <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-400">
                No identifiable content detected in this draft.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {auditResult.matches.map((match, idx) => (
                  <li
                    key={`${match.category}-${match.index}-${idx}`}
                    className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200">
                        {match.text}
                      </code>
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                        {match.category}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500">
                      {riskExplanation(match.category)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-1 flex-col">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sanitized Draft
              </h3>
              <CopyButton
                sanitizedText={auditResult.sanitizedText}
                copyConfirmed={copyConfirmed}
                setCopyConfirmed={setCopyConfirmed}
              />
            </div>
            <div className="min-h-[100px] flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
              {auditResult.sanitizedText}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
