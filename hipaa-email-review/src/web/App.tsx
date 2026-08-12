import { useEffect, useState } from 'react';
import Header from './components/Header.tsx';
import InputPanel from './components/InputPanel.tsx';
import EvaluationPanel from './components/EvaluationPanel.tsx';
import SafeOutputPanel from './components/SafeOutputPanel.tsx';
import DispatchPanel from './components/DispatchPanel.tsx';
import CoverageChecklist from './components/CoverageChecklist.tsx';
import { reviewDraft } from './api.ts';
import type { ReviewResult } from '../shared/types.ts';

const DEBOUNCE_MS = 300;

export default function App(): React.JSX.Element {
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (draft.trim().length === 0) {
      setResult(null);
      setError(null);
      return;
    }

    setPending(true);
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => {
      reviewDraft(draft)
        .then((next) => {
          if (!controller.signal.aborted) {
            setResult(next);
            setError(null);
          }
        })
        .catch((caught: unknown) => {
          if (!controller.signal.aborted) {
            setError(caught instanceof Error ? caught.message : 'Review failed.');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setPending(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      globalThis.clearTimeout(timer);
    };
  }, [draft]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6">
        {error !== null && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <InputPanel draft={draft} onDraftChange={setDraft} />
          <EvaluationPanel result={result} pending={pending} />
          <div className="flex flex-col gap-4">
            <SafeOutputPanel result={result} />
            <DispatchPanel />
          </div>
        </div>

        {result !== null && <CoverageChecklist coverage={result.coverage} />}

        <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500">
          Prototype for workflow validation only. Deterministic pattern matching — not certified HIPAA compliance, not a
          legal determination, and not a substitute for human review. Synthetic data only.
        </footer>
      </main>
    </div>
  );
}
