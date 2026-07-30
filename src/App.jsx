import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import InputPanel from './components/InputPanel'
import EvaluationPanel from './components/EvaluationPanel'
import SafeOutputPanel from './components/SafeOutputPanel'
import IdentifierReference from './components/IdentifierReference'
import { detectAll } from './utils/detectionRules'
import { scoreFindings } from './utils/riskScore'
import { classifyPurpose } from './utils/classifyPurpose'
import { SAMPLE_DRAFTS } from './data/sampleDrafts'

const DEBOUNCE_MS = 300

function App() {
  const [activeScenario, setActiveScenario] = useState(null)
  const [draftText, setDraftText] = useState('')
  const [scannedText, setScannedText] = useState('')
  const [purposeOverride, setPurposeOverride] = useState(null)

  // Debounced re-scan on manual typing; scenario selection scans immediately.
  useEffect(() => {
    const handle = setTimeout(() => setScannedText(draftText), DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [draftText])

  const handleSelectScenario = (idx) => {
    setActiveScenario(idx)
    setDraftText(SAMPLE_DRAFTS[idx].text)
    setScannedText(SAMPLE_DRAFTS[idx].text)
    setPurposeOverride(null)
  }

  const handleDraftChange = (value) => {
    setDraftText(value)
    setActiveScenario(null)
    setPurposeOverride(null)
  }

  const handleClear = () => {
    setDraftText('')
    setScannedText('')
    setActiveScenario(null)
    setPurposeOverride(null)
  }

  const hasDraft = scannedText.trim().length > 0
  const matches = useMemo(() => detectAll(scannedText), [scannedText])
  const scored = useMemo(() => scoreFindings(matches), [matches])
  const detectedPurposeId = useMemo(() => classifyPurpose(scannedText).purposeId, [scannedText])

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6">
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
          <InputPanel
            draftText={draftText}
            onDraftChange={handleDraftChange}
            activeScenario={activeScenario}
            onSelectScenario={handleSelectScenario}
            onClear={handleClear}
          />
          <EvaluationPanel matches={matches} scored={scored} hasDraft={hasDraft} />
          <SafeOutputPanel
            hasDraft={hasDraft}
            detectedPurposeId={detectedPurposeId}
            purposeOverride={purposeOverride}
            onOverridePurpose={setPurposeOverride}
          />
        </div>

        <IdentifierReference />

        <footer className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-[11px] leading-relaxed text-slate-400">
          Prototype only. Not a compliance guarantee. Human review required — this tool highlights
          potential risks using a local, deterministic rules engine but does not guarantee HIPAA
          compliance.
        </footer>
      </main>
    </div>
  )
}

export default App
