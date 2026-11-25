"use client";
import { useSyncExternalStore } from "react";

/**
 * Saldo visible en el cliente (monedas, gemas, vidas, protección, potenciadores). El servidor es la fuente de verdad:
 * cada respuesta que trae un saldo nuevo lo publica aquí, y los contadores animan la diferencia y su motivo.
 */
export type Wallet = { coins: number; gems: number; lives: number; shield: number; boosts: number; boostUntil: string | null; streak: number };
export type Change = { field: keyof Wallet; delta: number; reason?: string; from?: { x: number; y: number }; kind?: "shielded" };

let state: Wallet | null = null;
const subs = new Set<() => void>();
const changeSubs = new Set<(c: Change) => void>();

export function seedWallet(w: Wallet) {
  if (!state) state = w;
}
export function setWallet(next: Partial<Wallet>, why?: { reason?: string; from?: { x: number; y: number } }) {
  const prev = state;
  state = { ...(state as Wallet), ...next };
  if (prev)
    for (const f of ["coins", "gems", "lives", "streak", "boosts"] as const) {
      const d = (state[f] ?? 0) - (prev[f] ?? 0);
      if (d) for (const s of changeSubs) s({ field: f, delta: d, reason: why?.reason, from: why?.from });
    }
  for (const s of subs) s();
}
/** Avisos que no cambian un número (la protección se consumió). */
export function notifyChange(c: Change) {
  for (const s of changeSubs) s(c);
}
export function onWalletChange(fn: (c: Change) => void) {
  changeSubs.add(fn);
  return () => void changeSubs.delete(fn);
}
export function useWallet(initial: Wallet) {
  return useSyncExternalStore(
    (fn) => (subs.add(fn), () => void subs.delete(fn)),
    () => state ?? initial,
    () => initial,
  );
}
/** Clave única por operación: repetir la petición (doble clic, red) no cobra dos veces. */
export const opKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
/** Suma relativa (cuando el servidor solo dice cuánto se ganó). */
export function addWallet(delta: Partial<Record<"coins" | "gems" | "lives", number>>, why?: { reason?: string; from?: { x: number; y: number } }) {
  if (!state) return;
  const next: Partial<Wallet> = {};
  for (const [k, v] of Object.entries(delta) as ["coins" | "gems" | "lives", number][]) if (v) next[k] = state[k] + v;
  if (Object.keys(next).length) setWallet(next, why);
}
