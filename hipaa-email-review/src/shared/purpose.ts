import { MESSAGE_TYPE, type EmailPurpose, type MessageType, type PurposeClassification } from './types.ts';

interface PurposeRule {
  readonly purpose: EmailPurpose;
  readonly label: string;
  readonly messageType: MessageType;
  readonly cues: readonly string[];
}

/**
 * Purpose drives two things: which identifier-free template is generated, and
 * which dispatch rules apply (schedule vs test_result, AGENTS.md § HIPAA 1 & 2).
 * Ordered most specific first.
 */
const RULES: readonly PurposeRule[] = Object.freeze([
  {
    purpose: 'test_result',
    label: 'Lab / test results',
    messageType: MESSAGE_TYPE.TEST_RESULT,
    cues: ['lab result', 'test result', 'results are', 'your results', 'bloodwork', 'panel came', 'pathology', 'imaging read'],
  },
  {
    purpose: 'reschedule',
    label: 'Reschedule request',
    messageType: MESSAGE_TYPE.SCHEDULE,
    cues: ['reschedule', 'move your appointment', 'new time', 'cancel your appointment', 'change your appointment'],
  },
  {
    purpose: 'previsit',
    label: 'Pre-visit instructions',
    messageType: MESSAGE_TYPE.SCHEDULE,
    cues: ['pre-visit', 'previsit', 'before your visit', 'bring your', 'fasting', 'prepare for', 'what to bring'],
  },
  {
    purpose: 'followup',
    label: 'Follow-up',
    messageType: MESSAGE_TYPE.SCHEDULE,
    cues: ['follow-up', 'follow up', 'checking in', 'after your visit', 'next steps'],
  },
  {
    purpose: 'billing',
    label: 'Billing / account',
    messageType: MESSAGE_TYPE.SCHEDULE,
    cues: ['balance', 'invoice', 'statement', 'payment', 'copay', 'bill'],
  },
  {
    purpose: 'confirmation',
    label: 'Appointment confirmation',
    messageType: MESSAGE_TYPE.SCHEDULE,
    cues: ['confirm', 'confirming', 'scheduled for', 'is booked'],
  },
  {
    purpose: 'reminder',
    label: 'Appointment reminder',
    messageType: MESSAGE_TYPE.SCHEDULE,
    cues: ['reminder', 'reminding', 'upcoming appointment', 'do not forget', "don't forget"],
  },
]);

const FALLBACK: PurposeClassification = Object.freeze({
  purpose: 'general',
  label: 'General patient outreach',
  messageType: MESSAGE_TYPE.SCHEDULE,
});

/** Deterministic keyword classification of the draft's purpose. */
export function classifyPurpose(text: string): PurposeClassification {
  const haystack = text.toLowerCase();
  const rule = RULES.find((r) => r.cues.some((cue) => haystack.includes(cue)));
  if (rule === undefined) return FALLBACK;
  return { purpose: rule.purpose, label: rule.label, messageType: rule.messageType };
}
