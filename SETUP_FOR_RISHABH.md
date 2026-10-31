# Setup for Rishabh

The app already runs with no keys: `pnpm install`, then `pnpm dev`. Typed input, the five sample clips, the pay page and reminders all work, and a "Demo mode" tag shows. These steps add the real services and finish the content only you can make.

Legend: **[you]** needs your account or hands. **[done]** already built and verified here.

## Step 1 [you]: copy the env file

```bash
copy .env.example .env.local
```

Open `.env.local` in an editor. Never paste keys into chat or commit this file (it is git-ignored).

## Step 2 [you]: get the keys

- `ELEVENLABS_API_KEY`: ElevenLabs, Profile, API keys.
- `GEMINI_API_KEY`: Google AI Studio, Get API key.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: Supabase project, Project settings, API. The service role key stays server-side only.
- `DEMO_UPI_VPA`: leave empty for the fake demo id, or a UPI id you own for the later test.
- `DEMO_SHOP_ID`: leave empty (uses the seeded shop id).
- `NEXT_PUBLIC_APP_URL`: after step 9.

## Step 3 [you]: create the database

In the Supabase SQL editor run these two files, in this order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/seed.sql`

The seed creates the fictional shop with 8 customers (two Sharmas).

## Step 4: check which services are active

```bash
pnpm setup:check
```

It lists missing variable names and says honestly which adapters are local. **[done]** locally it reports every adapter as local.

## Step 5 [you]: test the real services once

```bash
pnpm verify:live
```

It does a Scribe round trip, a Gemini structured-output call and a Supabase insert, repeat and void. Not verified yet: no keys existed during the build, so the vendor request shapes are covered only by mocked-HTTP tests. The facts used are in `docs/14_API_FACTS.md`; the model ids sit in `src/lib/config.ts` marked VERIFY.

## Step 6 [you]: make the sample clip audio

```bash
pnpm samples:generate
```

Writes `public/samples/*.mp3` (AI voices, labelled dramatisation in the app). For a truly noisy "Shor mein" clip mix noise in with ffmpeg (see `docs/06_TEST_PLAN.md` section 4).

## Step 7 [you]: voice-over and re-render the ad

```bash
pnpm ad:vo
pnpm ad:render
```

`ad:vo` makes the Hindi line with ElevenLabs (no cloning). The ad already renders without it. **[done]** a render exists at `deliverables/ad/out/dukaan-dost-ad-vertical.mp4`.

## Step 8 [you]: make shots 1 and 2 in ElevenLabs Flows

Open `deliverables/ad/FLOWS_PROMPTS.md`, paste each shot's prompts into the node chain it suggests, and save the results as `deliverables/ad/assets/clips/shot1.mp4` and `shot2.mp4`. Then run `pnpm ad:render` again. Keep the small "dramatisation" tag. Do not present AI footage as a real customer.

## Step 9 [you]: connect GitHub and Vercel, deploy

Create the GitHub repo and push (nothing was pushed by the build). In Vercel import it, set the env vars from step 2, deploy, then set `NEXT_PUBLIC_APP_URL` to the live URL and redeploy. Replace `{{APP_URL}}` in `deliverables/social/captions.md`, the post images and `deliverables/deck/index.html` (re-export `deck.pdf`).

## Step 10 [you]: test on a real Android phone

Open the live URL in Chrome: allow the mic, say the hero sentence, tap Likh do, open a customer, tap Yaad dilao (WhatsApp should open with the text), open the pay link and the UPI button. Check glare outdoors and one-handed use.

## Step 11 [you]: re-run the judge prompt

Apply `../ai_judge_prompt_v2.md` to the five final links in two AIs. Our own honest self-assessment is in `docs/13_SELF_REVIEW.md`.

## Step 12 [you]: submit the five links

Product (`/try`), website (landing), the three posts, the ad, the deck. Open each in a private window on mobile data first. Nothing here submits for you.
