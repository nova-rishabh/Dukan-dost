/**
 * Retention rule shown to the owner. Raw sentences that were never confirmed ("proposal_shown")
 * are kept for 30 days for rehearsal and debugging, then dropped. Confirmed entries keep their
 * sentence until the owner erases the shop's data. Audio is never stored.
 */
export const UNCONFIRMED_RETENTION_DAYS = 30;
export const UNCONFIRMED_RETENTION_MS = UNCONFIRMED_RETENTION_DAYS * 24 * 3600_000;
export const UNCONFIRMED_AUDIT_KIND = "proposal_shown";

export function retentionCutoff(at: string): string {
  return new Date(new Date(at).getTime() - UNCONFIRMED_RETENTION_MS).toISOString();
}
