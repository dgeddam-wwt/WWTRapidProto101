export const SCENARIOS = [
  {
    label: 'High Risk (Full PHI)',
    description: 'Name + specialty + date + phone',
    text: "Hi John Smith, I'm reaching out to confirm your cardiology consultation with Dr. Evans on 07/22/2026. Please call us at 415-555-0199.",
  },
  {
    label: 'Medium Risk (Full Name / Date)',
    description: 'Full patient name + bare date, no direct contact/record identifier',
    text: 'Confirming appointment for John Smith on 10/12. Please remember your chart.',
  },
  {
    label: 'Safe Example',
    description: 'No identifiable content',
    text: 'Thank you for choosing our clinic. Please log into your secure patient portal to view your upcoming appointment schedule.',
  },
]
