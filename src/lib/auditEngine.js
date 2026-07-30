// HIPAA Shield — deterministic, client-side "audit" rules engine.
// This is NOT a real ML/NLP PHI classifier — it's a regex/string-matching
// demo of a detection UX for a sales/concept prototype.

export const CATEGORIES = {
  PATIENT_IDENTIFIER: 'Patient Identifier',
  CLINICAL_TERM: 'Clinical Specialty / Sensitive Term',
  DATE: 'Identifiable Date',
  CONTACT: 'Contact Info',
}

const PLACEHOLDERS = {
  [CATEGORIES.PATIENT_IDENTIFIER]: '[PATIENT NAME]',
  [CATEGORIES.CLINICAL_TERM]: '[CLINICAL SPECIALTY]',
  [CATEGORIES.DATE]: '[DATE]',
  [CATEGORIES.CONTACT]: '[CONTACT INFO]',
}

const RISK_COPY = {
  [CATEGORIES.PATIENT_IDENTIFIER]:
    'A patient name alongside clinical context increases re-identification risk under HIPAA Safe Harbor guidance.',
  [CATEGORIES.CLINICAL_TERM]:
    'This clinical specialty or sensitive condition term can reveal a patient\u2019s diagnosis or treatment when combined with identifying details.',
  [CATEGORIES.DATE]:
    'Specific dates (visits, birthdates) are considered identifiers under HIPAA Safe Harbor and should be generalized or removed.',
  [CATEGORIES.CONTACT]:
    'Direct contact information sent over unsecured channels can expose patients to phishing or identity-linkage risk.',
}

// ~30 common first names spanning multiple cultural backgrounds, used to
// catch standalone first-name mentions (as opposed to "any capitalized word").
export const COMMON_FIRST_NAMES = [
  'John', 'James', 'Robert', 'Michael', 'William', 'David', 'Richard',
  'Maria', 'Elena', 'Sofia', 'Carlos', 'Diego', 'Luis',
  'Eleni', 'Dimitri', 'Demetrius', 'Nikos',
  'Wei', 'Li', 'Ming', 'Chen', 'Yuki', 'Haruto',
  'Fatima', 'Amara', 'Ahmed', 'Omar', 'Priya', 'Anjali', 'Raj',
  'Emma', 'Olivia', 'Sarah', 'Grace',
]

const FULL_NAME_RE = /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g

function buildFirstNameRegex() {
  const names = COMMON_FIRST_NAMES.join('|')
  return new RegExp(`\\b(?:${names})\\b`, 'g')
}

const SPECIALTY_TERMS = [
  'cardiology', 'oncology', 'cancer', 'HIV', 'therapy', 'biopsy', 'psychiatry',
]

function buildSpecialtyRegex() {
  const terms = SPECIALTY_TERMS.join('|')
  return new RegExp(`\\b(?:${terms})\\b`, 'gi')
}

const DATE_RE = /\b\d{1,2}\/\d{1,2}(?:\/\d{4})?\b|\b(19|20)\d{2}\b/g
const PHONE_RE = /\b(?:\(\d{3}\)\s?|\d{3}[-.\s])\d{3}[-.\s]?\d{4}\b/g
const EMAIL_RE = /\b[\w.+-]+@[\w-]+\.[A-Za-z]{2,}\b/g

function collectMatches(text, regex, category) {
  const matches = []
  let m
  const re = new RegExp(regex)
  while ((m = re.exec(text)) !== null) {
    matches.push({ text: m[0], category, index: m.index })
    if (m[0].length === 0) re.lastIndex++
  }
  return matches
}

function removeOverlaps(matches) {
  // Sort by index, then keep the earliest-starting, longest match when overlapping.
  const sorted = [...matches].sort((a, b) => a.index - b.index || b.text.length - a.text.length)
  const result = []
  let lastEnd = -1
  for (const match of sorted) {
    const start = match.index
    const end = match.index + match.text.length
    if (start >= lastEnd) {
      result.push(match)
      lastEnd = end
    }
  }
  return result
}

export function auditText(text) {
  if (!text || !text.trim()) {
    return { matches: [], riskLevel: 'COMPLIANT', sanitizedText: text || '' }
  }

  const rawMatches = [
    ...collectMatches(text, FULL_NAME_RE, CATEGORIES.PATIENT_IDENTIFIER),
    ...collectMatches(text, buildFirstNameRegex(), CATEGORIES.PATIENT_IDENTIFIER),
    ...collectMatches(text, buildSpecialtyRegex(), CATEGORIES.CLINICAL_TERM),
    ...collectMatches(text, DATE_RE, CATEGORIES.DATE),
    ...collectMatches(text, PHONE_RE, CATEGORIES.CONTACT),
    ...collectMatches(text, EMAIL_RE, CATEGORIES.CONTACT),
  ]

  const matches = removeOverlaps(rawMatches)

  const hasIdentifier = matches.some((m) => m.category === CATEGORIES.PATIENT_IDENTIFIER)
  const hasSpecialtyOrDate = matches.some(
    (m) => m.category === CATEGORIES.CLINICAL_TERM || m.category === CATEGORIES.DATE
  )

  let riskLevel = 'COMPLIANT'
  if (hasIdentifier && hasSpecialtyOrDate) {
    riskLevel = 'CRITICAL'
  } else if (matches.length > 0) {
    riskLevel = 'WARNING'
  }

  const sanitizedText = buildSanitizedText(text, matches)

  return { matches, riskLevel, sanitizedText }
}

function buildSanitizedText(text, matches) {
  const sorted = [...matches].sort((a, b) => a.index - b.index)
  let result = ''
  let cursor = 0
  for (const match of sorted) {
    result += text.slice(cursor, match.index)
    result += PLACEHOLDERS[match.category] || '[REDACTED]'
    cursor = match.index + match.text.length
  }
  result += text.slice(cursor)
  return result
}

export function riskExplanation(category) {
  return RISK_COPY[category] || 'This value may constitute identifiable information under HIPAA guidance.'
}
