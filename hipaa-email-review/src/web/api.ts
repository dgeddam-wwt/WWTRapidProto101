import type { DispatchResponse, ReviewResult } from '../shared/types.ts';
import type { DispatchRequest } from '../shared/minimumNecessary.ts';

export interface ApiError {
  readonly error: string;
  readonly field?: string;
  readonly rule?: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const detail = (data as ApiError | null)?.error ?? 'Request failed.';
    throw new Error(detail);
  }
  return data as T;
}

/** Reviews a draft server-side. The draft is never persisted or logged. */
export function reviewDraft(draft: string): Promise<ReviewResult> {
  return post<ReviewResult>('/api/review', { draft });
}

export function dispatchEmail(request: DispatchRequest | Record<string, unknown>): Promise<DispatchResponse> {
  return post<DispatchResponse>('/api/emails/dispatch', request);
}

export interface AuditVerifyResponse {
  readonly valid: boolean;
  readonly entryCount: number;
  readonly brokenAtSeq: number | null;
  readonly headHash: string;
  readonly entries: readonly {
    readonly timestamp: string;
    readonly recipient_id_hash: string;
    readonly message_type: string;
    readonly delivery_status: string;
    readonly seq: number;
    readonly transport: string;
    readonly entry_hash: string;
  }[];
}

export async function fetchAuditTrail(): Promise<AuditVerifyResponse> {
  const response = await fetch('/api/audit/verify', { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not read the audit trail.');
  return (await response.json()) as AuditVerifyResponse;
}
