/**
 * Deterministic, local detection rules for HIPAA Safe Harbor identifiers.
 *
 * This is regex/heuristic pattern matching — NOT an ML/NLP/LLM classifier and
 * NOT a compliance determination. Every finding means "potential identifier
 * detected, human review required".
 *
 * No name lexicons or sample identifiers are embedded here: names are matched
 * structurally so no realistic PII has to live in source (AGENTS.md § Prohibited
 * Actions).
 */

import { SEVERITY, SEVERITY_POINTS, DETECTION_TIER, type Finding, type Severity, type DetectionTier } from './types.ts';
import { SENSITIVE_CONTEXT_LABEL, categoryName } from './safeHarbor.ts';

interface Candidate {
  text: string;
  index: number;
  safeHarborNumber: number | null;
  category: string;
  severity: Severity;
  detection: DetectionTier;
  note: string;
}

const CONTEXT_WINDOW = 44;

const CLINIC_CONTACT_MARKERS = [
  'call us',
  'call our',
  'contact us',
  'contact our',
  'reach us',
  'reschedule, call',
  'reschedule call',
  'office at',
  'clinic at',
  'front desk',
  'main line',
  'or email',
  'email us',
  'our office',
];

const PATIENT_CONTACT_MARKERS = [
  'your phone',
  'your number',
  'your mobile',
  'your cell',
  'your email',
  'your address',
  'reach you at',
  'we have you at',
  'on file for you',
  'patient phone',
  'patient email',
  'sent to you at',
];

/** Words that commonly form capitalised bigrams but are not person names. */
const NAME_STOPWORDS = new Set(
  [
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
    'september', 'october', 'november', 'december',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'hi', 'hello', 'dear', 'hey', 'thank', 'thanks', 'please', 'kind', 'best',
    'regards', 'sincerely', 'this', 'that', 'we', 'our', 'your', 'you', 'the',
    'patient', 'portal', 'secure', 'message', 'health', 'healthcare', 'alliance',
    'clinic', 'medical', 'center', 'centre', 'care', 'team', 'office', 'suite',
    'street', 'avenue', 'road', 'drive', 'court', 'lane', 'boulevard',
    'appointment', 'appointments', 'visit', 'results', 'result', 'lab', 'labs',
    'if', 'to', 'log', 'into', 'in', 'review', 'contact', 'call', 'confirm',
    'confirming', 'reminder', 'regarding', 'note', 'notice', 'good', 'morning',
    'afternoon', 'evening',
    // Compliance vocabulary that legitimately appears in staff drafts and UI copy.
    'safe', 'harbor', 'harbour', 'risk', 'high', 'medium', 'low', 'critical', 'leak',
    'full', 'name', 'example', 'sample', 'draft', 'body', 'subject', 'identifier',
    'phi', 'hipaa', 'privacy', 'security', 'compliance', 'sandbox', 'mode',
  ],
);

const CLINICAL_SPECIALTIES = [
  'cardiology', 'oncology', 'dermatology', 'psychiatry', 'neurology', 'obstetrics',
  'gynecology', 'endocrinology', 'orthopedics', 'radiology', 'dental', 'biopsy',
  'chemotherapy', 'dialysis', 'mammogram', 'colonoscopy', 'mri', 'ct scan',
  'diagnosis', 'diagnosed', 'prescription', 'dosage', 'blood pressure', 'cholesterol',
  'a1c', 'hiv', 'cancer', 'diabetes', 'pregnancy', 'substance use', 'mental health',
];

/**
 * Generic clinical vocabulary: it names a category of care without revealing a
 * value or condition. "Your lab results are ready" is the approved generic
 * subject line, so the bare phrase cannot be treated as a diagnostic disclosure.
 */
const GENERIC_CLINICAL_TERMS = [
  'lab result', 'lab results', 'test result', 'test results', 'medication list',
  'medications', 'follow-up', 'follow up', 'pre-visit instructions',
  'previsit instructions', 'referral', 'specialist', 'treatment plan', 'care plan',
];

