import { useState } from 'react'
import { BookOpen, ChevronDown } from 'lucide-react'
import { SAFE_HARBOR_CATEGORIES, DETECTION_TIER } from '../utils/detectionRules'

const TIER_LABEL = {
  [DETECTION_TIER.REGEX]: 'regex',
  [DETECTION_TIER.HEURISTIC]: 'heuristic',
  [DETECTION_TIER.MANUAL]: 'manual',
}

const TIER_STYLE = {
  [DETECTION_TIER.REGEX]: 'bg-blue-50 text-blue-600 border-blue-200',
  [DETECTION_TIER.HEURISTIC]: 'bg-purple-50 text-purple-600 border-purple-200',
  [DETECTION_TIER.MANUAL]: 'bg-slate-100 text-slate-500 border-slate-200',
}

export default function IdentifierReference() {
  const [open, setOpen] = useState(false)

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-800">18 Safe Harbor Identifier Categories</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-slate-100 px-4 py-3">
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {SAFE_HARBOR_CATEGORIES.map((cat) => (
              <li key={cat.id} className="flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-1.5">
                <span className="text-[11px] font-semibold text-slate-500">#{cat.id}</span>
                <span className="flex-1 truncate text-[11px] text-slate-600">{cat.name}</span>
                <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${TIER_STYLE[cat.tier]}`}>
                  {TIER_LABEL[cat.tier]}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            Clinical specialty is flagged as sensitive context but is not one of the 18 Safe Harbor identifiers.
          </p>
        </div>
      )}
    </section>
  )
}
