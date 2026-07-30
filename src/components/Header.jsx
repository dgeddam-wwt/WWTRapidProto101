import { ShieldCheck } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight text-slate-900">
              HIPAA Shield Agent
            </h1>
            <p className="text-xs leading-tight text-slate-500">
              Rapid prototype for reviewing patient communications before sending
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="pulse-dot absolute inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Secure Sandbox Mode (no outbound data)
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Prototype only · Synthetic data · Human review required
          </span>
        </div>
      </div>
    </header>
  )
}
