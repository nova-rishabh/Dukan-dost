# REVIEW: Dukaan Dost ad (30 s, 1080x1920, 30 fps)

Output: `out/dukaan-dost-ad-vertical.mp4` (render with `pnpm ad:render`). Composition: `index.html` plus six scene files in `compositions/`.

## What was looked at
- `npx hyperframes check --json`: `ok: true`, 0 errors. Several snapshot passes (`snapshot --at ...`, then `snapshot --review`: beat sheet, phone sheet, ten seam strips) read as images.
- The rendered MP4: frames 464, 466, 467, 468, 470 as a strip (the slam), plus t = 0, 12.5, 16.5, 21.5, 27 s in `out/frames/`.
- Audio: the rendered AAC decoded, loudest sample in a window around each hit compared with the planned hit time.

## Creative calls
- Haldi canvas, Syahi counter band under every shot (decoration only, below y 1520, outside the platform UI zone), Neel for the speaking shot, Sindoor for owed money and the stamp. Yatra One for display lines, Hind for UI text, Kalam only inside the real app captures. All local fonts from `assets/fonts/`.
- Shots 1 and 2 now use the owner's ElevenLabs Flows clips (`assets/clips/shot1.mp4`, `shot2.mp4`), full-bleed (object-fit cover, 496x864 to 1080x1920, about 2.2x). A flat Syahi band (y 1480 to 1920, Haldi top rule) holds the tag "Dramatisation: AI-generated scene" and the captions, so no text sits on the footage. Shot 1: Devanagari beats (Haldi) with a small Hinglish line. Shot 2: the spoken line in Hinglish (white) and Devanagari (Haldi), word by word from 1.0 s, since the clip has no audio. No quote or name is given to the man; he is not presented as a customer.
- Shots 3 to 5 use real captures of the built app (390x844, fictional demo data). The typing and the reminder sheet are 20 fps frame sequences from the live screen; the parchi and the post-write parchi are element screenshots at 2x. Shot 4 draws the stamp in HyperFrames with the app's own stamp styling (same colours, sizes, rotation), slamming onto the real parchi, and swaps to the real post-write parchi on the contact frame.
- The WhatsApp-style draft in shot 5 is a stylised chat card using the exact reminder text the app produced. It is a draft that the owner sends ("Send aap dabao"); nothing is auto-sent.
- The ad never claims payments, auto-collect, or anything about competitors. The end card says the demo data is fictional.

## Measured
- Stamp contact is frame 468 (15.600 s). The stamp thunk is placed so its loudest sample lands there: hitTimeMs 15600, peakOffsetMs 219, startMs 15381. In the rendered file the loudest sample near the hit is at 15.6001 s.
- Other hits (rendered file vs plan): message tick +0.4 ms, Likh do tap +0.1 ms, logo sting +5.7 ms, UI tick on the parchi appearing -12 ms (the peak of that very quiet click is not its highest sample after mp3 decoding; inaudible).
- Shot 1 audio (shot1.mp4, measured): steady ambience, about -35.5 dBFS RMS, peak -8.3 dBFS, so it is audible. Included as a separate `<audio id="amb-shot1">` at volume 0.26, 0.3 s fade in, 0.5 s fade out, 0 to 4.0 s. In the render it peaks at -20.0 dBFS against -1.9 dBFS for the loudest effect (about 18 dB lower) and ends 4.9 s before the first effect, so it never covers one. The video elements are muted. Shot 2 has no audio track.
- Re-render after the clips: stamp loudest sample at 15.6001 s (hitTimeMs 15600, peakOffsetMs 219, startMs 15381, unchanged); `pnpm ad:sync-sounds` reproduces the same offsets.
- 24 to 30 fps: frame-difference scan of the render shows the regular one repeated frame in five (normal 24 to 30 cadence) and no extra hitch at the 4.0 s and 9.0 s cuts.
- Output is 1080x1920, 30 fps, 30.000 s, H.264 plus AAC stereo 48 kHz.

## Changed in the clips pass
- Removed the stand-in art (scale, queue, khata drawing, mic, rings, bars, speech card, big coloured backgrounds) from `compositions/shot1-hands.html` and `shot2-speak.html`; added the muted `<video>`, the Syahi band, captions and tag. `index.html`: the stand-in comment and one `amb-shot1` audio tag. Other scenes, cut frames and the SFX block untouched. `check --json`: ok, same warnings as before (plus one held-overlap on the shot 1 tag at 4.02 s, the intentional 0.3 s hold).
- Looked at: snapshots at 1, 3.5, 5, 8, 15.567, 15.6, 29 s, and rendered frames 467, 468, 121 and 29 s.

