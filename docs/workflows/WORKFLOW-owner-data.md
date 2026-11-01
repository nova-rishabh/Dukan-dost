# WORKFLOW: owner business data export/import

Version 1; 2026-11-01. Implemented under the owner's instruction to complete the remaining roadmap. Security boundaries reviewed separately; final integration verification belongs to the parent build log.

Actor: authenticated shop owner. Screens: `/shop/data`; owner-only APIs `/api/shop/export`, `/api/shop/import/preview`, `/api/shop/import`.

1. Owner explicitly downloads versioned JSON. A consistent business snapshot contains customers, aliases, entries/voids, measured stock and movement history. It excludes customer phones, UPI destination, owner credentials, registration proofs, pay links, delivery tokens and audit payloads. Original entry text can contain personal information, so the UI explains that the file is private.
2. Owner selects a file smaller than 1.9 MB. Client parses JSON; server limits the body to 2 MB, validates version/strict fields, integer money and quantities, unique IDs, customer/product foreign references, chronological stock sums, negative counts and reversal constraints. Failure returns a typed error and changes nothing.
3. Preview returns row counts, source shop label, non-void credit and payment totals with direction and amount words. A ten-minute HMAC proof binds the exact file digest, current target business fingerprint, authenticated shop and credential version. No data is imported at preview.
4. Owner types `import records` and confirms after a fresh WhatsApp login or current-password verification. Server checks the proof and performs the import atomically with authorization-version and business-fingerprint guards. IDs are remapped to new IDs owned by the current shop. Existing business records, shop profile and credentials are preserved; matching names are separate people, never automatic merges.
5. An exact content digest can be imported only once per shop. Repeated confirmations return the previous result without duplication. A changed shop rejects a stale preview; a changed file requires a new preview. File content changed intentionally can create separate records; the UI warns about duplicates. Stock units/history remain as exported; money never infers stock.

Observable failures: loading/busy, invalid file, expired preview, changed data, reauthentication required, success or already imported. The shared API deadline is 30 seconds; the client does not automatically retry a write. After an uncertain result the owner checks the records; same-content retries remain safe. A failure before commit leaves no partial records. A failure after commit can be reconciled by the stored content digest.

Export/import are user-controlled business transfers, not an encrypted database backup/restore service. Downloaded files and operator backups remain outside the application's erasure scope. No authentication state, saved-number consent or payment destination is restored from a file.

Tests: both stores transfer/remap/duplicate/stale/nonmutation boundaries, SQLite transaction rollback/foreign keys, API cross-shop/file-proof binding, raw-phone/credential redaction, exact paise import, browser reviewed import, and activity redaction. See `tests/unit/data-lifecycle*.test.ts`, `tests/e2e/zz-data-lifecycle.spec.ts`.
