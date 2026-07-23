import { FileText, Sparkles, ScanSearch } from 'lucide-react'
import { SCENARIOS } from '../data/scenarios'

export default function InputPanel({
  draftText,
  setDraftText,
  activeScenario,
  onSelectScenario,
  onRunAudit,
  isLoading,
}) {
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-slate-200">Test Scenarios</h2>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {SCENARIOS.map((scenario, idx) => (
            <button
              key={scenario.label}
              type="button"
              onClick={() => onSelectScenario(idx)}
              className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                activeScenario === idx
                  ? 'border-sky-500/60 bg-sky-500/10 text-sky-200'
                  : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              <div className="mb-0.5">{scenario.label}</div>
              <div className="text-[11px] font-normal text-slate-500">{scenario.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-slate-200">Draft Message</h2>
        </div>
        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder="Draft your patient outreach message here..."
          className="min-h-[220px] flex-1 resize-none rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
        <button
          type="button"
          onClick={onRunAudit}
          disabled={!draftText.trim() || isLoading}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          <ScanSearch className="h-4 w-4" />
          {isLoading ? 'Auditing...' : 'Run Compliance Audit'}
        </button>
      </section>
    </div>
  )
}
