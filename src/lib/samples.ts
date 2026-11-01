export interface SampleClip {
  id: string;
  label: string;
  /** what speech-to-text returns for this clip (canned in keyless mode) */
  transcript: string;
  /** honest description shown on /try */
  note: string;
  /** optional recorded audio, present only after `pnpm samples:generate` */
  audioPath: string;
}

export const SAMPLE_CLIPS: SampleClip[] = [
  { id: "saaf", label: "Saaf awaaz", transcript: "Amit Sharma ne 500 rupaye udhaar liye", note: "Ek saaf sentence, ek kaam.", audioPath: "/samples/saaf.mp3" },
  { id: "shor", label: "Shor mein", transcript: "gupta ji ne barah sau wapas kar diye", note: "Shor mein bola gaya. Amount shabdon mein hai, phir bhi 1,200 padha gaya.", audioPath: "/samples/shor.mp3" },
  { id: "teen", label: "Teen kaam ek saath", transcript: "Amit Sharma ne 300 udhaar liye, Ramesh ko 350 ka saman udhaar, chini kam hai", note: "Do entry aur ek stock note, ek hi sentence mein.", audioPath: "/samples/teen.mp3" },
  { id: "sharma", label: "Kaun Sharma?", transcript: "Sharma ji ne 500 diye", note: "Do Sharma hain, isliye app poochta hai.", audioPath: "/samples/sharma.mp3" },
  { id: "ne-ko", label: "Ne ya ko?", transcript: "Gupta ji ko 500 diye", note: "Ek shabd badla, paise ki disha ulti: ko matlab dukaan ne diye.", audioPath: "/samples/ne-ko.mp3" },
];

export const sampleById = (id: string) => SAMPLE_CLIPS.find((s) => s.id === id);


/** Sample audio and transcripts remain the original evidence; only their UI descriptions change. */
const ENGLISH_SAMPLES: Record<string, { label: string; note: string }> = {
  saaf: { label: "Clear voice", note: "One clear sentence, one task." },
  shor: { label: "With background noise", note: "A noisy recording. The amount is spoken in words and read as 1,200." },
  teen: { label: "Three tasks together", note: "Two entries and one low stock note in a single sentence." },
  sharma: { label: "Which Sharma?", note: "Two customers share the name Sharma, so the app asks you to choose." },
  "ne-ko": { label: "Money direction", note: "One word changes the direction: ‘ko’ means the shop gave credit." },
};
export const sampleDescription = (clip: SampleClip, english: boolean) => english ? ENGLISH_SAMPLES[clip.id] ?? clip : clip;
