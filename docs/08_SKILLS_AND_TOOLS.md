# Skills audit and connections

Honest scope note: the session lists about 290 skills. I read the **full text** of 11 (marked Read). For the rest I classified from their name and one-line description in the skill list. Nothing here claims I ran a skill I did not load.

## 1. "The taste skill"

No skill named "taste" exists in your account or in the claude.ai skill catalogue (searched for taste, design taste, UI polish, anti-slop; zero results). The closest equivalents, which we do use:
- **frontend-design** (Read): the anti-template guidance (calibration list of AI tells, two-pass plan then critique). This is the main taste guide.
- **design-skills:design-elevation** (Read): polish techniques. Its defaults (Inter, grey neutrals, one accent) conflict with your rules, so we use only its method.
- **design-skills:design-critique** and **design:design-critique**: structured critique passes on finished screens.
- **dataviz**: only if a chart is added (not planned).
If you meant a specific skill (a name or a link), send it and I will load it.

## 2. Skills I read and how they shaped the docs

| Skill | Used for | Effect |
|---|---|---|
| frontend-design | Design plan, anti-slop calibration | Palette, type and layout are specific to a kirana counter; slop checklist in 03 section 14 |
| design-skills:design-elevation | Polish method | Tabular numerals, one spacing scale; its Inter and grey defaults overridden |
| design-skills:design-systems | Tokens and component specs | Three-tier tokens, component table with states |
| product-management:write-spec | PRD structure | Goals, non-goals, stories, P0/P1/P2 with acceptance criteria, metrics, open questions |
| engineering:architecture | ADR format | 04_DECISIONS.md |
| engineering:system-design | TRD framework | Requirements, high-level design, trade-offs, scale and reliability |
| engineering:testing-strategy | Test plan | Pyramid, per-component strategy |
| design-skills:interaction-design | States, microinteractions, peak-end | Confirm card state machine, stamp as the peak, states for every control |
| design-skills:ux-writing | Copy rules | Sentence case, active verbs, specific errors, mapped to Hinglish |
| 21st:21st-ui | Component marketplace | Optional starting point; needs an API key; defaults restyled |
| modern-web-guidance | Web feature guidance | **Runs at build time per feature**: `npx.cmd -y modern-web-guidance@latest search "<query>"` then `retrieve` (on Windows use `npx.cmd`). Disclosure section required in build responses |

## 3. Skills we will use next (not yet read in full)

| Skill | When | Why |
|---|---|---|
| superpowers:brainstorming | Now (running) | Hard gate: spec approval before code |
| superpowers:writing-plans | After you approve the docs | Turns PRD and TRD into an implementation plan |
| superpowers:test-driven-development | Build | Fixtures and the number parser come first |
| superpowers:verification-before-completion | Before claiming done | Evidence before assertions |
| superpowers:systematic-debugging | When STT or LLM misbehaves | Root cause first |
| superpowers:using-git-worktrees, finishing-a-development-branch | Repo hygiene | Safe branches |
| superpowers:requesting-code-review, engineering:code-review, security-review | Before submit | Money and privacy paths reviewed |
| engineering:deploy-checklist, engineering:documentation | Deploy | Pre-flight and handoff docs |
| design-skills:accessibility-audit, design:accessibility-review | After first full UI | WCAG 2.2 AA pass |
| design-skills:design-critique, design:design-critique | After first screens | Slop check with fresh eyes |
| claude-android-qa-plugin:android-emulator-qa | Test on an Android emulator | Primary device is Android (Android Studio is installed) |
| run | Launch and screenshot the app | Visual verification |
| claude-api | Only if we use the Anthropic API for extraction | Current model ids, structured output |
| canva:* (Canva is connected) | Social posts and deck visuals | Brand-consistent assets |
| hyperframes, media-use, product-launch-motion, hyperframes-cli, hyperframes-registry | Video ad | HTML-to-video, music and SFX, stamp hit timing; your CC0 sound rule applies |
| slideshow, pptx, docs | Pitch deck | Presentable HTML deck with notes, or a file if needed |
| figma:* (Figma is connected) | Only if we make a Figma mock-up | Optional |
| goalify | Optional | Prepare a long autonomous build run with a proof condition |
| fewer-permission-prompts | Early in build | Cuts approval prompts for safe commands |

