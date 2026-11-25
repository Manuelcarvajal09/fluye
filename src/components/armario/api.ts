"use client";
import { setWallet, type Wallet } from "../wallet";

export type Resp = { ok?: boolean; error?: string; wallet?: Omit<Wallet, "streak">; [k: string]: unknown };

/** POST JSON a la API. Si la respuesta trae saldo, lo publica para animar los contadores con su motivo. */
export async function post(url: string, body: unknown, why?: { reason?: string; from?: { x: number; y: number } }): Promise<Resp> {
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = (await r.json().catch(() => ({}))) as Resp;
    if (j.wallet) setWallet(j.wallet, why);
    return j;
  } catch {
    return { ok: false, error: "Sin conexión. Inténtalo de nuevo." };
  }
}

/** Centro de un elemento en pantalla (origen de las piezas que vuelan al contador). */
export const centerOf = (el: Element | null | undefined) => {
  const r = el?.getBoundingClientRect();
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined;
};
