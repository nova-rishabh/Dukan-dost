# Visual review (2026-11-01)

Method: Playwright screenshots of the production build at 390 px and 1440 px (`pnpm shots`, files in `docs/screenshots/`), read one by one, then the 14-point slop checklist per screen. Points 1 to 12 are the questions in `03_DESIGN_SYSTEM.md` section 14. Points 13 and 14 are project checks added by the build brief: (13) only palette colours and the three local fonts, enforced by `pnpm check:slop`; (14) Hindi text has no clipped matras and no broken glyphs.

Result key: pass, or a finding with what was done.

| # | Check | Landing | Shop home | Customer page | Pay page | /try |
|---|---|---|---|---|---|---|
| 1 | Not swappable for another product | pass (stamped parchi in the hero) | pass | pass (bahi page) | pass | pass |
| 2 | No cream, serif+terracotta, neon-on-black, purple gradient | pass | pass | pass | pass | pass |
| 3 | No uniform soft-shadow rounded cards | pass (hard offset, torn edge) | pass | pass | pass | pass |
| 4 | No all-caps eyebrow, middle-dot meta, arrow on buttons | pass | pass | pass | pass | pass |
| 5 | No single-word headline accent | pass | pass | pass | pass | pass |
| 6 | No fade-and-slide-in sections | pass (none exist) | pass | pass | pass | pass |
| 7 | No fake 01, 02, 03 numbering | pass | pass | pass | pass | pass |
| 8 | One memorable moment (the stamp) | pass | pass | pass | pass | pass |
| 9 | Tabular numbers, Indian grouping, digits and words on confirmations | pass | pass | pass | pass (₹1,700) | pass |
| 10 | Works one-handed at 390 px, reduced motion | pass at 390 px; reduced motion covered by e2e script 9; outdoor glare not tested | pass (Bolo and Likho in the sticky bottom bar) | pass | pass | pass |
| 11 | Specific Hinglish copy, matching verbs | pass | pass | pass | pass | pass |
| 12 | Shopkeeper recognises bahi, parchi, stamp | pass | pass | pass | n/a (customer-facing, QR) | pass |
| 13 | Palette and fonts only | pass | pass | pass | pass | pass |
| 14 | Devanagari renders cleanly | pass | pass | pass | n/a (no Devanagari on screen) | pass |

## Findings and what changed

1. Yatra One draws the letter z like a 3 ("awaa3"). Display headings were reworded to avoid z ("Teen kaam, ek bol mein", "Sabse jyada baaki"). Body text uses Hind, which is unaffected.
2. After Likh do, the stamp covered the Badlo button. Actions are now removed once the entry is stamped.
3. The comparison table scrolls sideways at 390 px. It is a labelled, keyboard-focusable region (axe: no serious or critical issues). Left as is.
4. The header wraps to three rows at 390 px (wordmark, tag, two buttons). Acceptable but not elegant; logged for the owner as a polish item.
5. Full-page screenshots show the toast overlapping the sample clip buttons because the toast is fixed to the viewport. In a real viewport it sits above the sticky Bolo bar. Not a defect.

## Not verified here

- A real mid-range Android phone, outdoor glare, iOS Safari. These need the owner's device (see `SETUP_FOR_RISHABH.md`, step 10).
- Lighthouse LCP (`06_TEST_PLAN` section 1) was not measured.
- React Bits components were not installed (registry access is outside the build's allowed network); Count Up is a small own implementation (`CountUp.tsx`). Recorded in `04_DECISIONS.md` (ADR-021).
