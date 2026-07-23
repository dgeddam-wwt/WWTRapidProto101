import { useState } from 'react'
import Header from './components/Header'
import InputPanel from './components/InputPanel'
import ReportPanel from './components/ReportPanel'
import { auditText } from './lib/auditEngine'
import { SCENARIOS } from './data/scenarios'

const AUDIT_DELAY_MS = 1200

function App() {
  const [activeScenario, setActiveScenario] = useState(null)
  const [draftText, setDraftText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [auditResult, setAuditResult] = useState(null)
  const [copyConfirmed, setCopyConfirmed] = useState(false)

  const handleSelectScenario = (idx) => {
    setActiveScenario(idx)
    setDraftText(SCENARIOS[idx].text)
    setAuditResult(null)
  }

  const handleDraftChange = (value) => {
    setDraftText(value)
    setActiveScenario(null)
    setAuditResult(null)
  }

  const handleRunAudit = () => {
    if (!draftText.trim() || isLoading) return
    setIsLoading(true)
    setAuditResult(null)
    setTimeout(() => {
      setAuditResult(auditText(draftText))
      setIsLoading(false)
    }, AUDIT_DELAY_MS)
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8">
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
          <InputPanel
            draftText={draftText}
            setDraftText={handleDraftChange}
            activeScenario={activeScenario}
            onSelectScenario={handleSelectScenario}
            onRunAudit={handleRunAudit}
            isLoading={isLoading}
          />
          <ReportPanel
            isLoading={isLoading}
            auditResult={auditResult}
            copyConfirmed={copyConfirmed}
            setCopyConfirmed={setCopyConfirmed}
          />
        </div>

        <footer className="mt-8 rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-3 text-center text-[11px] leading-relaxed text-slate-500">
          This is a conceptual demo of a detection UX, built on a local
          regex/string-matching rules engine — it is not a validated
          compliance product, ML classifier, or legal advice. Real
          deployments require a reviewed NLP/PHI-detection engine and legal
          sign-off.
        </footer>
      </main>
    </div>
  )
}

export default App