## 4. Full classification of everything else

| Group | Skills | Verdict |
|---|---|---|
| **Design plugins** | design-skills (accessibility-audit, design-critique, design-elevation, design-ops, design-systems, interaction-design, journey-mapping, ux-research, ux-strategy, ux-writing); design (accessibility-review, design-critique, design-handoff, design-system, research-synthesis, user-research, ux-copy) | **Use** accessibility, critique, interaction, writing, systems. **Maybe** journey-mapping (one flow map for the deck), user-research (to plan the shopkeeper test). **Skip** design-ops, ux-strategy, research-synthesis for now |
| **Engineering** | architecture, code-review, debug, deploy-checklist, documentation, incident-response, standup, system-design, tech-debt, testing-strategy | **Use** the first six listed in section 2 and 3. **Skip** incident-response, standup, tech-debt |
| **10x-Team personas** | 10x-team, cto, dba, engineering-manager, principal-architect, product-manager, qa-engineer, sde, security-engineer, senior-engineer, sre, staff-engineer, devops-engineer | **Maybe as review lenses:** dba on the schema, security-engineer on privacy and keys, qa-engineer on the test plan, sre on the stage-failure plan |
| **Product management** | write-spec (Read), brainstorm, product-brainstorming, competitive-brief, metrics-review, roadmap-update, sprint-planning, stakeholder-update, synthesize-research | **Use** write-spec. **Maybe** competitive-brief to verify the competitor claims. Skip the rest |
| **Frontend and web** | frontend-design (Read), modern-web-guidance (Read), 21st, web-artifacts-builder, artifact-design, artifact-diagramming, artifact-capabilities, animatedwebs (site, hero, background, component, browse, style, design) | **Use** the first three. **Skip** animatedwebs (template-based; conflicts with "no generic websites"), web-artifacts-builder and artifact-* (these build claude.ai artifacts, not our Next.js app; useful only if we publish a shareable doc page) |
| **Mobile and Android** | mobile-design-system, claude-android-qa-plugin | **Use** android-emulator-qa. **Maybe** mobile-design-system as a cross-check of tokens; it generates a style-guide page, which would duplicate our system |
| **Video and media** | hyperframes (+ cli, registry), media-use, product-launch-motion, remotion-to-hyperframes, reverse-any-video, figma (motion, shaders), appstore-screenshots | **Use** hyperframes, media-use, product-launch-motion for the ad. **Skip** remotion-to-hyperframes, reverse-any-video, appstore-screenshots |
| **Documents and decks** | docs, docx, pptx, pdf, xlsx, slideshow, google-workspace | **Use** slideshow or Canva for the deck, docs for shareable write-ups. **Skip** the rest unless a file format is requested |
| **Figma** | figma-code-connect, figma-code-workflows, figma-create-new-file, figma-design-to-code, figma-generate-design, figma-generate-diagram, figma-generate-library, figma-generative-plugins, figma-implement-motion, figma-shaders, figma-spec, figma-swiftui, figma-use, figma-use-figjam, figma-use-motion, figma-use-slides | **Optional.** Only if you want a Figma mock-up first. Figma is connected; `figma-use` is mandatory before any `use_figma` call |
| **Canva** | brand-check, bulk-create, cli, edit-design, get-design-feedback, implement-feedback, resize-for-social-media | **Use** for social posts and resizing (Canva is connected). Brand-check only if we make a brand kit |
| **Data** | analyze, build-dashboard, create-viz, data-context-extractor, data-visualization, explore-data, sql-queries, statistical-analysis, validate-data, write-query | **Maybe** sql-queries for the schema and views. Skip the rest (no analytics build planned) |
| **SEO** | claude-seo (about 30 skills), searchfit-seo (about 20 skills), marketing:seo-audit | **Maybe** one light seo-check on the landing page title and meta. **Skip** the rest; SEO is not a rubric line |
| **Sales** | about 40 skills | **Skip** (not a sales project) |
| **Legal** | brief, compliance-check, legal-response, legal-risk-assessment, meeting-briefing, review-contract, signature-request, triage-nda, vendor-check | **Skip** for the build. **Maybe** compliance-check for a quick privacy read of the consent text |
| **Brand and marketing** | brand-voice (3 plus enforcement and guidelines), marketing (brand-review, campaign-plan, competitive-brief, content-creation, draft-content, email-sequence, performance-report, seo-audit) | **Maybe** brand-voice for a one-page voice sheet; **skip** the rest |
| **Chrome extensions** | chrome-extension-builder and its 20 sub-skills | **Skip** |
| **Bright Data** | scrape, search, live-research, competitive-intel, discover-api and others | **Maybe** to verify competitor features if Bright Data is authorised; otherwise web search is enough |
| **Other plugins** | postiz (social scheduling), goalify, workflow-audit (plan, workflow-audit), desktop-commander (4), anthropic-skills (consolidate-memory, explain-usage, import-memory, learn, morning, setup-claude, skill-creator), update-config, keybindings-help, loop, schedule, simplify, init, plugin-authoring | **Skip** for this build, except goalify (optional) and simplify (after a first implementation pass) |

