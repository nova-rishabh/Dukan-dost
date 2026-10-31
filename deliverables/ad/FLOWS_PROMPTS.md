# ElevenLabs Flows prompt pack: shots 1 and 2

Status: prompts only. Nothing here has been run in Flows. Until you drop the clips in, the ad uses typographic stand-ins (a flat scale-and-queue picture for shot 1, a mic and speech card for shot 2), each tagged "Dramatisation: stand-in for an AI clip".

Rules that apply to both shots (from docs/07 section 10):
- Indian kirana counter, daylight, handheld. No readable brand names, no readable shop signs, no logos on packets (blur or turn labels away).
- No real people, no celebrity or lookalike. The figure is a generated shopkeeper and is never presented as a real user or a testimonial.
- No on-screen text inside the generated clip. The ad adds captions.
- Vertical 9:16, 1080x1920 or the closest Flows offers. Shoot wider than needed so a slight crop is safe: keep faces and hands inside the middle 80 percent, nothing important in the top 170 px or the bottom 600 px (the ad draws a counter band there).
- When the clips exist, the composition keeps a small "dramatisation" tag on screen.

## Exact files to drop in

Put the exported files here, with exactly these names:

```
deliverables/ad/assets/clips/shot1.mp4   (0:00 to 0:04, 4 s)
deliverables/ad/assets/clips/shot2.mp4   (0:04 to 0:09, 5 s)
```

Then tell Claude "the clips are in", and the composition swaps the stand-ins for the clips (mute their audio or keep ambience at low volume; the ad's own sound design sits on top).

## Shot 1: busy hands, the khata out of reach (4 s)

Visual: Close, slightly low angle on a shopkeeper's hands weighing atta on a brass-pan kirana scale. Flour dust in a shaft of window light. A customer's hand holds a steel container, waiting. At frame edge, out of focus and a little too far to reach, a red cloth-bound bahi khata and a pen lie on the counter. The shopkeeper glances at it, hands still full, and cannot reach it.

Camera: Handheld, gentle drift, 35 mm feel, shallow depth of field. Starts on the hands (0 to 2.5 s), a small rack focus to the khata at the end (2.5 to 4 s). No whip pans, no zoom.

Duration: 4 seconds.

Prompt (video node):
"Handheld vertical shot, Indian kirana counter in daylight. Close on a shopkeeper's hands weighing flour on a brass scale, flour dust in window light, a customer's hand waiting with a steel container. In the soft background a red cloth-bound ledger and a pen lie just out of reach on the counter. Warm natural light, shallow depth of field, slight handheld motion, documentary feel. Final half-second: gentle rack focus to the ledger."

Negative cues:
"no readable text, no brand names, no logos, no packet labels, no shop signboard text, no real or famous person, no celebrity lookalike, no phone UI, no subtitles, no watermark, no extra fingers, no distorted hands, no night scene, no neon, no studio lighting."

Optional sound node (shot 1): "Soft kirana ambience: scale chains clinking, distant street, a pan scraping, low murmur, no speech." Keep it under the ad's sound effects.

## Shot 2: he speaks without looking at the phone (5 s)

Visual: Medium close-up of the same generated shopkeeper (same node chain, same reference image) at the counter, hands still busy with a packet, a phone lying screen-down or at the edge of the frame. He says one line, looking at the customer, not the phone. A faint, soft smile at the end.

Camera: Handheld, locked chest-up framing, tiny breathing movement. No push-in. Eye line slightly off-camera.

Duration: 5 seconds (speech about 2.5 s, then a 1 s beat of silence).

Spoken line (speech node, Hindi/Hinglish, stock voice, no cloning of any real person): "Sharma ji ne paanch sau udhaar liye."
The ad also prints it as "Sharma ji ne 500 udhaar liye" and in Devanagari.

Prompt (video node):
"Handheld vertical medium close-up, Indian kirana shopkeeper at his counter in daylight, hands busy with a packet, a phone lying at the edge of the frame. He glances at a customer off-camera and says a short sentence, relaxed and matter-of-fact, then gives a small nod. Warm natural light, shallow depth of field, slight handheld motion, documentary feel."

Negative cues:
"no readable text, no brand names, no logos, no shop sign text, no real or famous person, no celebrity lookalike, no looking at the phone, no phone UI, no subtitles, no watermark, no exaggerated acting, no distorted face or hands, no lip-sync drift, no studio lighting."

## Suggested node chain in Flows

1. Image node: "Indian kirana shopkeeper, mid-40s, grey stubble, simple cotton shirt, behind a counter with brass scale and steel containers, daylight, vertical 9:16, documentary photo, no text anywhere". Generate four, pick one. This is the character reference for both shots.
2. Image node (shot 1 start frame): the counter close-up, hands weighing atta, ledger out of reach, with the reference as input.
3. Video node (shot 1): start frame from step 2 plus the shot 1 prompt and negative cues. 4 s.
4. Video node (shot 2): start frame from step 1 (chest-up) plus the shot 2 prompt and negative cues. 5 s.
5. Optional speech node: the shot 2 line with a stock Hindi voice (not a clone). Feed it to the video node if Flows supports speech-driven lip movement; otherwise leave shot 2 silent and let the ad's captions carry the line.
6. Optional sound node: kirana ambience for shot 1, quiet for shot 2.
7. Export both as MP4, H.264, vertical, then rename to `shot1.mp4` and `shot2.mp4`.

Review before you drop them in: no readable brand or sign text, hands look right, the face does not resemble anyone real, and the clip is clearly labelled as a dramatisation in the ad.
