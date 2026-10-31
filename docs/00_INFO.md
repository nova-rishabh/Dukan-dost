# Project info

## Identity
- **Name:** Dukaan Dost
- **Tagline:** बोलो, लिखो मत। (Bolo, likho mat.) / The ledger you talk to.
- **Event:** AI Builder Challenge, Roobaroo AI Camp, in association with Developers' Society, IIT Kharagpur. "One afternoon. One real product. One pitch."
- **Theme:** Local business (second fit: Money).
- **Owner:** Rishabh.

## Challenge facts (from the kick-off deck)
| Item | Detail |
|---|---|
| Timeline | Tonight: brainstorm and head start. Day 2 morning: games, agents and portfolio workshops. 13:30 build window opens. 16:00 submit and pitches begin. Each pitch 3 min plus 2 min jury questions. 17:30 winners and convocation |
| What to ship | A product, a website that sells it, 3 social posts, a video ad, a pitch deck. Upload to your Drive folder; put the 5 links in the P7 form |
| Workbook | Tab 1 ideas; Tabs 2-5 Gemini research and the Junior YC form; Tab 6 build with 5 prompts (start video shots first); Tabs 7-8 pitch and submit by 16:00 |
| Judging (100) | Problem and idea 20, Product works 25, Website/social/ad 20, Pitch and clarity 20, AI use and craft 15 |
| Jury | Juror 1: Prashant Sinha (founder, SixHats.ai; investor). Juror 2: Manan Khaneja (founder, Glace; ads background; IIT Kharagpur alumnus). Juror 3: an AI scoring every pitch on the same rubric |
| Prizes | ₹15,000 winner, ₹10,000 first runner-up, ₹5,000 second runner-up, plus Best Idea, Best Product, Best Presentation |
| Principle | A working product beats a pretty slide |

## What we have access to (relevant subset)
Only what this project needs. The full private inventory stays in your own file.
- **AI:** Claude (Pro, Claude Code), Google AI Pro (Gemini, AI Studio), ChatGPT/Codex, ElevenLabs, Vapi, LiveKit.
- **Build and host:** Vercel, Supabase, GitHub (with Student Pack), Doppler for secrets, Netlify, Render, n8n, Make, Razorpay, Stripe CLI, ngrok.
- **Design:** Canva (connected), Figma (connected), Adobe, React Bits, 21st.dev, Bootstrap Studio.
- **Media:** CapCut, Vrew, OBS, FFmpeg, ElevenLabs for voice-over.
- **Domains:** student-pack free domains available (Namecheap .me, Name.com, .tech); owned domains exist.
- **Not set up yet:** AWS and Azure config folders are empty.
- **Rule:** never paste keys in chat; read from Doppler or env at build time.

## Repository layout (planned)
```
dukaan-dost/
  README.md
  CLAUDE.md                 project rules for Claude sessions
  docs/                     this folder
  design/references/        reference board (screenshots)
  app/ ...                  Next.js app (created after approval)
  assets/sounds/            CC0 sound effects plus CREDITS.json (for videos)
  tests/fixtures/           20 spoken-sentence fixtures
```

## Glossary
| Term | Meaning |
|---|---|
| udhaar | Credit given to a customer |
| khata | Ledger or account |
| bahi-khata | Traditional red cloth-bound ledger |
| parchi | A small slip of paper with a quick note |
| vasooli | Collection of dues |
| Hinglish | Hindi mixed with English, written in Roman letters |
| UPI VPA | A UPI address such as `shop@bank` |

## Document map
| File | Purpose |
|---|---|
| 01_PRD.md | What and why |
| 02_TRD.md | How |
| 03_DESIGN_SYSTEM.md | How it looks and behaves, and the slop checklist |
| 04_DECISIONS.md | Why we chose what we chose |
| 05_LOG.md | What happened and when |
| 06_TEST_PLAN.md | How we know it works, plus the 20 fixtures |
| 07_DEMO_AND_PITCH.md | 3-minute script, ad, posts, deck, Q&A |
| 08_SKILLS_AND_TOOLS.md | Skills audit and connections you need to add |
| 09_RISKS_AND_OPEN_QUESTIONS.md | What can go wrong and what we still need to know |
| 10_BUILD_PLAN.md | Hour-by-hour plan with cut lines |
