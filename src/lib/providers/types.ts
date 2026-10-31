export interface SttResult {
  text: string;
  language?: string;
}

export interface SttProvider {
  readonly name: "elevenlabs" | "local";
  /** audio is never stored; it lives in memory for the length of the request */
  transcribe(audio: { data: ArrayBuffer; mime: string }): Promise<SttResult>;
}

export interface TtsProvider {
  readonly name: "elevenlabs" | "local";
  /** returns null in local mode: read-back is silent and the card stays text */
  speak(text: string): Promise<{ data: ArrayBuffer; mime: string } | null>;
}

export class ProviderError extends Error {
  constructor(
    public provider: string,
    message: string,
    public hint: string,
    public status = 502,
  ) {
    super(message);
  }
}
