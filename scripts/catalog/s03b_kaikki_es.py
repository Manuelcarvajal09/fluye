"""Stage 4: reverse index from Wiktionary's *Spanish-language* entries
(kaikki.org Spanish extract of English Wiktionary): English gloss word -> Spanish
headwords, e.g. "deserve" (verb) -> merecer, because Spanish "merecer" is
glossed "to deserve, merit". Used only as a last-resort candidate source that
must also be confirmed by Tatoeba co-occurrence (stage enrich).

Output: work/es_reverse.json  {"<english>|<pos>": [[spanish, sense_index], ...]}
"""
from __future__ import annotations

import gzip
import json
import re
from collections import defaultdict

from common import WORK, done, log, raw_path, read_jsonl, write_json

OUT = WORK / "es_reverse.json"
POS = {"noun": "noun", "verb": "verb", "adj": "adj", "adv": "adv", "intj": "interj",
       "prep": "prep", "conj": "conj", "pron": "pron", "det": "det", "num": "num"}
SKIP_TAGS = {"form-of", "alt-of", "obsolete", "archaic", "rare", "misspelling", "dated",
             "vulgar", "derogatory", "offensive", "slang", "abbreviation"}


def items(gloss):
    g = re.sub(r"\([^)]*\)", "", gloss)
    for part in re.split(r"[,;]", g):
        part = part.strip().lower().rstrip(".")
        part = re.sub(r"^(to|a|an|the|be)\s+", "", part)
        if re.fullmatch(r"[a-z][a-z'-]*", part):
            yield part


def run():
    if done(OUT):
        return
    want = {r["w"] for r in read_jsonl(WORK / "wordfreq_words.jsonl")}
    rev = defaultdict(dict)
    n = 0
    with gzip.open(raw_path("kaikki_es"), "rt", encoding="utf-8") as f:
        for line in f:
            n += 1
            e = json.loads(line)
            p = POS.get(e.get("pos"))
            w = e.get("word") or ""
            if not p or not w or w[0].isupper() or e.get("lang_code", "es") != "es":
                continue
            for k, s in enumerate(e.get("senses") or ()):
                if set(s.get("tags") or ()) & SKIP_TAGS or s.get("form_of") or s.get("alt_of"):
                    continue
                for gl in (s.get("glosses") or [])[-1:]:
                    for it in items(gl):
                        if it in want:
                            key = f"{it}|{p}"
                            if w not in rev[key] or k < rev[key][w]:
                                rev[key][w] = k
    out = {k: sorted(v.items(), key=lambda kv: (kv[1], kv[0])) for k, v in rev.items()}
    write_json(OUT, out)
    log(f"kaikki-es: {n:,} Spanish entries read, {len(out):,} English keys indexed")


if __name__ == "__main__":
    run()
