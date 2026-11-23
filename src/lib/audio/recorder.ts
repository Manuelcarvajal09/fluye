"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Graba el micrófono SOLO en memoria del navegador. Nada se sube al servidor.
 * Devuelve el audio como URL local y como AudioBuffer para analizarlo (curva de tono).
 */
export function useRecorder(onBuffer?: (b: AudioBuffer) => void) {
  const cb = useRef(onBuffer);
  useEffect(() => {
    cb.current = onBuffer;
  });
  const [state, setState] = useState<"idle" | "recording" | "ready" | "denied" | "unsupported">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
      rec.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);

  const start = useCallback(async (maxMs = 12_000) => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return setState("unsupported");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((t) => MediaRecorder.isTypeSupported?.(t));
      const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType });
        setUrl(URL.createObjectURL(blob));
        try {
          const ctx = new AudioContext();
          const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
          setBuffer(decoded);
          void ctx.close();
          cb.current?.(decoded);
        } catch {
          setBuffer(null);
        }
        setState("ready");
      };
      rec.current = r;
      r.start();
      setState("recording");
      stopTimer.current = setTimeout(() => r.state === "recording" && r.stop(), maxMs);
    } catch {
      setState("denied");
    }
  }, []);

  const stop = useCallback(() => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    if (rec.current?.state === "recording") rec.current.stop();
  }, []);

  const reset = useCallback(() => {
    setUrl(null);
    setBuffer(null);
    setState((s) => (s === "unsupported" ? s : "idle"));
  }, []);

  return { state, url, buffer, start, stop, reset };
}
