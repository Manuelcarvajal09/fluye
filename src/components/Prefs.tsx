"use client";
import { useEffect } from "react";
import { setTtsPrefs, unlockAudio } from "@/lib/audio/tts";
import { setSfxEnabled } from "@/lib/audio/sfx";

/** Aplica las preferencias guardadas (tema y voz) y sincroniza la zona horaria. */
export function Prefs({ theme, voice, rate, accent, autoplay, tz, engine, hdVoice, sfx, colorAccent }: { theme?: string; voice?: string; rate?: number; accent?: "en-US" | "en-CA"; autoplay?: boolean; tz: string; engine?: "hd" | "device"; hdVoice?: string; sfx?: boolean; colorAccent?: string }) {
  useEffect(() => {
    setTtsPrefs({ voice, rate, accent, autoplay, engine, hdVoice });
  }, [voice, rate, accent, autoplay, engine, hdVoice]);

  useEffect(() => setSfxEnabled(sfx !== false), [sfx]);

  // El primer toque desbloquea el audio (iPhone/iPad no permiten reproducir sin un gesto).
  useEffect(() => {
    const h = () => unlockAudio();
    window.addEventListener("pointerdown", h, { once: true });
    window.addEventListener("keydown", h, { once: true });
    return () => {
      window.removeEventListener("pointerdown", h);
      window.removeEventListener("keydown", h);
    };
  }, []);

  // Color de acento: el servidor ya lo pinta desde la cookie; aquí se sincroniza si cambió en otro dispositivo.
  useEffect(() => {
    if (!colorAccent) return;
    document.documentElement.dataset.accent = colorAccent;
    document.cookie = `fluye-accent=${colorAccent}; path=/; max-age=31536000; samesite=lax`;
  }, [colorAccent]);

  useEffect(() => {
    if (!theme) return;
    try {
      if (localStorage.getItem("theme") !== theme) {
        localStorage.setItem("theme", theme);
        applyTheme(theme);
      }
    } catch {}
  }, [theme]);

  useEffect(() => {
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (local && local !== tz) void fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tz: local }) });
  }, [tz]);

  return null;
}

export function applyTheme(t: string) {
  // Transición breve de colores al cambiar de tema (se quita sola; respeta movimiento reducido en CSS).
  document.documentElement.classList.add("theme-anim");
  setTimeout(() => document.documentElement.classList.remove("theme-anim"), 320);
  const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}
