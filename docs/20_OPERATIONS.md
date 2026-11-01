# Reliability release and recovery runbook

2026-11-01. Applies to the current single-shop deployment. Public multi-shop signup is not implemented by this release. Owner approved starting the roadmap and chose the existing WhatsApp service for future signup verification.

## Before deployment

- Keep a tested encrypted backup outside the app host. The tools below have been rehearsed only on synthetic test data; production backups/off-host scheduling must be configured by the operator.
- Real deployment: DUKAAN_MODE=shop and DUKAAN_DB_FILE on a persistent disk. Fictional standalone demo: DUKAAN_MODE=demo without a real database file. A production process lacking durable shop storage now refuses to start unless explicitly a demo. The test-only memory override must never be configured for production.
- Existing owner rows receive an additive auth_version migration. Legacy cookies are intentionally invalidated once. Changing password or choosing confirmed “Sab device se logout” increments this version, invalidating all old device cookies.
- New reminder_deliveries table retains pending/sent/unknown reservations per reviewed pay token. Backups include the entire SQLite snapshot, including owners, delivery reservations, void history, pay tokens and audit events. Do not drop this table during recovery.
- Generated first-run setup code now persists beside the database as setup-code.txt, with exclusive creation/private file mode. SETUP_CODE remains an operator override. Existing configured shop ownership is not reset. Update any old instructions that point to a local .data path on Render.
- Deploy code and retain prior deployment identifier. App rollback alone does not undo migrations. Test on a copied database first. CI runs pnpm verify on push/PR; a workflow file in the repo does not prove a hosted CI run passed.

## Encrypted backup

Set DUKAAN_BACKUP_PASSPHRASE (16+ characters, use a long random value) in the operator environment or private .env, never in chat, a command argument or a commit. Protect and retain that passphrase separately from the backup. Losing it makes the backup unreadable.

Run `pnpm db:backup create <database-file> <new-backup-file>`. Example paths may be under .data locally; use the real persistent source path on the host. Destination parent must already exist. An existing destination is never overwritten. Keep backups outside git. The snapshot uses SQLite's backup API so committed WAL records are included; it validates integrity and foreign keys before encrypting with AES-256-GCM and a per-file scrypt salt. The envelope version is 1. Temporary plaintext files are cleaned on normal failure/success; operator temp directories and host access must remain private. A process crash may leave temporary plaintext; clean up only identified operation-owned temp directories after investigation.

Copy the encrypted output to protected off-host storage. Proposed pilot schedule: daily, plus before every migration; retain seven daily copies initially, review retention with the owner, and rehearse restore weekly. This schedule is a requirement, not an installed scheduler. Suggested pilot recovery objectives are at most 24 hours of data loss and restoration within four hours; these are unmeasured targets until a real drill. SQLite-file encryption does not replace host/disk access controls. This backup does not include env secrets or the separate WhatsApp device session.

## Restore drill / incident recovery

1. Keep the live database untouched. Run `pnpm db:backup restore <backup-file> <new-database-file>` into a new path. Wrong passphrase, tampering, malformed files and failed integrity checks must fail before a restored target is published. Publication is exclusive and requires a filesystem supporting hard links. Restore never replaces an existing target.
2. Stop/quiesce app traffic before switching files. Reconcile any writes after snapshot time. Validate customer count, balances, voids, audit history, owner login and reminder delivery statuses in an isolated instance. Older pre-migration snapshots are permitted if the baseline tables exist; opening through the current store applies additive migrations. Rehearse that migration before serving traffic.
3. **Rotate PROPOSAL_SECRET before the restored database serves traffic.** Old snapshots can contain older owner auth versions: keeping the old signing secret could resurrect previously revoked sessions. Rotation invalidates historical cookies and proposal cards. Owners must sign in again; pending proposals must be recreated. Keep new secret outside the backup/repo/chat.
4. Reconcile pending/unknown reminder deliveries manually. Never automatically retry them after restart or restore: the WhatsApp service may already have sent them. New reviewed drafts can send intentionally; external exactly-once delivery is not guaranteed.
5. Change DUKAAN_DB_FILE only after checks. Restart and test persistence, login, one confirmed synthetic/private test entry and an owner-authorized test send. Do not send to any real number without explicit instruction. Record observed results, not just that the server started.
6. If checks fail, keep traffic closed, preserve evidence and return to the prior known-good database/deploy pair. Never delete the only original ledger or restore over it.

## Request and reminder behavior

Client requests time out after 30 seconds including response bodies. No money write or send is automatically retried. An uncertain money write must be checked in the khata before further action. Retrying the same signed proposal uses its existing idempotency identity.

An expired reminder or one whose amount differs from the live balance must be refreshed and explicitly reconfirmed. Concurrent/repeated sends of the same reviewed draft reserve a durable send record; a known success is replayed. A pending or uncertain provider result blocks further send for that draft. Manual WhatsApp fallback is blocked for that uncertain draft too; check WhatsApp first. A freshly reviewed draft has a new identity and can intentionally be sent again.

## Live release checklist (not yet verified)

- Correct production mode, durable disk and signing secret; bootstrap remains private.
- Restart preserves owner and ledger; copied old cookies fail after password reset/logout-all.
- Recovery drill succeeds using an off-host encrypted backup and rotated signing secret.
- WhatsApp pairing and service health observed; real code/reminder only to explicitly authorized test recipient.
- No secrets, recipient numbers or message text in diagnostics. No automatic resend on timeout.
- Mobile screen/keyboard/reduced motion checks, pnpm verify result, actual CI run and deployed URL recorded.
- Only then begin the next public-account milestone. Existing OTP login is owner-only; registration needs separate browser-bound proof, identity uniqueness and tenant creation/isolation tests.
