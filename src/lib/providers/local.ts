import { ProviderError, type SttProvider, type TtsProvider } from "./types";

/**
 * Keyless adapters (ADR-018). Sample clips carry canned transcripts (see samples.ts), so real
 * microphone audio cannot be transcribed here: the owner is told to type instead.
 */
export const localStt: SttProvider = {
  name: "local",
  async transcribe() {
    throw new ProviderError(
      "local",
      "Speech-to-text needs ELEVENLABS_API_KEY",
      "Demo mode mein awaaz samajhne ke liye key chahiye. Likh kar try karo ya sample clip dabao.",
      503,
    );
  },
};

export const localTts: TtsProvider = {
  name: "local",
  async speak() {
    return null;
  },
};
