/**
 * Identifier-free replacement drafts, one per detected purpose.
 *
 * These are regenerated messages rather than find-and-replace redactions, so no
 * residual identifier can survive. Every template hands off to the authenticated
 * portal instead of restating details in the email body (AGENTS.md § HIPAA 2 —
 * Minimum Necessary).
 */

import type { EmailPurpose } from './types.ts';

export const SAFE_TEMPLATES: Readonly<Record<EmailPurpose, string>> = Object.freeze({
  confirmation: `Hello,

This message confirms your upcoming appointment with our office.

Please sign in to your patient portal to review the date, time, location, and provider details.

If anything needs to change, contact us through the portal.`,

  reminder: `Hello,

This is a reminder about your upcoming appointment with our office.

Please sign in to your patient portal for the details and any preparation steps.

Contact us through the portal with any questions.`,

  followup: `Hello,

This message is regarding a follow-up related to your recent visit.

Please sign in to your patient portal to view updates and next steps.

Contact us through the portal with any questions.`,

  reschedule: `Hello,

We need to update the timing of your upcoming appointment.

Please sign in to your patient portal to view available times and confirm a new slot.`,

  previsit: `Hello,

Preparation information for your upcoming appointment is now available.

Please sign in to your patient portal to review what to bring and how to prepare.`,

  billing: `Hello,

This message is regarding your account with our office.

Please sign in to your patient portal to review your statement and payment options securely.`,

  test_result: `Hello,

New results are available for you to review.

Please sign in to your patient portal using the secure link we send with this notification. Results are never included in email.

Contact us through the portal if you have questions about what you see.`,

  general: `Hello,

This message is regarding your care with our office.

Please sign in to your patient portal for additional details.

Contact us through the portal with any questions.`,
});

export function safeTemplateFor(purpose: EmailPurpose): string {
  return SAFE_TEMPLATES[purpose];
}