## 5. Connections and setup you need to add

### Already connected (nothing to do)
Canva, Figma, Google Drive, Notion, Claude Docs.

### Recommended (adds speed; each needs you to authorise)
| Connection | What it unlocks | How |
|---|---|---|
| **Supabase** (in the registry) | I can create the project, run migrations, seed data and check tables | Add from the app's connectors, or authorise through `/mcp` in a Claude terminal session |
| **Vercel** (in the registry) | Read deployments and logs; check preview builds | Same |
| **GitHub** (listed as needing authorisation) | Create the repo, push, and open PRs | Same; or sign in with the `gh` CLI if that is already set up |

### Optional
| Connection | Use | Note |
|---|---|---|
| **ElevenLabs** MCP (in the registry; it manages ElevenAgents voice agents) | Helps if we use an ElevenLabs agent. **Not needed** for plain Scribe STT and TTS, which use the API key | Skip unless we change approach |
| **shadcn MCP for React Bits** | Lets me search and add React Bits components | After the app exists: add `"registries": { "@react-bits": "https://reactbits.dev/r/{name}.json" }` to `components.json`, then `npx shadcn@latest mcp init --client claude` |
| **21st.dev MCP** | Component catalogue and inspiration | Free API key from 21st.dev/mcp, set as `API_KEY_21ST` |
| **Bright Data** | Competitor verification | Only if you want deeper research |

### Not needed
WhatsApp connectors (Bird, Sent, LetsBot, MyChatBot): we use `wa.me` click-to-send for v1. v0: it would give generic output.

### Keys and accounts to prepare (never paste them in chat)
Put them in Doppler or Vercel env, and tell me only the names.
1. `ELEVENLABS_API_KEY` (Scribe STT and TTS access confirmed on your plan?)
2. `GEMINI_API_KEY` from Google AI Studio (or `ANTHROPIC_API_KEY`)
3. A Supabase project (URL, anon key, service role key)
4. A Vercel project linked to the GitHub repo
5. A demo UPI VPA (any, clearly labelled demo; use a real one only for the ₹1 test)
6. A domain or subdomain (student-pack free domain is fine)

### Local tools
Node, Git, FFmpeg and Android Studio are installed per your inventory. We will need `pnpm` or `npm`, Playwright browsers (installed at build time), and a phone with USB debugging for real-device tests. On Windows, use `npx.cmd` for npx commands.

## 6. Permissions note
`fewer-permission-prompts` can add an allowlist (npm, git, Playwright, Vitest) so the build is not interrupted. We will run it after the repo exists. The only npx allowlist entry for modern-web-guidance should be `npx -y modern-web-guidance@latest *`, never bare `npx *`.
