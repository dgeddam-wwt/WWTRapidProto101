import { useState } from 'react'
import { ClipboardList, ChevronDown, AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react'
import FindingCard from './FindingCard'
import CoverageChecklist from './CoverageChecklist'
import { SAFE_HARBOR_CATEGORIES, DETECTION_TIER } from '../utils/detectionRules'
import { RISK_TIER } from '../utils/riskScore'

const BADGE_STYLE = {
  [RISK_TIER.HIGH]: { icon: AlertOctagon, className: 'border-red-300 bg-red-50 text-red-700' },
  [RISK_TIER.MEDIUM]: { icon: AlertTriangle, className: 'border-amber-300 bg-amber-50 text-amber-700' },
  [RISK_TIER.SAFE]: { icon: CheckCircle2, className: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
      <ClipboardList className="h-8 w-8 text-slate-300" />
      <p className="max-w-xs text-sm text-slate-400">
        Paste a patient communication to see the coverage scan, risk score, and findings.
      </p>
    </div>
  )
}

export default function EvaluationPanel({ matches, scored, hasDraft }) {
  const [showCoverage, setShowCoverage] = useState(true)

  if (!hasDraft) {
    return (
      <section className="flex min-h-[420px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <PanelHeader />
        <EmptyState />
      </section>
    )
  }

  const detectedCount = new Set(matches.filter((m) => m.categoryId !== null).map((m) => m.categoryId)).size
  const manualCount = SAFE_HARBOR_CATEGORIES.filter((c) => c.tier === DETECTION_TIER.MANUAL).length
  const clearCount = SAFE_HARBOR_CATEGORIES.length - detectedCount - manualCount
  const sensitiveMatches = matches.filter((m) => m.isSensitiveContext)
  const totalCategories = SAFE_HARBOR_CATEGORIES.length

  const badge = BADGE_STYLE[scored.tier]
  const Icon = badge.icon

  return (
    <section className="fade-in-up flex flex-1 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <PanelHeader />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${badge.className}`}>
          <Icon className="h-3.5 w-3.5" />
          {scored.isCriticalLeak ? 'CRITICAL LEAK' : scored.tier}
        </div>
        <span className="text-xs font-medium text-slate-500">
          Risk score: <span className="font-semibold text-slate-700">{scored.score}</span> · {scored.tier}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setShowCoverage((v) => !v)}
        className="mb-2 flex w-full items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-left"
      >
        <span className="text-xs font-medium text-slate-600">
          {totalCategories} of {totalCategories} categories scanned · {detectedCount} detected · {clearCount} clear · {manualCount} manual
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showCoverage ? 'rotate-180' : ''}`} />
      </button>
      {showCoverage && (
        <div className="mb-4">
          <CoverageChecklist matches={matches} />
        </div>
      )}

      <div className="flex-1">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Findings ({matches.length})
        </h3>
        {matches.length === 0 ? (
          <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-400">
            No identifiers or sensitive context detected in this draft.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {matches.map((finding, idx) => (
              <FindingCard key={`${finding.category}-${finding.index}-${idx}`} finding={finding} />
            ))}
          </ul>
        )}
        {sensitiveMatches.length > 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            Clinical specialty is flagged as sensitive context but is not one of the 18 Safe Harbor identifiers.
          </p>
        )}
      </div>
    </section>
  )
}

function PanelHeader() {
  return (
    <div className="mb-3 flex items-center gap-2">
      <ClipboardList className="h-4 w-4 text-blue-600" />
      <h2 className="text-sm font-semibold text-slate-800">Instant Evaluation</h2>
    </div>
  )
}