function windowBefore(text: string, index: number): string {
  return text.slice(Math.max(0, index - CONTEXT_WINDOW), index).toLowerCase();
}

function hasMarker(context: string, markers: readonly string[]): boolean {
  return markers.some((m) => context.includes(m));
}

function candidate(
  match: RegExpMatchArray,
  safeHarborNumber: number | null,
  severity: Severity,
  detection: DetectionTier,
  note: string,
  category?: string,
): Candidate {
  return {
    text: match[0],
    index: match.index ?? 0,
    safeHarborNumber,
    category: category ?? (safeHarborNumber === null ? SENSITIVE_CONTEXT_LABEL : categoryName(safeHarborNumber)),
    severity,
    detection,
    note,
  };
}

function scanRegex(
  text: string,
  pattern: RegExp,
  safeHarborNumber: number | null,
  severity: Severity,
  detection: DetectionTier,
  note: string,
  category?: string,
): Candidate[] {
  return [...text.matchAll(pattern)].map((m) => candidate(m, safeHarborNumber, severity, detection, note, category));
}

function scanTerms(
  text: string,
  terms: readonly string[],
  safeHarborNumber: number | null,
  severity: Severity,
  note: string,
): Candidate[] {
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return scanRegex(text, new RegExp(`\\b(?:${escaped})\\b`, 'gi'), safeHarborNumber, severity, DETECTION_TIER.HEURISTIC, note);
}

function scanContactChannel(text: string): Candidate[] {
  const out: Candidate[] = [];

  const phonePattern = /(?:\+1[\s.-]?)?(?:\(\d{3}\)\s*|\b\d{3}[\s.-])\d{3}[\s.-]?\d{4}\b/g;
  for (const m of text.matchAll(phonePattern)) {
    const context = windowBefore(text, m.index ?? 0);
    const isFax = context.includes('fax');
    const isPatient = hasMarker(context, PATIENT_CONTACT_MARKERS);
    const looksLikeClinic = hasMarker(context, CLINIC_CONTACT_MARKERS);
    out.push(
      candidate(
        m,
        isFax ? 5 : 4,
        isPatient ? SEVERITY.DIRECT : SEVERITY.MANUAL_REVIEW,
        DETECTION_TIER.REGEX,
        isPatient
          ? 'Context marks this as the patient\u2019s own number — a direct identifier that should not be echoed back in email.'
          : looksLikeClinic
            ? 'Telephone number reads as a clinic callback line rather than the patient\u2019s. Confirm before sending.'
            : 'Telephone number detected, but context does not clearly mark it as the patient\u2019s. Confirm before sending.',
      ),
    );
  }

  const emailPattern = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g;
  for (const m of text.matchAll(emailPattern)) {
    const context = windowBefore(text, m.index ?? 0);
    const isPatient = hasMarker(context, PATIENT_CONTACT_MARKERS);
    out.push(
      candidate(
        m,
        6,
        isPatient ? SEVERITY.DIRECT : SEVERITY.MANUAL_REVIEW,
        DETECTION_TIER.REGEX,
        isPatient
          ? 'Context marks this as the patient\u2019s own email address — a direct identifier.'
          : 'Email address detected, but context does not clearly mark it as the patient\u2019s (may be a clinic mailbox). Confirm before sending.',
      ),
    );
  }

  return out;
}

