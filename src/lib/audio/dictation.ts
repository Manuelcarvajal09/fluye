"use client";
import { useCallback, useEffect, useState } from "react";
import { useRecorder } from "./recorder";
import { preloadStt, resampleTo16k, subscribeStt, transcribe, type SttStatus } from "./stt";

/** Dictado: graba, transcribe con Whisper local y entrega el texto. */
export function useDictation(onText: (t: string) => void) {
  const [busy, setBusy] = useState(false);
  const [stt, setStt] = useState<SttStatus>({ state: "idle", progress: 0 });
  const rec = useRecorder(
    useCallback(
      async (b: AudioBuffer) => {
        setBusy(true);
        try {
          onText((await transcribe(await resampleTo16k(b))).trim());
        } catch {
          onText("");
        } finally {
          setBusy(false);
        }
      },
      [onText],
    ),
  );
  useEffect(() => subscribeStt(setStt), []);
  return { rec, busy, stt, prepare: preloadStt };
}
