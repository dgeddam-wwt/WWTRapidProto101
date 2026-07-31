// HIPAA Shield Agent — deterministic, client-side detection rules.
// Scans against all 18 HIPAA Safe Harbor identifier categories using
// regex / heuristic pattern matching. No ML, no LLM, no network calls.

export const SEVERITY = {
  DIRECT: 'Direct',
  QUASI: 'Quasi',
  CONTEXTUAL: 'Contextual',
  MANUAL_REVIEW: 'Manual Review',
  INFO: 'Info',
}

export const SEVERITY_POINTS = {
  [SEVERITY.DIRECT]: 3,
  [SEVERITY.QUASI]: 2,
  [SEVERITY.CONTEXTUAL]: 1,
  // "Manual Review" = detected but context is ambiguous (e.g. a phone/email that
  // may belong to the clinic, not the patient). Low weight, never forces High.
  [SEVERITY.MANUAL_REVIEW]: 1,
  // "Info" = surfaced for the reviewer but treated as low concern in this
  // prototype (e.g. a first name alone). 0 points, no tier impact.
  [SEVERITY.INFO]: 0,
}

export const DETECTION_TIER = {
  REGEX: 'regex',
  HEURISTIC: 'heuristic',
  MANUAL: 'manual',
}

// All 18 HIPAA Safe Harbor identifier categories.
export const SAFE_HARBOR_CATEGORIES = [
  { id: 1, name: 'Names', tier: DETECTION_TIER.HEURISTIC },
  { id: 2, name: 'Geographic subdivisions smaller than a state', tier: DETECTION_TIER.REGEX },
  { id: 3, name: 'Dates (except year) related to an individual', tier: DETECTION_TIER.REGEX },
  { id: 4, name: 'Telephone numbers', tier: DETECTION_TIER.REGEX },
  { id: 5, name: 'Fax numbers', tier: DETECTION_TIER.REGEX },
  { id: 6, name: 'Email addresses', tier: DETECTION_TIER.REGEX },
  { id: 7, name: 'Social Security numbers', tier: DETECTION_TIER.REGEX },
  { id: 8, name: 'Medical record numbers', tier: DETECTION_TIER.REGEX },
  { id: 9, name: 'Health plan beneficiary numbers', tier: DETECTION_TIER.REGEX },
  { id: 10, name: 'Account numbers', tier: DETECTION_TIER.REGEX },
  { id: 11, name: 'Certificate / license numbers', tier: DETECTION_TIER.REGEX },
  { id: 12, name: 'Vehicle identifiers / license plates', tier: DETECTION_TIER.HEURISTIC },
  { id: 13, name: 'Device identifiers / serial numbers', tier: DETECTION_TIER.HEURISTIC },
  { id: 14, name: 'URLs', tier: DETECTION_TIER.REGEX },
  { id: 15, name: 'IP addresses', tier: DETECTION_TIER.REGEX },
  { id: 16, name: 'Biometric identifiers', tier: DETECTION_TIER.MANUAL },
  { id: 17, name: 'Full-face photos / comparable images', tier: DETECTION_TIER.MANUAL },
  { id: 18, name: 'Any other unique identifying number, characteristic, or code', tier: DETECTION_TIER.HEURISTIC },
]

export const SENSITIVE_CONTEXT_LABEL = 'Sensitive context — not one of the 18'

// Synthetic name list used for detection only.
const SYNTHETIC_NAMES = ['John Smith', 'Nina Specter', 'Audrey Miles', 'Marcus Lee']

const CLINICAL_SPECIALTIES = [
  'cardiology', 'oncology', 'dermatology', 'dental', 'psychiatry', 'therapy', 'biopsy', 'HIV', 'cancer',
]
const GENERIC_SENSITIVE_TERMS = ['medication list', 'follow-up', 'pre-visit instructions']

function finditer(regex, text) {
  const out = []
  const re = new RegExp(regex)
  let m
  while ((m = re.exec(text)) !== null) {
    out.push(m)
    if (m[0].length === 0) re.lastIndex++
  }
  return out
}

function match(text, index, categoryId, category, severity, note) {
  return {
    text,
    index,
    categoryId,
    category,
    safeHarborNumber: categoryId,
    severity,
    points: SEVERITY_POINTS[severity],
    note,
    isSensitiveContext: categoryId === null,
  }
}

// --- Context awareness for contact identifiers -----------------------------
// Phone numbers and email addresses are only Direct patient identifiers when
// they route to the patient. Clinic callback numbers and office mailboxes are
// operational contact info, not PHI. We look at the words immediately around a
// match to decide: patient-oriented → Direct; clinic/operational → Manual
// Review; unclear → Manual Review (never auto-escalated to a Critical Leak).

