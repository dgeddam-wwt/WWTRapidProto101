import { RISK_TIER, SEVERITY, type Finding, type RiskAssessment } from './types.ts';

const TIER_BADGE: Readonly<Record<string, string>> = Object.freeze({
  [RISK_TIER.SAFE]: 'Lower Risk Draft',
  [RISK_TIER.MEDIUM]: 'Potential PHI Detected',
  [RISK_TIER.HIGH]: 'High Risk',
});

/**
 * High is reached by accumulation, not by a single quasi identifier: a full
 * patient name (2) plus an appointment date (2) sums to 4 and must stay Medium.
 */
export const HIGH_SCORE_THRESHOLD = 6;

/**
 * Sums severity weights into a score and maps it to a tier. Any single Direct
 * identifier forces High plus the Critical Leak sub-state. Manual Review (1 pt)
 * and Info (0 pt) findings never force it.
 */
export function assessRisk(findings: readonly Finding[]): RiskAssessment {
  const score = findings.reduce((sum, f) => sum + f.points, 0);
  const hasDirectIdentifier = findings.some((f) => f.severity === SEVERITY.DIRECT);

  let tier: RiskAssessment['tier'] = RISK_TIER.SAFE;
  if (score > 0) {
    tier = hasDirectIdentifier || score >= HIGH_SCORE_THRESHOLD ? RISK_TIER.HIGH : RISK_TIER.MEDIUM;
  }

  return {
    score,
    tier,
    hasDirectIdentifier,
    isCriticalLeak: hasDirectIdentifier,
    badge: hasDirectIdentifier ? 'CRITICAL LEAK' : (TIER_BADGE[tier] ?? tier),
  };
}
