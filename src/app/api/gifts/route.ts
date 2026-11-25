import { z } from "zod";
import { apiProfile } from "@/lib/user";
import { openGift, sendGift, thankGift, THANKS, type Thanks } from "@/lib/social";

/** Regalos: enviar (carta, gemas o potenciador), abrir y agradecer. Cada uno se cobra y se entrega una sola vez. */
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("send"), to: z.string().min(3).max(80), kind: z.enum(["letter", "gems", "boost"]), amount: z.number().int().min(0).max(100).default(0), message: z.string().max(400).default(""), key: z.string().min(8).max(64) }),
  z.object({ action: z.literal("open"), id: z.string().min(8).max(64) }),
  z.object({ action: z.literal("thank"), id: z.string().min(8).max(64), thanks: z.enum(Object.keys(THANKS) as [Thanks, ...Thanks[]]) }),
]);

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const b = p.data;
  if (b.action === "send") {
    const r = await sendGift(profile, b);
    return Response.json(r, { status: r.ok ? 200 : 409 });
  }
  if (b.action === "open") {
    const r = await openGift(profile, b.id);
    return Response.json(r, { status: r.ok ? 200 : 404 });
  }
  const ok = await thankGift(profile, b.id, b.thanks);
  return Response.json({ ok, error: ok ? undefined : "Ya agradeciste este regalo." }, { status: ok ? 200 : 409 });
}
