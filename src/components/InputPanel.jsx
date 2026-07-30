import { FileText, Sparkles, Trash2 } from 'lucide-react'
import { SAMPLE_DRAFTS } from '../data/sampleDrafts'

export default function InputPanel({ draftText, onDraftChange, activeScenario, onSelectScenario, onClear }) {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-800">Test Scenarios</h2>
        </div>
        <div className="flex flex-col gap-2">
          {SAMPLE_DRAFTS.map((draft, idx) => (
            <button
              key={draft.id}
              type="button"
              onClick={() => onSelectScenario(idx)}
              className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                activeScenario === idx
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="mb-0.5">{draft.label}</div>
              <div className="text-[11px] font-normal text-slate-400">{draft.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-800">Input Draft</h2>
          </div>
          <button
            type="button"
            onClick={onClear}
            disabled={!draftText}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Draft
          </button>
        </div>
        <p className="mb-2 text-xs text-slate-400">
          Paste a patient communication to scan for potential identifiers.
        </p>
        <textarea
          value={draftText}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Paste or write a patient communication here..."
          className="min-h-[260px] flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </section>
    </div>
  )
}
