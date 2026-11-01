export const DRAFT_KEY = "dukaan-dost:typed-draft:v1";
const MAX_AGE = 24 * 60 * 60_000;
export interface TypedDraft { scope: string; text: string; savedAt: number }

export function readDraft(scope: string, now = Date.now()): TypedDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<TypedDraft>;
    if (typeof draft.scope !== "string" || typeof draft.text !== "string" || draft.text.length > 400 || typeof draft.savedAt !== "number" || draft.savedAt > now || now - draft.savedAt > MAX_AGE || draft.scope !== scope) {
      sessionStorage.removeItem(DRAFT_KEY); return null;
    }
    return draft as TypedDraft;
  } catch { return null; }
}

export function saveDraft(scope: string, text: string) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ scope, text: text.slice(0, 400), savedAt: Date.now() }));
}

export function clearDraft(notifyAccountChange = true) {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* storage can be disabled */ }
  if (notifyAccountChange && typeof window !== "undefined") {
    window.dispatchEvent(new Event("dukaan:drafts-clear"));
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel("dukaan-dost:auth-change");
      channel.postMessage("clear-draft"); channel.close();
    }
  }
}
