import Link from "next/link";
import { eq } from "drizzle-orm";
import { Info } from "lucide-react";
import { db, schema } from "@/db";
import { requireProfile } from "@/lib/user";
import { SOUNDS, PROSODY } from "@/lib/content";

export const metadata = { title: "Sonidos" };

const KIND = { vowel: "Vocales", diphthong: "Diptongos", consonant: "Consonantes", ending: "Terminaciones" } as const;
const PKIND = { stress: "Acento", rhythm: "Ritmo", intonation: "Entonación", linking: "Enlace", reduction: "Reducción" } as const;

export default async function Sounds() {
  const profile = await requireProfile();
  const rows = await db().select().from(schema.soundProgress).where(eq(schema.soundProgress.userId, profile.userId));
  const prog = new Map(rows.map((r) => [r.soundId, r]));
  const acc = (id: string) => {
    const r = prog.get(id);
    return r && r.perceptionTotal ? Math.round((r.perceptionCorrect / r.perceptionTotal) * 100) : null;
  };
  // Pares mínimos adaptativos: primero los contrastes donde tu oído falla más (o que aún no practicas).
  const forYou = SOUNDS.map((x) => ({ s: x, a: acc(x.id), n: prog.get(x.id)?.perceptionTotal ?? 0 }))
    .filter((x) => x.a === null || x.a < 85)
    .sort((a, b) => (a.a ?? 101) - (b.a ?? 101) || a.s.order - b.s.order)
    .slice(0, 4);
  const groups = (Object.keys(KIND) as (keyof typeof KIND)[]).map((k) => ({ k, items: SOUNDS.filter((s) => s.kind === k) })).filter((g) => g.items.length);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-extrabold">Pronunciación</h1>
        <p className="max-w-3xl text-muted">Los sonidos del inglés norteamericano que más le cuestan a un hispanohablante, explicados en español, con pares mínimos para entrenar el oído y grabación para comparar tu voz.</p>
        <p className="flex max-w-3xl gap-2 rounded-2xl bg-surface-2 p-3 text-sm text-muted">
          <Info size={18} className="shrink-0" aria-hidden />
          Lo que sí se mide: tu oído (pares mínimos) y tu entonación (curva de tono de tu grabación). Lo que no: una nota por fonema (un evaluador fonético local está en prueba experimental y apagado). Tus grabaciones no salen de tu dispositivo.
        </p>
      </header>

      {forYou.length > 0 && (
        <section aria-labelledby="para-ti" className="hero-card p-5">
          <h2 id="para-ti" className="mb-1 font-display text-2xl font-extrabold">
            Para ti ahora
          </h2>
          <p className="mb-3 text-sm text-muted">Los contrastes donde tu oído más falla{forYou.some((x) => x.a === null) ? " o que aún no practicas" : ""}.</p>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {forYou.map(({ s: x, a, n }) => (
              <li key={x.id}>
                <Link href={`/sonidos/${x.id}`} className="module flex h-full flex-col gap-1 p-4">
                  <span className="text-2xl font-black">/{x.symbol}/</span>
                  <span className="font-bold">{x.name_es}</span>
                  <span className="text-xs text-muted">{a === null ? "Sin practicar" : `${a} % de aciertos en ${n}`}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {groups.map((g) => (
        <section key={g.k}>
          <h2 className="mb-3 text-xl font-black">{KIND[g.k]}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 3xl:grid-cols-7">
            {g.items.map((s) => {
              const a = acc(s.id);
              return (
                <li key={s.id}>
                  <Link href={`/sonidos/${s.id}`} className="card flex h-full flex-col gap-1 p-4 transition-transform hover:-translate-y-0.5">
                    <span className="font-mono text-3xl font-black text-accent">/{s.symbol}/</span>
                    <span className="text-sm font-bold">{s.name_es}</span>
                    <span className="mt-auto pt-2 text-xs font-bold text-muted">{a === null ? `${s.pairs.length} pares` : `Oído: ${a}%`}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section>
        <h2 className="mb-3 text-xl font-black">Ritmo, acento y entonación</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
          {PROSODY.map((p) => (
            <li key={p.id}>
              <Link href={`/sonidos/ritmo/${p.id}`} className="card flex h-full items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
                <span className="chip bg-accent-soft text-accent">{PKIND[p.kind]}</span>
                <span className="font-bold">{p.title_es}</span>
                {prog.get(p.id)?.recordings ? <span className="ml-auto text-xs font-bold text-good">✓</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
