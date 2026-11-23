"""Stage 8: write content/catalog/ outputs.

lemmas.jsonl, stats.json, sample-review.csv, tatoeba-attribution.tsv, build-info.json
"""
from __future__ import annotations

import csv
import json
import random
import re
import time
from collections import Counter
from importlib.metadata import version

from common import (OUT, RANDOM_SEED, WORK, log, manifest, read_json, read_jsonl,
                    write_json)

REG = {"informal": "informal", "colloquial": "informal", "slang": "informal", "formal": "formal"}
KEEP_TAGS = {"slang", "vulgar", "offensive", "derogatory", "humorous", "dated", "literary",
             "euphemistic", "informal", "formal", "colloquial", "US", "UK", "British",
             "Canada", "countable", "uncountable", "transitive", "intransitive", "modal",
             "auxiliary", "plural-only", "not-comparable", "figuratively", "ergative",
             "ditransitive", "copulative", "idiomatic", "historical"}


def band(rank):
    return f"{(rank - 1) // 1000 + 1}k" if rank <= 10000 else "10k+"


def level(rank):
    k = (rank - 1) // 1000 + 1
    return "A1" if k == 1 else "A2" if k == 2 else "B1" if k <= 4 else "B2" if k <= 7 else "C1"


def slug(s):
    s = s.lower().replace("'", "")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def http_date(s):
    try:
        return time.strftime("%Y-%m-%d", time.strptime(s, "%a, %d %b %Y %H:%M:%S %Z"))
    except Exception:
        return s


