"use client";
import { useEffect } from "react";

const IDLE_MS = 60_000;
const FLUSH_MS = 30_000;
const LOCK = "fluye-active-tab";

function localDay() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Marca actividad relevante que no es un clic (reproducir audio, grabar). */
export function markActive() {
  window.dispatchEvent(new Event("fluye:active"));
}

/**
 * Cuenta tiempo activo real: interacción o audio/grabación en los últimos 60 s, con la pestaña visible.
 * Una sola pestaña cuenta (candado en localStorage renovado cada pocos segundos); se envía un acumulado
 * del día cada 30 s y al ocultar la página, así que reintentar nunca suma doble.
 */
export function ActivityTracker() {
  useEffect(() => {
    let clientId = "";
    try {
      clientId = localStorage.getItem("fluye-client") ?? "";
      if (!clientId) {
        clientId = crypto.randomUUID();
        localStorage.setItem("fluye-client", clientId);
      }
    } catch {
      clientId = crypto.randomUUID();
    }
    const tabId = crypto.randomUUID();
    let last = Date.now();
    let day = localDay();
    const key = () => `fluye-active-${day}`;
    let total = 0;
    try {
      total = Number(localStorage.getItem(key()) ?? 0) || 0;
    } catch {}
    let sent = -1;

    const iOwn = () => {
      try {
        const raw = localStorage.getItem(LOCK);
        const [owner, at] = (raw ?? "").split("|");
        if (!raw || owner === tabId || Date.now() - Number(at) > 6000) {
          localStorage.setItem(LOCK, `${tabId}|${Date.now()}`);
          return true;
        }
        return false;
      } catch {
        return true;
      }
    };
    const bump = () => (last = Date.now());
    const flush = (beacon = false) => {
      if (total === sent || total < 5) return;
      const body = JSON.stringify({ day, clientId, seconds: total });
      sent = total;
      if (beacon && navigator.sendBeacon) navigator.sendBeacon("/api/activity", new Blob([body], { type: "application/json" }));
      else void fetch("/api/activity", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => (sent = -1));
    };

    const tick = setInterval(() => {
      if (localDay() !== day) {
        flush();
        day = localDay();
        total = 0;
        sent = -1;
      }
      if (document.visibilityState !== "visible" || Date.now() - last > IDLE_MS || !iOwn()) return;
      // Contador compartido entre pestañas: la que tenga el candado continúa desde el valor guardado.
      try {
        total = Math.max(total, Number(localStorage.getItem(key()) ?? 0) || 0) + 1;
        localStorage.setItem(key(), String(total));
      } catch {
        total += 1;
      }
    }, 1000);
    const flusher = setInterval(() => flush(), FLUSH_MS);
    const onHide = () => document.visibilityState === "hidden" && flush(true);
    const evs = ["pointerdown", "keydown", "scroll", "touchstart", "fluye:active"];
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(tick);
      clearInterval(flusher);
      evs.forEach((e) => window.removeEventListener(e, bump));
      document.removeEventListener("visibilitychange", onHide);
      flush(true);
    };
  }, []);
  return null;
}