const CONTEXT_RADIUS = 50

// Operational / clinic wording near a phone number.
const CLINIC_PHONE_CONTEXT = [
  'call us', 'call our office', 'contact our office', 'clinic phone',
  'main office', 'front desk', 'reschedule, call', 'questions, call', 'reach us at',
]
// Patient-oriented wording near a phone number.
const PATIENT_PHONE_CONTEXT = [
  'patient phone', 'mobile', 'cell', 'home phone', "'s number", 'contact number on file',
]

// Operational / clinic wording near an email address.
const CLINIC_EMAIL_CONTEXT = [
  'email us', 'contact us', 'contact our office', 'clinic email', 'office email',
  'care team', 'front desk', 'questions, email', 'reach us at', 'send questions to',
  'reschedule, email',
]
// Patient-oriented wording near an email address.
const PATIENT_EMAIL_CONTEXT = [
  'patient email', "'s email", 'email on file', 'personal email',
  'send to the patient at', 'patient contact',
]

function contextWindow(text, index, length) {
  const start = Math.max(0, index - CONTEXT_RADIUS)
  const end = Math.min(text.length, index + length + CONTEXT_RADIUS)
  return text.slice(start, end).toLowerCase()
}

// Patient wording wins over clinic wording; when neither is present the caller
// treats it as "unclear".
function classifyContact(window, clinicPhrases, patientPhrases) {
  if (patientPhrases.some((p) => window.includes(p))) return 'patient'
  if (clinicPhrases.some((p) => window.includes(p))) return 'clinic'
  return 'unclear'
}

// --- Tier A: regex-reliable -------------------------------------------------

function detectDates(text) {
  const results = []
  const monthDayYear = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}\b/g
  const numeric = /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g
  const relative = /\b(?:tomorrow|yesterday|next\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|week|month))\b/gi
  for (const re of [monthDayYear, numeric, relative]) {
    for (const m of finditer(re, text)) {
      results.push(match(m[0], m.index, 3, 'Dates (except year)', SEVERITY.QUASI, 'A specific date tied to a person can help re-identify them under Safe Harbor guidance.'))
    }
  }
  return results
}

function detectTelephone(text) {
  const re = /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g
  const out = []
  for (const m of finditer(re, text)) {
    const precededByFax = /\bfax[:\s]*$/i.test(text.slice(Math.max(0, m.index - 8), m.index))
    if (precededByFax) continue
    const window = contextWindow(text, m.index, m[0].length)
    const kind = classifyContact(window, CLINIC_PHONE_CONTEXT, PATIENT_PHONE_CONTEXT)
    if (kind === 'patient') {
      out.push(match(m[0], m.index, 4, 'Telephone numbers', SEVERITY.DIRECT, 'Phone number detected. Surrounding text points to a patient phone number — a direct identifier that lets anyone contact the patient.'))
    } else if (kind === 'clinic') {
      out.push(match(m[0], m.index, 4, 'Telephone numbers', SEVERITY.MANUAL_REVIEW, 'Phone number detected. Verify whether this is a patient phone number or a clinic callback number. Nearby wording suggests a likely clinic callback number.'))
    } else {
      out.push(match(m[0], m.index, 4, 'Telephone numbers', SEVERITY.MANUAL_REVIEW, 'Phone number detected. Verify whether this is a patient phone number or a clinic callback number.'))
    }
  }
  return out
}

