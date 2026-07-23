import { AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react'

const STATUS_CONFIG = {
  CRITICAL: {
    label: 'CRITICAL LEAK',
    icon: AlertOctagon,
    className: 'border-red-500/30 bg-red-500/10 text-red-300',
    dot: 'bg-red-400',
  },
  WARNING: {
    label: 'WARNING',
    icon: AlertTriangle,
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    dot: 'bg-amber-400',
  },
  COMPLIANT: {
    label: 'COMPLIANT',
    icon: CheckCircle2,
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400',
  },
}

export default function StatusBadge({ riskLevel }) {
  const config = STATUS_CONFIG[riskLevel] || STATUS_CONFIG.COMPLIANT
  const Icon = config.icon
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </div>
  )
}
