import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CoverageItem } from '../../shared/types.ts';

interface CoverageChecklistProps {
  readonly coverage: readonly CoverageItem[];
}

export default function CoverageChecklist({ coverage }: CoverageChecklistProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
        }}
        className="flex w-full items-center gap-2 text-sm font-semibold tracking-wide text-slate-900 uppercase"
        aria-expanded={open}
      >
        {open ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
        18 Safe Harbor identifier categories scanned
      </button>

      {open && (
        <ul className="mt-3 grid gap-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
          {coverage.map((item) => (
            <li
              key={item.safeHarborNumber}
              className={`flex items-center justify-between gap-2 rounded border px-2 py-1 ${
                item.findingCount > 0 ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 text-slate-600'
              }`}
            >
              <span>
                #{item.safeHarborNumber} {item.name}
              </span>
              <span className="shrink-0 font-mono text-[11px] opacity-70">
                {item.detection}
                {item.findingCount > 0 ? ` · ${String(item.findingCount)}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