function detectFax(text) {
  const re = /\bfax[:\s]*(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/gi
  return finditer(re, text).map((m) =>
    match(m[1], m.index + m[0].indexOf(m[1]), 5, 'Fax numbers', SEVERITY.DIRECT, 'Fax numbers are a direct identifier under Safe Harbor.')
  )
}

function detectEmail(text) {
  const re = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g
  const out = []
  for (const m of finditer(re, text)) {
    const window = contextWindow(text, m.index, m[0].length)
    const kind = classifyContact(window, CLINIC_EMAIL_CONTEXT, PATIENT_EMAIL_CONTEXT)
    if (kind === 'patient') {
      out.push(match(m[0], m.index, 6, 'Email addresses', SEVERITY.DIRECT, 'Email address detected. Surrounding text points to a patient email address — a direct identifier that routes directly to the patient.'))
    } else if (kind === 'clinic') {
      out.push(match(m[0], m.index, 6, 'Email addresses', SEVERITY.MANUAL_REVIEW, 'Email address detected. Verify whether this belongs to the patient or the clinic/office. Nearby wording suggests a likely clinic/office email address.'))
    } else {
      out.push(match(m[0], m.index, 6, 'Email addresses', SEVERITY.MANUAL_REVIEW, 'Email address detected. Verify whether this belongs to the patient or the clinic/office.'))
    }
  }
  return out
}

function detectSSN(text) {
  const re = /\b\d{3}-\d{2}-\d{4}\b/g
  return finditer(re, text).map((m) =>
    match(m[0], m.index, 7, 'Social Security numbers', SEVERITY.DIRECT, 'SSNs are one of the most sensitive direct identifiers a message can contain.')
  )
}

function detectMRN(text) {
  const re = /\b(?:MRN[-\s:]?\d+|Medical Record Number[:\s]+\d+)\b/gi
  return finditer(re, text).map((m) =>
    match(m[0], m.index, 8, 'Medical record numbers', SEVERITY.DIRECT, 'Medical record numbers uniquely link a message to a specific patient chart.')
  )
}

function detectHealthPlanBeneficiary(text) {
  const re = /\b(?:HPB-\d+|Beneficiary\s+ID\s+\d+)\b/gi
  return finditer(re, text).map((m) =>
    match(m[0], m.index, 9, 'Health plan beneficiary numbers', SEVERITY.DIRECT, 'Beneficiary numbers are a direct identifier tied to insurance records.')
  )
}

function detectAccountNumber(text) {
  const re = /\b(?:Acct[-\s#]?\d+|Account\s*#\d+)\b/gi
  return finditer(re, text).map((m) =>
    match(m[0], m.index, 10, 'Account numbers', SEVERITY.DIRECT, 'Account numbers are a direct identifier tied to billing records.')
  )
}

function detectLicenseCertificate(text) {
  const re = /\b(?:License\s*#?[A-Z]{0,2}-?\d+|Cert-\d+)\b/gi
  return finditer(re, text).map((m) =>
    match(m[0], m.index, 11, 'Certificate / license numbers', SEVERITY.QUASI, 'License or certificate numbers can be cross-referenced to identify a person.')
  )
}

function detectURL(text) {
  const re = /\bhttps?:\/\/\S+|\bwww\.\S+/gi
  return finditer(re, text).map((m) =>
    match(m[0], m.index, 14, 'URLs', SEVERITY.QUASI, 'URLs can contain embedded identifiers or link back to a personal record.')
  )
}

function detectIPAddress(text) {
  const re = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
  return finditer(re, text).map((m) =>
    match(m[0], m.index, 15, 'IP addresses', SEVERITY.QUASI, 'IP addresses can be used to trace a message back to a device or location.')
  )
}

function detectGeographic(text) {
  const out = []
  const street = /\b\d{1,5}\s+\w+(?:\s\w+)*\s(?:Street|St|Ave|Avenue|Road|Rd|Blvd|Lane|Ln|Drive|Dr|Way|Ct|Court)\b/gi
  for (const m of finditer(street, text)) {
    out.push(match(m[0], m.index, 2, 'Geographic subdivisions smaller than a state', SEVERITY.QUASI, 'Street addresses are a geographic identifier smaller than a state under Safe Harbor.'))
  }
  const zip = /\b\d{5}(?:-\d{4})?\b/g
  for (const m of finditer(zip, text)) {
    out.push(match(m[0], m.index, 2, 'Geographic subdivisions smaller than a state', SEVERITY.QUASI, 'ZIP codes are a geographic identifier smaller than a state under Safe Harbor.'))
  }
  return out
}

// --- Tier B: heuristic -------------------------------------------------

// Name handling nuance (prototype heuristic):
// - Full patient name  → Quasi (2 pts), Medium-style risk (not an auto Critical Leak)
// - First name only    → Info (0 pts), surfaced but no effect on the score/tier
// - Provider ("Dr. X") → Contextual (1 pt), manual review — clinical context, not
//   necessarily a patient identifier.
const FULL_NAME_NOTE =
  'Full patient name detected. Treated as a Medium-risk quasi-identifier in this prototype. Possible PHI exposure risk — requires human review. Prototype only, not a compliance determination.'
const FIRST_NAME_NOTE =
  'First name only. Treated as low concern in this prototype: informational, 0 points, no effect on the risk score. Worth a manual check only if paired with other identifiers.'
const PROVIDER_NOTE =
  'Provider name detected. May add clinical context but is not necessarily a patient identifier. Flagged for manual review, not scored as a direct patient identifier.'

function detectNames(text) {
  const out = []

  for (const name of SYNTHETIC_NAMES) {
    const re = new RegExp(`\\b${name}\\b`, 'g')
    for (const m of finditer(re, text)) {
      out.push(match(m[0], m.index, 1, 'Names', SEVERITY.QUASI, FULL_NAME_NOTE))
    }
  }

  const greetingRe = /\b(?:Hi|Hello|Dear)\s+([A-Z][a-zA-Z'-]+(?:\s[A-Z][a-zA-Z'-]+)?)/g
  for (const m of finditer(greetingRe, text)) {
    const nameText = m[1]
    const nameIndex = m.index + m[0].indexOf(nameText)
    if (out.some((o) => o.index === nameIndex)) continue // already caught by synthetic list
    const isFullName = nameText.trim().includes(' ')
    out.push(
      match(
        nameText,
        nameIndex,
        1,
        'Names',
        isFullName ? SEVERITY.QUASI : SEVERITY.INFO,
        isFullName ? FULL_NAME_NOTE : FIRST_NAME_NOTE
      )
    )
  }

  const providerRe = /\bDr\.\s+[A-Z][a-zA-Z'-]+\b/g
  for (const m of finditer(providerRe, text)) {
    out.push(match(m[0], m.index, 1, 'Provider reference (contextual)', SEVERITY.CONTEXTUAL, PROVIDER_NOTE))
  }

  return out
}

function detectVehicleId(text) {
  const re = /\b(?:plate|VIN)[:\s#]*([A-Z0-9-]{5,17})\b/gi
  return finditer(re, text).map((m) =>
    match(m[0], m.index, 12, 'Vehicle identifiers / license plates', SEVERITY.QUASI, 'Vehicle identifiers can be traced back to a registered owner.')
  )
}

function detectDeviceId(text) {
  const re = /\b(?:Serial\s*#|Device\s*ID)[:\s]*([A-Z0-9-]{4,})\b/gi
  return finditer(re, text).map((m) =>
    match(m[0], m.index, 13, 'Device identifiers / serial numbers', SEVERITY.QUASI, 'Device serial numbers can be linked to a specific patient\u2019s equipment record.')
  )
}

function detectOtherCode(text, existingMatches) {
  const re = /\b[A-Z]{2,}-?\d{3,}\b/g
  const out = []
  for (const m of finditer(re, text)) {
    const overlaps = existingMatches.some((o) => m.index < o.index + o.text.length && m.index + m[0].length > o.index)
    if (overlaps) continue
    out.push(match(m[0], m.index, 18, 'Any other unique identifying code', SEVERITY.QUASI, 'This looks like a possible identifier code, which can uniquely trace back to a person or record.'))
  }
  return out
}

// --- Sensitive context (not one of the 18) -----------------------------

function detectSensitiveContext(text) {
  const out = []
  const specialtyRe = new RegExp(`\\b(${CLINICAL_SPECIALTIES.join('|')})\\b(?:\\s+(consultation|visit|appointment))?`, 'gi')
  for (const m of finditer(specialtyRe, text)) {
    out.push(match(m[0], m.index, null, SENSITIVE_CONTEXT_LABEL, SEVERITY.QUASI, 'Clinical specialty or condition terms can reveal a diagnosis or treatment context when combined with identifying details.'))
  }
  const genericRe = new RegExp(`\\b(${GENERIC_SENSITIVE_TERMS.join('|')})\\b`, 'gi')
  for (const m of finditer(genericRe, text)) {
    const overlaps = out.some((o) => m.index < o.index + o.text.length && m.index + m[0].length > o.index)
    if (overlaps) continue
    out.push(match(m[0], m.index, null, SENSITIVE_CONTEXT_LABEL, SEVERITY.CONTEXTUAL, 'Generic clinical terms add sensitive context that increases risk when paired with a name or date.'))
  }
  return out
}

function removeOverlaps(matches) {
  const sorted = [...matches].sort((a, b) => a.index - b.index || b.text.length - a.text.length)
  const result = []
  let lastEnd = -1
  for (const m of sorted) {
    const start = m.index
    const end = m.index + m.text.length
    if (start >= lastEnd) {
      result.push(m)
      lastEnd = end
    }
  }
  return result
}

export function detectAll(text) {
  if (!text || !text.trim()) return []

  const coreMatches = [
    ...detectNames(text),
    ...detectGeographic(text),
    ...detectDates(text),
    ...detectFax(text),
    ...detectTelephone(text),
    ...detectEmail(text),
    ...detectSSN(text),
    ...detectMRN(text),
    ...detectHealthPlanBeneficiary(text),
    ...detectAccountNumber(text),
    ...detectLicenseCertificate(text),
    ...detectVehicleId(text),
    ...detectDeviceId(text),
    ...detectURL(text),
    ...detectIPAddress(text),
    ...detectSensitiveContext(text),
  ]

  const deduped = removeOverlaps(coreMatches)
  const otherCodes = detectOtherCode(text, deduped)

  return removeOverlaps([...deduped, ...otherCodes]).sort((a, b) => a.index - b.index)
}
