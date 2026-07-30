// Deterministic, client-side purpose classification via keyword signals.
// First matching purpose wins; falls back to General outreach.

export const PURPOSES = [
  {
    id: 'confirmation',
    label: 'Appointment confirmation',
    keywords: ['confirm', 'confirming', 'scheduled', 'booked', "you're all set"],
  },
  {
    id: 'reminder',
    label: 'Appointment reminder',
    keywords: ['reminder', 'upcoming', "don't forget", 'coming up'],
  },
  {
    id: 'followup',
    label: 'Follow-up',
    keywords: ['follow up', 'following up', 'after your visit', 'results', 'next steps'],
  },
  {
    id: 'reschedule',
    label: 'Reschedule / cancel',
    keywords: ['reschedule', 'cancel', 'move your appointment', 'change your time'],
  },
  {
    id: 'previsit',
    label: 'Pre-visit instructions',
    keywords: ['bring', 'prepare', 'fasting', 'arrive early', 'paperwork', 'before your visit'],
  },
  {
    id: 'billing',
    label: 'Billing / statement',
    keywords: ['balance', 'payment', 'invoice', 'statement', 'amount due'],
  },
  {
    id: 'general',
    label: 'General outreach',
    keywords: [],
  },
]

export function classifyPurpose(text) {
  if (!text || !text.trim()) return { purposeId: 'general', matchedKeyword: null }

  const lower = text.toLowerCase()
  for (const purpose of PURPOSES) {
    if (purpose.id === 'general') continue
    for (const keyword of purpose.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return { purposeId: purpose.id, matchedKeyword: keyword }
      }
    }
  }
  return { purposeId: 'general', matchedKeyword: null }
}

export function getPurposeLabel(purposeId) {
  return PURPOSES.find((p) => p.id === purposeId)?.label || 'General outreach'
}
