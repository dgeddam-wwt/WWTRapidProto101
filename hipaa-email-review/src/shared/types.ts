/**
 * Shared domain types for the HIPAA Email Review service.
 * Used by both the Express server and the browser UI.
 */

export const SEVERITY = {
  DIRECT: 'Direct',
  QUASI: 'Quasi',
  CONTEXTUAL: 'Contextual',
  MANUAL_REVIEW: 'Manual Review',
  INFO: 'Info',
} as const;

export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];

/** Severity weights summed into the risk score. */
export const SEVERITY_POINTS: Readonly<Record<Severity, number>> = Object.freeze({
  [SEVERITY.DIRECT]: 3,
  [SEVERITY.QUASI]: 2,
  [SEVERITY.CONTEXTUAL]: 1,
  // Detected, but context does not clearly mark it as the patient's (e.g. a
  // clinic callback number). Low weight; never forces the High tier.
  [SEVERITY.MANUAL_REVIEW]: 1,
  // Surfaced for the reviewer only (e.g. a first name alone). No tier impact.
  [SEVERITY.INFO]: 0,
});

export const DETECTION_TIER = {
  REGEX: 'regex',
  HEURISTIC: 'heuristic',
  MANUAL: 'manual',
} as const;

export type DetectionTier = (typeof DETECTION_TIER)[keyof typeof DETECTION_TIER];

export const RISK_TIER = {
  SAFE: 'Safe',
  MEDIUM: 'Medium',
  HIGH: 'High',
} as const;

export type RiskTier = (typeof RISK_TIER)[keyof typeof RISK_TIER];

export interface Finding {
  /** Matched text, retained only for in-session reviewer highlighting. */
  readonly text: string;
  readonly index: number;
  /** 1-18 for a Safe Harbor category, null for non-Safe-Harbor context signals. */
  readonly safeHarborNumber: number | null;
  readonly category: string;
  readonly severity: Severity;
  readonly points: number;
  readonly detection: DetectionTier;
  readonly note: string;
}

export interface RiskAssessment {
  readonly score: number;
  readonly tier: RiskTier;
  readonly hasDirectIdentifier: boolean;
  readonly isCriticalLeak: boolean;
  readonly badge: string;
}

/** Message classes recognised by the dispatch pipeline (AGENTS.md § HIPAA 1 & 2). */
export const MESSAGE_TYPE = {
  SCHEDULE: 'schedule',
  TEST_RESULT: 'test_result',
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

export const EMAIL_PURPOSE = [
  'confirmation',
  'reminder',
  'followup',
  'reschedule',
  'previsit',
  'billing',
  'test_result',
  'general',
] as const;

export type EmailPurpose = (typeof EMAIL_PURPOSE)[number];

export interface PurposeClassification {
  readonly purpose: EmailPurpose;
  readonly label: string;
  readonly messageType: MessageType;
}

export interface CoverageItem {
  readonly safeHarborNumber: number;
  readonly name: string;
  readonly detection: DetectionTier;
  readonly findingCount: number;
}

export interface ReviewResult {
  readonly risk: RiskAssessment;
  readonly findings: readonly Finding[];
  readonly purpose: PurposeClassification;
  /** Regenerated, identifier-free draft for human review before sending. */
  readonly safeVersion: string;
  /** Generic subject that would be used at dispatch time. Never contains PHI. */
  readonly proposedSubject: string;
  readonly coverage: readonly CoverageItem[];
  readonly reviewedAt: string;
}

/** Minimum-necessary payload for a schedule email (AGENTS.md § HIPAA 2). */
export interface SchedulePayload {
  readonly date: string;
  readonly time: string;
  readonly location: string;
  readonly providerName: string;
}

export const SCHEDULE_PAYLOAD_FIELDS = ['date', 'time', 'location', 'providerName'] as const;

export const DELIVERY_STATUS = {
  DELIVERED: 'delivered',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  FAILED: 'failed',
} as const;

export type DeliveryStatus = (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];

/** The four fields AGENTS.md requires in every audit entry, plus integrity metadata. */
export interface AuditEntry {
  readonly timestamp: string;
  readonly recipient_id_hash: string;
  readonly message_type: MessageType;
  readonly delivery_status: DeliveryStatus;
  readonly seq: number;
  readonly transport: string;
  readonly prev_hash: string;
  readonly entry_hash: string;
}

export interface DispatchResponse {
  readonly auditRef: string;
  readonly subject: string;
  readonly messageType: MessageType;
  readonly deliveryStatus: DeliveryStatus;
  readonly transport: string;
  readonly tlsMinVersion: string;
  /** Present for test_result messages: tokenized, expiring secure-portal handoff. */
  readonly portalLinkExpiresAt?: string;
}
