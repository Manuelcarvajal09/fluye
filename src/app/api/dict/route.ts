import { apiProfile } from "@/lib/user";
import { lookup } from "@/lib/dictionary";

/** Traducción de una palabra tocada en una lectura o noticia (diccionario local de la app). */
export async function GET(req: Request) {
  if (!(await apiProfile())) return Response.json({ error: "no autorizado" }, { status: 401 });
  const w = (new URL(req.url).searchParams.get("w") ?? "").slice(0, 40);
  const e = lookup(w);
  return Response.json(e ? { term: e.term, es: e.es, def: e.def ?? "", level: e.level, id: e.id } : { term: w, es: null });
}
