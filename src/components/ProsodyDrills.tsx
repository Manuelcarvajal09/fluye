"use client";
import { useState } from "react";
import type { ProsodyLesson } from "@/lib/types";
import { AudioButton } from "./ui";
import { SpeakPanel } from "./SpeakPanel";

export function ProsodyDrills({ lesson }: { lesson: ProsodyLesson }) {
  const [open, setOpen] = useState<number | null>(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  return (
    <ol className="flex flex-col gap-3">
      {lesson.drills.map((d, n) => (
        <li key={n} className="card p-4">
          <div className="flex items-start gap-3">
            <AudioButton text={d.en} size="sm" />
            <AudioButton text={d.en} size="sm" slow />
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpen(open === n ? null : n)} aria-expanded={open === n}>
              <p className="text-xl font-bold" lang="en">
                {d.en} {done.has(n) && <span className="text-good">✓</span>}
              </p>
              <p className="font-mono text-lg tracking-wide text-accent">{d.mark}</p>
              <p className="text-muted">{d.es}</p>
            </button>
          </div>
          {open === n && (
            <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
              <p className="rounded-2xl bg-fire-soft p-3 text-sm">{d.tip_es}</p>
              <SpeakPanel
                target={d.en}
                showPitch
                compact
                onResult={(r) => {
                  void fetch("/api/sound", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ soundId: lesson.id, recordings: 1, selfScore: r.self ?? 0 }) });
                  setDone((s) => new Set(s).add(n));
                  setOpen(n + 1 < lesson.drills.length ? n + 1 : null);
                }}
              />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
