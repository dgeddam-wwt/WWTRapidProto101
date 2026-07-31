export const SAMPLE_DRAFTS = [
  {
    id: 'high',
    label: 'High Risk (Full PHI)',
    description: 'Name, specialty, date, phone, email, MRN',
    text: `Hi John Smith,
I'm reaching out to confirm your cardiology consultation with Dr. Evans on July 22, 2026.
Please remember to bring your current medication list.
If you need to reschedule, call us at 415-555-0199 or email careteam@kenstrel.example.
Your patient ID is MRN-884392.`,
  },
  {
    id: 'medium',
    label: 'Medium Risk (Full Name / Date)',
    description: 'Full patient name + date, no direct contact/record identifier',
    text: `Hi John Smith, just a note about your appointment on July 22, 2026. See you then!`,
  },
  {
    id: 'safe',
    label: 'Safe Example',
    description: 'No identifiable content',
    text: `Hello, please log into your patient portal to review your upcoming appointment details.
Contact our office with any questions.`,
  },
]