function scanNames(text: string): Candidate[] {
  const out: Candidate[] = [];

  // Provider reference: adds clinical context, but is not itself a patient identifier.
  const providerPattern = /\b(?:Dr\.?|Doctor|Prof\.?)\s+[A-Z][a-z]{1,}\b/g;
  const providerRanges: Array<[number, number]> = [];
  for (const m of text.matchAll(providerPattern)) {
    const index = m.index ?? 0;
    providerRanges.push([index, index + m[0].length]);
    out.push(
      candidate(
        m,
        1,
        SEVERITY.CONTEXTUAL,
        DETECTION_TIER.HEURISTIC,
        'Provider reference. May imply clinical context; flagged for manual review rather than scored as a patient identifier.',
      ),
    );
  }

  const fullNamePattern = /\b([A-Z][a-z]{1,})\s+([A-Z][a-z]{1,})\b/g;
  for (const m of text.matchAll(fullNamePattern)) {
    const index = m.index ?? 0;
    const first = m[1] ?? '';
    const second = m[2] ?? '';
    if (NAME_STOPWORDS.has(first.toLowerCase()) || NAME_STOPWORDS.has(second.toLowerCase())) continue;
    if (providerRanges.some(([start, end]) => index >= start && index < end)) continue;
    out.push(
      candidate(
        m,
        1,
        SEVERITY.QUASI,
        DETECTION_TIER.HEURISTIC,
        'Potential full patient name — a Safe Harbor identifier. Requires human review; not an automatic compliance ruling.',
      ),
    );
  }

  // First name alone in a greeting: surfaced, but 0 points and no tier impact.
  const greetingPattern = /\b(?:Hi|Hello|Dear|Hey)\s+([A-Z][a-z]{1,})\b(?!\s+[A-Z][a-z])/g;
  for (const m of text.matchAll(greetingPattern)) {
    const given = m[1] ?? '';
    if (NAME_STOPWORDS.has(given.toLowerCase())) continue;
    out.push({
      text: given,
      index: (m.index ?? 0) + m[0].indexOf(given),
      safeHarborNumber: 1,
      category: categoryName(1),
      severity: SEVERITY.INFO,
      detection: DETECTION_TIER.HEURISTIC,
      note: 'First name only — weak identifier. Shown for awareness; excluded from the risk score and tier.',
    });
  }

  return out;
}

