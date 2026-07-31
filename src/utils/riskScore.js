import { SEVERITY } from './detectionRules.js'

export const RISK_TIER = {
  SAFE: 'Safe',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

const TIER_BADGE = {
  [RISK_TIER.SAFE]: 'Lower Risk Draft',
  [RISK_TIER.MEDIUM]: 'Potential PHI Detected',
  [RISK_TIER.HIGH]: 'High Risk',
}

// High is reached only by accumulating several quasi/contextual identifiers.
// A full patient name (Quasi 2) plus an appointment date (Quasi 2) sums to 4,
// which must stay Medium — so the escalation threshold sits above that.
const HIGH_SCORE_THRESHOLD = 6

// Sums finding severity weights into a score, then maps the score (plus the
// presence of any Direct identifier) onto a risk tier. Any single Direct
// identifier — a patient phone/email, MRN, SSN, account or beneficiary number —
// forces High + the Critical Leak sub-state, regardless of score. Ambiguous
// contact info (Manual Review) and first-name-only notes (Info) never force it.
export function scoreFindings(matches) {
  const score = matches.reduce((sum, m) => sum + m.points, 0)
  const hasDirect = matches.some((m) => m.severity === SEVERITY.DIRECT)

  let tier = RISK_TIER.SAFE
  if (score === 0) {
    tier = RISK_TIER.SAFE
  } else if (hasDirect || score >= HIGH_SCORE_THRESHOLD) {
    tier = RISK_TIER.HIGH
  } else {
    tier = RISK_TIER.MEDIUM
  }

  const isCriticalLeak = hasDirect

  return {
    score,
    tier,
    hasDirect,
    isCriticalLeak,
    badge: isCriticalLeak ? 'CRITICAL LEAK' : TIER_BADGE[tier],
  }
}
