/**
 * @synthetic-data-only
 *
 * Anonymized demonstration fixtures. Nothing here is real or realistic PHI/PII:
 * - patient identifiers use the `Patient_ID_Test_00n` convention
 * - person names use the reserved `Testpatient <Word>` / `Dr. Testprovider` forms
 * - telephone numbers use the reserved 555-555-01xx range
 * - email addresses use the reserved `.invalid` TLD
 * `npm run audit:phi` enforces every rule above.
 */

import type { MessageType } from '../types.ts';

export interface SyntheticScenario {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly patientTestId: string;
  readonly draft: string;
}

export const SYNTHETIC_SCENARIOS: readonly SyntheticScenario[] = Object.freeze([
  {
    id: 'high',
    label: 'High Risk (Full PHI)',
    description: 'Name + specialty + provider + date + MRN + contact details',
    patientTestId: 'Patient_ID_Test_001',
    draft:
      "Hi Testpatient Alpha, I'm confirming your cardiology consultation with Dr. Testprovider on 07/22/2026. " +
      'MRN: 4471902. Please bring your medication list. To reschedule, call us at 555-555-0100 or email frontdesk@clinic.invalid.',
  },
  {
    id: 'medium',
    label: 'Medium Risk (Full Name / Date)',
    description: 'Full patient name + appointment date, no direct identifier',
    patientTestId: 'Patient_ID_Test_002',
    draft: 'Confirming the appointment for Testpatient Bravo on 10/12. Please arrive fifteen minutes early.',
  },
  {
    id: 'results',
    label: 'Results In Email Body',
    description: 'Clinical values pasted into the body — must move behind the portal',
    patientTestId: 'Patient_ID_Test_003',
    draft:
      'Hi Testpatient Charlie, your lab results are back and your cholesterol is elevated. ' +
      'Dr. Testprovider reviewed the panel on 08/01/2026 and wants to adjust your prescription.',
  },
  {
    id: 'safe',
    label: 'Safe Example',
    description: 'No identifiers — generic portal handoff',
    patientTestId: 'Patient_ID_Test_004',
    draft:
      'Thank you for choosing our clinic. Please sign in to your secure patient portal to review your upcoming appointment details.',
  },
]);

export interface SyntheticDispatch {
  readonly messageType: MessageType;
  readonly recipientEmail: string;
  readonly payload?: Readonly<Record<string, string>>;
}

export const SYNTHETIC_DISPATCHES: Readonly<Record<'schedule' | 'testResult', SyntheticDispatch>> = Object.freeze({
  schedule: {
    messageType: 'schedule',
    recipientEmail: 'patient-id-test-001@example.invalid',
    payload: Object.freeze({
      date: '2026-07-22',
      time: '10:30 AM',
      location: 'Kenstrel Clinic, Suite 200',
      providerName: 'Dr. Testprovider',
    }),
  },
  testResult: {
    messageType: 'test_result',
    recipientEmail: 'patient-id-test-003@example.invalid',
  },
});
