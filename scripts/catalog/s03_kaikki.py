"""Stage 3: stream the kaikki.org English Wiktionary extract (gzip JSONL) and keep
only entries whose headword matches a wordfreq candidate.

The file is read line by line (never fully in RAM). Kept per entry:
word, pos, etymology_number, senses (gloss, tags, form_of/alt_of targets,
sense-level Spanish translations), entry-level Spanish translations, IPA sounds
with their accent tags, and inflected forms.

Output: work/kaikki_subset.jsonl
"""
from __future__ import annotations

import gzip
import json

from common import GLOSS_MAX_CHARS, WORK, done, log, raw_path, read_jsonl, write_json

OUT = WORK / "kaikki_subset.jsonl"
IN_WORDS = WORK / "wordfreq_words.jsonl"


def _spanish(trs):
    out = []
    for t in trs or ():
        if t.get("lang") == "Spanish" or t.get("code") == "es" or t.get("lang_code") == "es":
            w = (t.get("word") or "").strip()
            if not w:
                continue
            d = {k: v for k, v in (("w", w), ("sense", t.get("sense")),
                                    ("tags", t.get("tags")), ("note", t.get("raw_tags")))
                 if v}
            dis = t.get("_dis1")
            if dis:  # wiktextract's sense-disambiguation scores for unattached translations
                try:
                    sc = [int(x) for x in dis.split()]
                    best = max(range(len(sc)), key=sc.__getitem__)
                    d["dis"] = [best, sc[best]]
                except ValueError:
                    pass
            out.append(d)
    return out


def _targets(lst):
    return [x.get("word") for x in (lst or ()) if x.get("word")]


def slim(e):
    senses = []
    for idx, s in enumerate(e.get("senses") or ()):
        gl = s.get("glosses") or s.get("raw_glosses") or []
        if not gl:
            continue
        g = gl[-1].strip()
        if len(gl) > 1 and g[:1] in (".", "…") or (len(gl) > 1 and g[:1].islower()):
            # continuation of the parent definition ("...because it has already been mentioned")
            par = gl[0].strip().rstrip(":")
            g = par if g[:1] in (".", "…") else f"{par}: {g}"
        if len(g) > GLOSS_MAX_CHARS:
            g = g[:GLOSS_MAX_CHARS - 1].rstrip() + "…"
        d = {"i": idx, "g": g}
        if len(gl) > 1:
            d["sub"] = 1
        if s.get("tags"):
            d["tags"] = s["tags"]
        if s.get("raw_tags"):
            d["rtags"] = s["raw_tags"]
        fo = _targets(s.get("form_of"))
        ao = _targets(s.get("alt_of"))
        if fo:
            d["form_of"] = fo
        if ao:
            d["alt_of"] = ao
        es = _spanish(s.get("translations"))
        if es:
            d["es"] = es
        senses.append(d)
    sounds = []
    for so in e.get("sounds") or ():
        if so.get("ipa"):
            tags = list(so.get("tags") or []) + list(so.get("raw_tags") or [])
            if so.get("note"):
                tags.append("note:" + so["note"])
            sounds.append({"ipa": so["ipa"], "tags": tags})
    forms = []
    for fo in e.get("forms") or ():
        f = fo.get("form")
        tags = fo.get("tags") or []
        if f and not ({"table-tags", "inflection-template", "class"} & set(tags)):
            forms.append({"f": f, "tags": tags})
    return {
        "word": e.get("word"),
        "pos": e.get("pos"),
        "etym": e.get("etymology_number"),
        "senses": senses,
        "es": _spanish(e.get("translations")),
        "sounds": sounds,
        "forms": forms[:40],
    }


def run():
    if done(OUT):
        return
    want = {r["w"] for r in read_jsonl(IN_WORDS)}
    src = raw_path("kaikki_en")
    n = kept = 0
    with gzip.open(src, "rt", encoding="utf-8") as f, \
            open(OUT.with_suffix(".tmp"), "w", encoding="utf-8", newline="\n") as out:
        for line in f:
            n += 1
            if n % 200000 == 0:
                log(f"  kaikki lines {n:,}  kept {kept:,}")
            e = json.loads(line)
            w = e.get("word") or ""
            if w.lower() not in want:
                continue
            if not (w == w.lower() or w == w.capitalize() or w == "I"):
                continue  # all-caps acronyms / odd casing
            if e.get("lang_code", "en") != "en":
                continue
            out.write(json.dumps(slim(e), ensure_ascii=False, separators=(",", ":")) + "\n")
            kept += 1
    OUT.with_suffix(".tmp").replace(OUT)
    write_json(WORK / "kaikki_meta.json", {"lines": n, "kept": kept})
    log(f"kaikki: {kept:,} of {n:,} entries kept")


if __name__ == "__main__":
    run()