function collectCandidates(text: string): Candidate[] {
  return [
    ...scanRegex(text, /\b\d{3}-\d{2}-\d{4}\b/g, 7, SEVERITY.DIRECT, DETECTION_TIER.REGEX, 'Social Security number pattern — never appropriate in email.'),
    ...scanRegex(text, /\b(?:MRN|medical record (?:number|no\.?|#))\s*[:#]?\s*[A-Z]?\d{4,10}\b/gi, 8, SEVERITY.DIRECT, DETECTION_TIER.REGEX, 'Medical record number — a direct identifier tying the message to a chart.'),
    ...scanRegex(text, /\b(?:member|policy|subscriber|beneficiary|health plan)\s*(?:id|number|no\.?|#)\s*[:#]?\s*[A-Z0-9-]{4,15}\b/gi, 9, SEVERITY.DIRECT, DETECTION_TIER.REGEX, 'Health plan beneficiary/member number — a direct identifier.'),
    ...scanRegex(text, /\b(?:account|acct)\s*(?:number|no\.?|#)?\s*[:#]?\s*\d{5,16}\b/gi, 10, SEVERITY.DIRECT, DETECTION_TIER.REGEX, 'Account number — a direct identifier.'),
    ...scanRegex(text, /\b(?:license|licence|certificate|cert)\s*(?:number|no\.?|#)?\s*[:#]?\s*[A-Z0-9-]{4,15}\b/gi, 11, SEVERITY.QUASI, DETECTION_TIER.REGEX, 'Certificate or license number — a Safe Harbor identifier.'),
    ...scanRegex(text, /\b(?:license plate|plate)\s*[:#]?\s*[A-Z0-9-]{5,8}\b/gi, 12, SEVERITY.QUASI, DETECTION_TIER.HEURISTIC, 'Vehicle identifier or license plate — a Safe Harbor identifier.'),
    ...scanRegex(text, /\b(?:serial|device|implant|pump|pacemaker)\s*(?:number|no\.?|id|#)?\s*[:#]?\s*[A-Z0-9-]{5,20}\b/gi, 13, SEVERITY.QUASI, DETECTION_TIER.HEURISTIC, 'Device identifier or serial number — a Safe Harbor identifier.'),
    ...scanRegex(text, /\bhttps?:\/\/[^\s<>"')]+/gi, 14, SEVERITY.QUASI, DETECTION_TIER.REGEX, 'URL detected. Links must point to the authenticated portal, never to content that exposes PHI.'),
    ...scanRegex(text, /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, 15, SEVERITY.QUASI, DETECTION_TIER.REGEX, 'IP address — a Safe Harbor identifier.'),
    ...scanRegex(text, /\b\d{4}-\d{2}-\d{2}\b/g, 3, SEVERITY.QUASI, DETECTION_TIER.REGEX, 'Date tied to a healthcare activity. Only the year survives Safe Harbor de-identification.'),
    ...scanRegex(text, /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, 3, SEVERITY.QUASI, DETECTION_TIER.REGEX, 'Date tied to a healthcare activity. Only the year survives Safe Harbor de-identification.'),
    ...scanRegex(
      text,
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?\b/gi,
      3,
      SEVERITY.QUASI,
      DETECTION_TIER.REGEX,
      'Date tied to a healthcare activity. Only the year survives Safe Harbor de-identification.',
    ),
    ...scanRegex(
      text,
      /\b\d{1,5}\s+(?:[A-Z][a-zA-Z]*\s){0,3}(?:Street|St\.|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Drive|Court|Ct\.?|Way|Suite|Ste\.?)\b/g,
      2,
      SEVERITY.QUASI,
      DETECTION_TIER.REGEX,
      'Street address — a geographic subdivision smaller than a state.',
    ),
    ...scanRegex(text, /\b(?:[A-Z]{2}\s+|ZIP\s*(?:code)?\s*:?\s*)\d{5}(?:-\d{4})?\b/g, 2, SEVERITY.QUASI, DETECTION_TIER.REGEX, 'ZIP code — a geographic subdivision smaller than a state.'),
    ...scanContactChannel(text),
    ...scanNames(text),
    ...scanTerms(text, CLINICAL_SPECIALTIES, null, SEVERITY.QUASI, 'Clinical specialty, condition, or diagnostic detail. Combined with any identifier this can reveal treatment.'),
    ...scanTerms(text, GENERIC_CLINICAL_TERMS, null, SEVERITY.CONTEXTUAL, 'General clinical term without a person attached. Low concern alone; review in context.'),
  ];
}

/**
 * Overlapping candidates are collapsed to the highest-weighted one so a single
 * span of text is never double-counted in the score.
 */
function suppressOverlaps(candidates: readonly Candidate[]): Candidate[] {
  const ranked = candidates.toSorted((a, b) => {
    const points = SEVERITY_POINTS[b.severity] - SEVERITY_POINTS[a.severity];
    if (points !== 0) return points;
    if (b.text.length !== a.text.length) return b.text.length - a.text.length;
    return a.index - b.index;
  });

  const accepted: Candidate[] = [];
  for (const c of ranked) {
    const start = c.index;
    const end = c.index + c.text.length;
    const overlaps = accepted.some((a) => start < a.index + a.text.length && a.index < end);
    if (!overlaps) accepted.push(c);
  }
  return accepted.toSorted((a, b) => a.index - b.index);
}

/** Scans free text for potential Safe Harbor identifiers. Pure and deterministic. */
export function detectFindings(text: string): Finding[] {
  if (text.trim().length === 0) return [];
  return suppressOverlaps(collectCandidates(text)).map((c) => ({
    text: c.text,
    index: c.index,
    safeHarborNumber: c.safeHarborNumber,
    category: c.category,
    severity: c.severity,
    points: SEVERITY_POINTS[c.severity],
    detection: c.detection,
    note: c.note,
  }));
}

/** True when the text contains any identifier that carries score weight. */
export function containsIdentifier(text: string): boolean {
  return detectFindings(text).some((f) => f.points > 0);
}
