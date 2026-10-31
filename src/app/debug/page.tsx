"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";

/** Rehearsal aid, demo only. Plain monospace is fine: this is not a user surface. */
export default function DebugPage() {
  const [rows, setRows] = useState<Array<{ id: number; createdAt: string; payload: Record<string, unknown> }> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api
      .debug()
      .then((r) => setRows(r.events))
      .catch((e) => setErr(String(e.message ?? e)));
  }, []);
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 font-mono text-sm">
      <h1 className="mb-3 text-[28px]">Debug: last 10 proposals</h1>
      {err ? <p role="alert">{err}</p> : null}
      <ol className="grid gap-2">
        {(rows ?? []).map((r) => (
          <li key={r.id} className="border-2 border-syahi bg-safed p-2">
            <div>{r.createdAt}</div>
            <div>{String(r.payload.sourceText)}</div>
            <div>engine {String(r.payload.engine)}, {String(r.payload.interpretMs)} ms</div>
            <pre className="overflow-x-auto">{JSON.stringify(r.payload.intents)}</pre>
          </li>
        ))}
      </ol>
    </div>
  );
}
