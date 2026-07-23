import { ShieldCheck } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-sky-400" strokeWidth={2.25} />
          <span className="text-lg font-semibold tracking-tight text-slate-100">
            HIPAA Shield
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="pulse-dot absolute inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-medium text-emerald-300">
            Secure Sandbox Mode <span className="text-emerald-400/70">(No Outbound Data Leaks)</span>
          </span>
        </div>
      </div>
    </header>
  )
}