def run():
    man = manifest()
    kaikki_date = http_date(man["kaikki_en"]["last_modified"])
    tatoeba_date = http_date(man["tatoeba_eng"]["last_modified"])
    wf_ver = version("wordfreq")
    prov = {"freq": f"wordfreq {wf_ver}", "sense": f"wiktionary/kaikki {kaikki_date}",
            "ex": f"tatoeba {tatoeba_date}"}

    rows, attrib = [], {}
    ids = set()
    for e in read_jsonl(WORK / "entries_enriched.jsonl"):
        if not e["senses"]:
            continue
        main = e["senses"][e["main"]]
        rid = f"lex-{slug(e['lemma'])}-{e['pos']}"
        if rid in ids:
            continue
        ids.add(rid)
        tags = [t for t in main.get("tags") or () if t in KEEP_TAGS]
        register = "neutral"
        for t in main.get("tags") or ():
            if t in REG:
                register = REG[t]
                break
        ex = []
        for x in e["ex"]:
            ex.append({"en": x["en"], "es": x["es"], "src": x["src"]})
            en_id, es_id = x["src"].split(":")[1].split("-")
            attrib[x["src"]] = (en_id, x["_by"][0], es_id, x["_by"][1])
        status = "complete" if e["es"] and ex else "pending"
        r = {
            "id": rid, "lemma": e["lemma"], "pos": e["pos"], "rank": e["rank"], "zipf": e["zipf"],
            "band": band(e["rank"]), "sense_en": main["g"], "es": e["es"], "explain_es": "",
            "ex": ex,
        }
        for k in ("ipa_us", "ipa_ca", "ipa"):
            if e.get(k):
                r[k] = e[k]
        r["forms"] = e["forms"]
        if e.get("variants"):
            r["variants"] = e["variants"]
        r["tags"] = tags
        r["register"] = register
        r["level_est"] = level(e["rank"])
        r["level_src"] = "estimated-from-frequency"
        r["status"] = status
        if status == "pending":
            r["pending"] = [k for k, ok in (("es", bool(e["es"])), ("ex", bool(ex))) if not ok]
        r["review"] = "auto"
        if e["es_src"]:
            r["es_src"] = e["es_src"]
        if e["extra"]:
            r["senses"] = [{"sense_en": s["g"], "es": s["es"]} for s in e["extra"]]
        r["provenance"] = prov
        rows.append(r)
    rows.sort(key=lambda r: (r["rank"], r["id"]))

    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / "lemmas.jsonl", "w", encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False, separators=(",", ":")) + "\n")
    with open(OUT / "tatoeba-attribution.tsv", "w", encoding="utf-8", newline="\n") as f:
        f.write("src\ten_sentence_id\ten_author\tes_sentence_id\tes_author\tlicense\n")
        for src in sorted(attrib, key=lambda s: tuple(int(x) for x in s.split(":")[1].split("-"))):
            a = attrib[src]
            f.write(f"{src}\t{a[0]}\t{a[1] or '(unknown)'}\t{a[2]}\t{a[3] or '(unknown)'}\tCC BY 2.0 FR\n")

    # ---- stats
    def cnt(pred, sub=rows):
        return sum(1 for r in sub if pred(r))
    top = lambda n: [r for r in rows if r["rank"] <= n]
    stats = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "entries_total": len(rows),
        "distinct_lemmas": len({r["lemma"].lower() for r in rows}),
        "by_pos": dict(Counter(r["pos"] for r in rows).most_common()),
        "by_band": {b: c for b, c in sorted(Counter(r["band"] for r in rows).items(),
                                            key=lambda kv: (kv[0] == "10k+", int(kv[0].rstrip("k+"))))},
        "by_level_est": dict(sorted(Counter(r["level_est"] for r in rows).items())),
        "status": dict(Counter(r["status"] for r in rows)),
        "pending_reasons": dict(Counter("+".join(r.get("pending", [])) for r in rows if r["status"] == "pending")),
        "top_2000": {"entries": len(top(2000)), "complete": cnt(lambda r: r["status"] == "complete", top(2000))},
        "top_5000": {"entries": len(top(5000)), "complete": cnt(lambda r: r["status"] == "complete", top(5000))},
        "with_es": cnt(lambda r: bool(r["es"])),
        "with_examples": cnt(lambda r: bool(r["ex"])),
        "with_2_examples": cnt(lambda r: len(r["ex"]) >= 2),
        "examples_total": sum(len(r["ex"]) for r in rows),
        "with_ipa_us": cnt(lambda r: "ipa_us" in r),
        "with_ipa_ca": cnt(lambda r: "ipa_ca" in r),
        "with_ipa_unspecified_only": cnt(lambda r: "ipa" in r),
        "with_variants": cnt(lambda r: "variants" in r),
        "senses_total": len(rows) + sum(len(r.get("senses", [])) for r in rows),
        "with_extra_senses": cnt(lambda r: bool(r.get("senses"))),
        "es_source": dict(Counter(r.get("es_src", "none") for r in rows)),
        "register": dict(Counter(r["register"] for r in rows)),
    }
    write_json(OUT / "stats.json", stats, indent=2)

    # ---- stratified review sample
    rnd = random.Random(RANDOM_SEED)
    strata = [("1k", lambda r: r["rank"] <= 1000), ("2k", lambda r: 1000 < r["rank"] <= 2000),
              ("3-5k", lambda r: 2000 < r["rank"] <= 5000), ("6-10k", lambda r: 5000 < r["rank"] <= 10000)]
    sample = []
    for name, pred in strata:
        pool = [r for r in rows if pred(r)]
        sample += [(name, r) for r in sorted(rnd.sample(pool, min(50, len(pool))), key=lambda r: r["rank"])]
    with open(OUT / "sample-review.csv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "lemma", "pos", "es", "ex_en", "ex_es", "reviewer", "verdict", "notes",
                    "stratum", "rank", "sense_en"])
        for name, r in sample:
            ex0 = r["ex"][0] if r["ex"] else {"en": "", "es": ""}
            w.writerow([r["id"], r["lemma"], r["pos"], r["es"], ex0["en"], ex0["es"], "", "", "",
                        name, r["rank"], r["sense_en"]])

    info = {
        "built_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "provenance": prov,
        "packages": {p: version(p) for p in ("wordfreq", "lemminflect")},
        "sources": man,
        "wordfreq": read_json(WORK / "wordfreq_meta.json"),
        "kaikki": read_json(WORK / "kaikki_meta.json"),
        "tatoeba": read_json(WORK / "tatoeba_meta.json"),
        "cache_dir": ".catalog-cache",
    }
    write_json(OUT / "build-info.json", info, indent=2)
    log(f"output: {len(rows):,} entries; complete {stats['status'].get('complete', 0):,}")


if __name__ == "__main__":
    run()
