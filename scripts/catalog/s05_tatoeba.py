"""Stage 6: Tatoeba English<->Spanish pair index.

Keeps English sentences (4-14 words, clean punctuation) that have a direct
Spanish translation link, plus author usernames and native-speaker flags
(user_languages skill level 5). Output: work/tatoeba_pairs.jsonl
  {"en_id","en","en_user","en_native","es":[[es_id, text, user, native], ...]}
"""
from __future__ import annotations

import bz2
import csv
import re
import sys

from common import EX_MAX_WORDS, EX_MIN_WORDS, WORK, done, log, raw_path, write_json, write_jsonl

OUT = WORK / "tatoeba_pairs.jsonl"
csv.field_size_limit(min(sys.maxsize, 2**31 - 1))
CLEAN_EN = re.compile(r"^[A-Z\"'][^\t]*[.?!]$")


def natives(key):
    s = set()
    with bz2.open(raw_path(key), "rt", encoding="utf-8") as f:
        for line in f:
            p = line.rstrip("\n").split("\t")
            if len(p) >= 3 and p[1] == "5":
                s.add(p[2])
    return s


def run():
    if done(OUT):
        return
    links = {}
    with bz2.open(raw_path("tatoeba_links"), "rt", encoding="utf-8") as f:
        for line in f:
            a, b = line.split("\t")[:2]
            links.setdefault(int(a), []).append(int(b.strip()))
    log(f"tatoeba: {len(links):,} eng sentences with spa links")
    en_nat, es_nat = natives("tatoeba_eng_users"), natives("tatoeba_spa_users")
    need_es = set()
    en = {}
    with bz2.open(raw_path("tatoeba_eng"), "rt", encoding="utf-8") as f:
        for line in f:
            p = line.rstrip("\n").split("\t")
            if len(p) < 4:
                continue
            sid = int(p[0])
            if sid not in links:
                continue
            text = p[2].strip()
            nw = len(text.split())
            if not (EX_MIN_WORDS <= nw <= EX_MAX_WORDS) or not CLEAN_EN.match(text):
                continue
            if re.search(r"\d|https?:|[<>{}\[\]#@_*]", text):
                continue
            user = p[3] if p[3] != "\\N" else ""
            en[sid] = (text, user)
            need_es.update(links[sid])
    es = {}
    with bz2.open(raw_path("tatoeba_spa"), "rt", encoding="utf-8") as f:
        for line in f:
            p = line.rstrip("\n").split("\t")
            if len(p) < 4:
                continue
            sid = int(p[0])
            if sid in need_es:
                text = p[2].strip()
                if len(text.split()) <= EX_MAX_WORDS + 8 and not re.search(r"https?:", text):
                    es[sid] = (text, p[3] if p[3] != "\\N" else "")
    rows = []
    for sid in sorted(en):
        text, user = en[sid]
        tr = [[i, es[i][0], es[i][1], int(es[i][1] in es_nat)] for i in sorted(links[sid]) if i in es]
        if tr:
            rows.append({"en_id": sid, "en": text, "en_user": user,
                         "en_native": int(user in en_nat), "es": tr})
    n = write_jsonl(OUT, rows)
    write_json(WORK / "tatoeba_meta.json", {"pairs_en": n, "es_sentences": len(es)})
    log(f"tatoeba: {n:,} usable English sentences with Spanish translation")


if __name__ == "__main__":
    run()
