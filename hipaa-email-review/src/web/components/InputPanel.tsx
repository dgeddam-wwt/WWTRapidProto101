import { Eraser } from 'lucide-react';
import { SYNTHETIC_SCENARIOS } from '../../shared/fixtures/syntheticDrafts.ts';

interface InputPanelProps {
  readonly draft: string;
  readonly onDraftChange: (draft: string) => void;
}

export default function InputPanel({ draft, onDraftChange }: InputPanelProps): React.JSX.Element {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-slate-900 uppercase">Input draft</h2>
        <p className="mt-1 text-sm text-slate-500">Paste a patient communication to scan for potential identifiers.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SYNTHETIC_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            title={scenario.description}
            onClick={() => {
              onDraftChange(scenario.draft);
            }}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-400 hover:bg-blue-50"
          >
            {scenario.label}
          </button>
        ))}
      </div>

      <label className="sr-only" htmlFor="draft">
        Patient communication draft
      </label>
      <textarea
        id="draft"
        value={draft}
        onChange={(event) => {
          onDraftChange(event.target.value);
        }}
        rows={12}
        spellCheck={false}
        placeholder="Hi ..."
        className="w-full resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
      />

      <button
        type="button"
        disabled={draft.length === 0}
        onClick={() => {
          onDraftChange('');
        }}
        className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Eraser className="h-3.5 w-3.5" aria-hidden />
        Clear draft
      </button>

      <p className="text-xs text-slate-400">
        Drafts are reviewed in memory only — nothing is stored, cached, or written to logs.
      </p>
    </section>
  );
}
