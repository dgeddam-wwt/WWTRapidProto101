import { SEVERITY } from '../utils/detectionRules'

const SEVERITY_STYLE = {
  [SEVERITY.DIRECT]: 'border-red-200 bg-red-50 text-red-700',
  [SEVERITY.QUASI]: 'border-amber-200 bg-amber-50 text-amber-700',
  [SEVERITY.CONTEXTUAL]: 'border-slate-200 bg-slate-100 text-slate-600',
}

export default function FindingCard({ finding }) {
  const categoryLabel = finding.isSensitiveContext
    ? finding.category
    : `${finding.category} · Safe Harbor #${finding.safeHarborNumber}`

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">
          {finding.text}
        </code>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_STYLE[finding.severity]}`}
        >
          {finding.severity} · {finding.points} pt{finding.points !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="mb-1 text-[11px] font-medium text-slate-500">{categoryLabel}</div>
      <p className="text-xs leading-relaxed text-slate-500">{finding.note}</p>
    </li>
  )
}
