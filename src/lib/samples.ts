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
  { id: "saaf", label: "Saaf awaaz", transcript: "Amit Sharma ne 500 rupaye udhaar liye", note: "Saaf awaaz, ek kaam.", audioPath: "/samples/saaf.mp3" },
  { id: "shor", label: "Shor mein", transcript: "gupta ji ne barah sau wapas kar diye", note: "Shor mein bola gaya. Amount shabdon mein hai, phir bhi 1,200 padha gaya.", audioPath: "/samples/shor.mp3" },
  { id: "teen", label: "Teen kaam ek saath", transcript: "Amit Sharma ne 300 udhaar liye, Ramesh ko 350 ka saman udhaar, chini kam hai", note: "Do entry aur ek stock note, ek hi sentence mein.", audioPath: "/samples/teen.mp3" },
  { id: "sharma", label: "Kaun Sharma?", transcript: "Sharma ji ne 500 diye", note: "Do Sharma hain, isliye app poochta hai.", audioPath: "/samples/sharma.mp3" },
  { id: "ne-ko", label: "Ne ya ko?", transcript: "Gupta ji ko 500 diye", note: "Ek shabd badla, paise ki disha ulti: ko matlab dukaan ne diye.", audioPath: "/samples/ne-ko.mp3" },
];

export const sampleById = (id: string) => SAMPLE_CLIPS.find((s) => s.id === id);