## Fixed during review
- Playwright's `recordVideo` ignores device scale (the app sat at 1x in a grey frame), which showed as a half-size grey video window. Replaced with a CDP screencast resampled to image sequences.
- Headless Chromium on this machine draws `<dialog>` text in grey (CanvasText resolves to rgb(198,198,198)); the capture injects `dialog{color:#16123A}` to show the intended design token. This is a capture-time override only; the app source was not touched. Worth a look in the app on a Windows machine with a dark system theme.
- Overlap between a caption and the book in shot 1, a cut-off Devanagari line in shot 2, an over-wide counter pill and nowrap captions in shot 5, a two-line caption with a lonely "है।" in shot 4, a Sindoor-on-Haldi contrast flag on the logo glyph (now on a white disc).
- Dropped the 0.6 s "bas ek tap" caption in shot 4 (under the read-time floor); the hero beat now has no text competing with the slam.

## Warnings kept on purpose
- `content_overlap` on the tags and captions at 4.0, 9.0, 15.0 and 18.0 s: the outgoing scene is held 0.3 s under the incoming one; the incoming scene's background is opaque and covers it.
- `container_overflow` on the Neel slab in shot 6: it sweeps off screen on purpose.
- `line_unread` for the chat bubble (3.3 s on screen, 7.7 s suggested to read all 24 words): the bubble is there to show a draft arrived and to be ticked, not to be read word for word.
- `audio_clip_silent` for `assets/silence.wav`: kept so the file always has an audio stream even if the sound effects are removed.

## Not checked
- Nobody listened to the sound; it was measured only. The effects are short previews (mp3) from Freesound via Openverse; there is no music bed.
- Captures are 1x-resolution screen frames upscaled about 2.3x with light sharpening in shots 3 and 5, so the typing and reminder sheet are slightly soft next to the 2x element screenshots.
- Hindi lines were not reviewed by a native speaker.
- The 16:9 cut was not made.
- The clips are about 2.2x upscaled from 496x864 and look soft at full-bleed (checked at 1, 3.5, 5 and 8 s); not sharpened or filtered. Captions were checked as snapshots only on a desktop viewer, not on a phone.
- Shot 2 lip movement vs the word-by-word caption timing was judged from stills (he is mid-speech at 1.5 to 2.5 s); not frame-synced. The generated man is not a real person; the tag says so.
- The end card still shows the `{{APP_URL}}` placeholder (unchanged, needs the real URL before posting).

## Weakest shot and what to change
Shot 1 is now the softest (upscaled footage, rack-focus end). If Flows can export 1080x1920, swap the files in place; nothing else changes.

## Voice-over (added 2026-11-01)
- Seven Hindi lines made with ElevenLabs text-to-speech (`scripts/ad-vo.ts`, model `eleven_multilingual_v2`, stock professional voices only: Kishan narrates, Raju speaks the shopkeeper's line in shot 2; no cloned voices). Every line is trimmed, loudness-matched to -16 LUFS and mounted in `index.html` in a gap between the sound effects (`assets/vo/VO.json` holds the times).
- Timeline: 0.7 s "haath bhare hain... aur khata door"; 5.0 s "Sharma ji ne paanch sau udhaar liye"; 9.5 s "bolo, ya type karo"; 12.45 s "pehle parchi dikhti hai"; 16.05 s "aap likh do dabao, tab likhta hai"; 18.75 s "baaki raqam update, yaad dilao, send aap dabao"; 24.85 s "bolo, likho mat. Dukaan Dost".
- Checked without listening: each line was transcribed back with Scribe, and the finished mix was transcribed again; all seven lines came back in full at the intended times (only Latin-letter spellings of "500", "type", "send", "update" differ). Mix: -16.7 LUFS, true peak -1.7 dBFS, every line at about -19 dB mean against silence between lines, stamp loudest sample still at 15.6001 s.
- Not verified: nobody has listened to it. Delivery, accent, pacing and whether the man's lips match "Sharma ji ne paanch sau udhaar liye" in shot 2 are judgments for a human ear and eye. Scribe once heard "aap" as "ab" in the stand-alone line 5, so listen to that one in particular.
