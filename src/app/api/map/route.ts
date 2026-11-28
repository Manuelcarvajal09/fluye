import { z } from "zod";
import { apiProfile } from "@/lib/user";
import { claimIslandTrophy, claimSectionChest } from "@/lib/map";

/** Regalos del mapa «Tu viaje»: cofre por sección terminada y trofeo por isla completa. Todo se valida en el servidor. */
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("chest"), section: z.string().regex(/^(A1|A2|B1|B2|C1|C2)-\d{1,3}$/) }),
  z.object({ action: z.literal("trophy"), level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]) }),
]);

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const r = p.data.action === "chest" ? await claimSectionChest(profile, p.data.section) : await claimIslandTrophy(profile, p.data.level);
  return Response.json(r, { status: r.ok ? 200 : 409 });
}
