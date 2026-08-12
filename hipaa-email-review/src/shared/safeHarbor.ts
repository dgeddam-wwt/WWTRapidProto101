import { DETECTION_TIER, type DetectionTier } from './types.ts';

export interface SafeHarborCategory {
  readonly id: number;
  readonly name: string;
  readonly detection: DetectionTier;
}

/** The 18 HIPAA Safe Harbor identifier categories (45 CFR § 164.514(b)(2)). */
export const SAFE_HARBOR_CATEGORIES: readonly SafeHarborCategory[] = Object.freeze([
  { id: 1, name: 'Names', detection: DETECTION_TIER.HEURISTIC },
  { id: 2, name: 'Geographic subdivisions smaller than a state', detection: DETECTION_TIER.REGEX },
  { id: 3, name: 'Dates (except year) related to an individual', detection: DETECTION_TIER.REGEX },
  { id: 4, name: 'Telephone numbers', detection: DETECTION_TIER.REGEX },
  { id: 5, name: 'Fax numbers', detection: DETECTION_TIER.REGEX },
  { id: 6, name: 'Email addresses', detection: DETECTION_TIER.REGEX },
  { id: 7, name: 'Social Security numbers', detection: DETECTION_TIER.REGEX },
  { id: 8, name: 'Medical record numbers', detection: DETECTION_TIER.REGEX },
  { id: 9, name: 'Health plan beneficiary numbers', detection: DETECTION_TIER.REGEX },
  { id: 10, name: 'Account numbers', detection: DETECTION_TIER.REGEX },
  { id: 11, name: 'Certificate / license numbers', detection: DETECTION_TIER.REGEX },
  { id: 12, name: 'Vehicle identifiers / license plates', detection: DETECTION_TIER.HEURISTIC },
  { id: 13, name: 'Device identifiers / serial numbers', detection: DETECTION_TIER.HEURISTIC },
  { id: 14, name: 'Web URLs', detection: DETECTION_TIER.REGEX },
  { id: 15, name: 'IP addresses', detection: DETECTION_TIER.REGEX },
  { id: 16, name: 'Biometric identifiers', detection: DETECTION_TIER.MANUAL },
  { id: 17, name: 'Full-face photos / comparable images', detection: DETECTION_TIER.MANUAL },
  { id: 18, name: 'Any other unique identifying number, characteristic, or code', detection: DETECTION_TIER.HEURISTIC },
]);

/** Clinical context is not one of the 18, but it drives re-identification risk. */
export const SENSITIVE_CONTEXT_LABEL = 'Clinical / sensitive context (not one of the 18)';

export function categoryName(id: number): string {
  return SAFE_HARBOR_CATEGORIES.find((c) => c.id === id)?.name ?? SENSITIVE_CONTEXT_LABEL;
}
