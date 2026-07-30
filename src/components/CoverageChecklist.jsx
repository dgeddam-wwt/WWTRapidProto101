import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { SAFE_HARBOR_CATEGORIES, DETECTION_TIER } from '../utils/detectionRules'

const STATUS_STYLE = {
  Detected: { icon: CheckCircle2, className: 'text-red-600' },
  Clear: { icon: XCircle, className: 'text-slate-300' },
  Manual: { icon: HelpCircle, className: 'text-slate-400' },
}

export default function CoverageChecklist({ matches }) {
  const detectedIds = new Set(matches.filter((m) => m.categoryId !== null).map((m) => m.categoryId))

  const rows = SAFE_HARBOR_CATEGORIES.map((cat) => {
    let status = 'Clear'
    if (cat.tier === DETECTION_TIER.MANUAL) status = 'Manual'
    else if (detectedIds.has(cat.id)) status = 'Detected'
    return { ...cat, status }
  })

  return (
    <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
      {rows.map((row) => {
        const { icon: Icon, className } = STATUS_STYLE[row.status]
        return (
          <li
            key={row.id}
            className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1.5"
          >
            <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${className}`} />
            <span className="flex-1 truncate text-[11px] text-slate-600">
              #{row.id} {row.name}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide ${
                row.status === 'Detected'
                  ? 'text-red-600'
                  : row.status === 'Manual'
                    ? 'text-slate-400'
                    : 'text-slate-400'
              }`}
            >
              {row.status === 'Manual' ? 'manual check' : row.status}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
