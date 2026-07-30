// One PHI-free, purpose-adaptive template per detected email purpose.
// These are regenerated messages, not find-and-replace substitutions.

export const SAFE_TEMPLATES = {
  confirmation: `Hello,
This message is to confirm your upcoming healthcare appointment.
Please log into your patient portal to review the date, time, and any preparation details.
If you need to make changes, contact our office through the portal or the number on file.`,

  reminder: `Hello,
This is a reminder about your upcoming healthcare appointment.
Please log into your patient portal for the details and how to prepare.
Contact our office through the portal if you have any questions.`,

  followup: `Hello,
This message is regarding a follow-up related to your recent healthcare appointment.
Please log into your patient portal to view updates, results, or next steps.
Contact our office through the portal if you have any questions.`,

  reschedule: `Hello,
We need to update the timing of your upcoming healthcare appointment.
Please log into your patient portal to view available times and confirm a new slot.`,

  previsit: `Hello,
This message contains preparation information for your upcoming appointment.
Please log into your patient portal to review what to bring and how to prepare.`,

  billing: `Hello,
This message is regarding your account.
Please log into your patient portal to review your statement details and payment options securely.`,

  general: `Hello,
This message is regarding your care with our office.
Please log into your patient portal for additional details.
Contact us through the portal if you have any questions.`,
}

export function getSafeTemplate(purposeId) {
  return SAFE_TEMPLATES[purposeId] || SAFE_TEMPLATES.general
}
