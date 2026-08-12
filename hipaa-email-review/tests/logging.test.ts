/** @synthetic-data-only — anonymized values only, per AGENTS.md § Prohibited Actions. */
import { describe, expect, it } from 'vitest';
import { Writable } from 'node:stream';
import { createLogger, maskEmail } from '../src/server/logging/logger.ts';

function captureLogs(write: (line: string) => void): Writable {
  return new Writable({
    write(chunk, _encoding, callback) {
      write(String(chunk));
      callback();
    },
  });
}

describe('AGENTS.md § Logging — pino with data masking', () => {
  it('redacts every PHI-bearing field instead of writing it', () => {
    const lines: string[] = [];
    const logger = createLogger({ level: 'info', destination: captureLogs((line) => lines.push(line)) });

    logger.info(
      {
        draft: 'Hi Testpatient Alpha, your cardiology visit is confirmed.',
        recipientEmail: 'patient-id-test-001@example.invalid',
        subject: 'Your lab results are ready',
        payload: { location: 'Kenstrel Clinic' },
        riskTier: 'High',
      },
      'draft reviewed',
    );

    const output = lines.join('');
    expect(output).not.toContain('Testpatient Alpha');
    expect(output).not.toContain('patient-id-test-001@example.invalid');
    expect(output).not.toContain('Kenstrel Clinic');
    expect(output).toContain('[REDACTED]');
    // Non-PHI operational metadata still reaches the log.
    expect(output).toContain('High');
  });

  it('masks the local part when an address must appear in an ops log', () => {
    expect(maskEmail('patient-id-test-001@example.invalid')).toBe('***@example.invalid');
    expect(maskEmail('not-an-address')).toBe('[REDACTED]');
  });
});
