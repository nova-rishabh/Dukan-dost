"use client";

import { useCopy } from "./LocaleProvider";

import { useState } from "react";

/** Typed fallback. Always visible under Bolo, and produces exactly the same card. */
export function TypeBox({ onSubmit, disabled, initial = "" }: { onSubmit: (text: string) => void; disabled?: boolean; initial?: string }) {
  const L = useCopy();
  const [text, setText] = useState(initial);
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSubmit(t);
  };
  return (
    <form
      className="flex w-full gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label className="sr-only" htmlFor="typebox">
        {L("Type here", "Yahan likho")}
      </label>
      <input
        id="typebox"
        className="input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={L("Type here", "Yahan likho")}
        maxLength={400}
        autoComplete="off"
        enterKeyHint="send"
      />
      <button type="submit" className="btn btn-primary" disabled={disabled || !text.trim()}>
        {L("Write", "Likho")}
      </button>
    </form>
  );
}
