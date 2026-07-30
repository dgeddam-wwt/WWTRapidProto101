import { useState } from 'react'
import { ShieldCheck, Copy, Check, FileSearch } from 'lucide-react'
import { PURPOSES } from '../utils/classifyPurpose'
import { getSafeTemplate } from '../utils/safeTemplates'

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
      <FileSearch className="h-8 w-8 text-slate-300" />
      <p className="max-w-xs text-sm text-slate-400">
        Run a scan to generate a purpose-adaptive, PHI-free safe draft.
      </p>
    </div>
  )
}

export default function SafeOutputPanel({ hasDraft, detectedPurposeId, purposeOverride, onOverridePurpose }) {
  const [copyConfirmed, setCopyConfirmed] = useState(false)

  if (!hasDraft) {
    return (
      <section className="flex min-h-[420px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <PanelHeader />
        <EmptyState />
      </section>
    )
  }

  const activePurposeId = purposeOverride || detectedPurposeId
  const safeText = getSafeTemplate(activePurposeId)
  const isOverridden = Boolean(purposeOverride) && purposeOverride !== detectedPurposeId

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(safeText)
    } catch {
      // clipboard API unavailable — fail silently in this demo
    }
    setCopyConfirmed(true)
    setTimeout(() => setCopyConfirmed(false), 1500)
  }

  return (
    <section className="fade-in-up flex flex-1 flex-col rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
      <PanelHeader />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
          Detected purpose: {PURPOSES.find((p) => p.id === detectedPurposeId)?.label || 'General outreach'}
        </span>
        {isOverridden && (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600">
            Overridden
          </span>
        )}
      </div>

      <label className="mb-1 block text-[11px] font-medium text-slate-500">Override purpose</label>
      <select
        value={activePurposeId}
        onChange={(e) => onOverridePurpose(e.target.value)}
        className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        {PURPOSES.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      <div className="mb-3 flex-1 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3.5 text-sm leading-relaxed text-slate-700">
        {safeText}
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className={`mb-2 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
          copyConfirmed
            ? 'border-emerald-400 bg-emerald-100 text-emerald-700'
            : 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-500'
        }`}
      >
        {copyConfirmed ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copyConfirmed ? 'Safe draft copied for review' : 'Copy Safe Draft'}
      </button>

      <p className="text-[11px] leading-relaxed text-slate-400">
        Review before use. This prototype does not guarantee compliance.
      </p>
    </section>
  )
}

function PanelHeader() {
  return (
    <div className="mb-3 flex items-center gap-2">
      <ShieldCheck className="h-4 w-4 text-emerald-600" />
      <h2 className="text-sm font-semibold text-slate-800">Purpose-Adaptive Safe Version</h2>
    </div>
  )
}
