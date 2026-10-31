# REVIEW: Dukaan Dost ad (30 s, 1080x1920, 30 fps)

Output: `out/dukaan-dost-ad-vertical.mp4` (render with `pnpm ad:render`). Composition: `index.html` plus six scene files in `compositions/`.

## What was looked at
- `npx hyperframes check --json`: `ok: true`, 0 errors. Several snapshot passes (`snapshot --at ...`, then `snapshot --review`: beat sheet, phone sheet, ten seam strips) read as images.
- The rendered MP4: frames 464, 466, 467, 468, 470 as a strip (the slam), plus t = 0, 12.5, 16.5, 21.5, 27 s in `out/frames/`.
- Audio: the rendered AAC decoded, loudest sample in a window around each hit compared with the planned hit time.

## Creative calls
- Haldi canvas, Syahi counter band under every shot (decoration only, below y 1520, outside the platform UI zone), Neel for the speaking shot, Sindoor for owed money and the stamp. Yatra One for display lines, Hind for UI text, Kalam only inside the real app captures. All local fonts from `assets/fonts/`.
- Shots 1 and 2 are typographic stand-ins (a scale, a queue, the khata drifting out of reach; a mic, sound bars, the spoken line in Hinglish and Devanagari). Each carries a "Dramatisation: stand-in for an AI clip" tag. No fake person, no quote from a real user.
- Shots 3 to 5 use real captures of the built app (390x844, fictional demo data). The typing and the reminder sheet are 20 fps frame sequences from the live screen; the parchi and the post-write parchi are element screenshots at 2x. Shot 4 draws the stamp in HyperFrames with the app's own stamp styling (same colours, sizes, rotation), slamming onto the real parchi, and swaps to the real post-write parchi on the contact frame.
- The WhatsApp-style draft in shot 5 is a stylised chat card using the exact reminder text the app produced. It is a draft that the owner sends ("Send aap dabao"); nothing is auto-sent.
- The ad never claims payments, auto-collect, or anything about competitors. The end card says the demo data is fictional.

## Measured
- Stamp contact is frame 468 (15.600 s). The stamp thunk is placed so its loudest sample lands there: hitTimeMs 15600, peakOffsetMs 219, startMs 15381. In the rendered file the loudest sample near the hit is at 15.6001 s.
- Other hits (rendered file vs plan): message tick +0.4 ms, Likh do tap +0.1 ms, logo sting +5.7 ms, UI tick on the parchi appearing -12 ms (the peak of that very quiet click is not its highest sample after mp3 decoding; inaudible).
- Output is 1080x1920, 30 fps, 30.000 s, H.264 plus AAC stereo 48 kHz.

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
- The AI clips for shots 1 and 2 do not exist yet; see `FLOWS_PROMPTS.md`.

## Weakest shot and what to change
Shot 1 (the stand-in). Once the Flows clips exist, drop them in as `assets/clips/shot1.mp4` and `shot2.mp4` and replace the scale illustration with the clip.
