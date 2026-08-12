import { ShieldCheck } from 'lucide-react';

export default function Header(): React.JSX.Element {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-emerald-600" aria-hidden />
          <div>
            <h1 className="text-lg font-semibold text-slate-900">HIPAA Email Review</h1>
            <p className="text-sm text-slate-500">
              Review patient communications before they are sent, then dispatch only the minimum necessary.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            Prototype · Synthetic data · Human review required
          </span>
          <span className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
            Dry-run transport (no live sends)
          </span>
        </div>
      </div>
    </header>
  );
}
