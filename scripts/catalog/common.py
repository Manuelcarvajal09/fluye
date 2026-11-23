"""Shared paths and helpers for the Fluye vocabulary catalog pipeline.

All intermediate artifacts live in <repo>/.catalog-cache/ and every stage
skips itself when its output already exists (delete the file to redo it).
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
CACHE = REPO / ".catalog-cache"
RAW = CACHE / "raw"            # downloaded third-party files (data only, never executed)
WORK = CACHE / "work"          # intermediate stage outputs
OUT = REPO / "content" / "catalog"

# ---- tunables (changing them changes the output: delete .catalog-cache/work to rebuild)
WORDFREQ_TOP_N = 80000         # surface words read from wordfreq
MAX_LEMMA_RANK = 12000         # keep lemmas whose post-lemmatization rank is <= this
MAX_POS_PER_LEMMA = 3
EX_MIN_WORDS, EX_MAX_WORDS = 4, 14
EX_PER_ENTRY = 2
ES_MAX_CHARS = 60
GLOSS_MAX_CHARS = 160
RANDOM_SEED = 20261123

SOURCES = {
    "kaikki_en": {
        "url": "https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz",
        "dir": "kaikki",
    },
    "kaikki_es": {
        "url": "https://kaikki.org/dictionary/Spanish/kaikki.org-dictionary-Spanish.jsonl.gz",
        "dir": "kaikki-es",
    },
    "tatoeba_eng": {
        "url": "https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences_detailed.tsv.bz2",
        "dir": "tatoeba",
    },
    "tatoeba_spa": {
        "url": "https://downloads.tatoeba.org/exports/per_language/spa/spa_sentences_detailed.tsv.bz2",
        "dir": "tatoeba",
    },
    "tatoeba_links": {
        "url": "https://downloads.tatoeba.org/exports/per_language/eng/eng-spa_links.tsv.bz2",
        "dir": "tatoeba",
    },
    "tatoeba_eng_users": {
        "url": "https://downloads.tatoeba.org/exports/per_language/eng/eng_user_languages.tsv.bz2",
        "dir": "tatoeba",
    },
    "tatoeba_spa_users": {
        "url": "https://downloads.tatoeba.org/exports/per_language/spa/spa_user_languages.tsv.bz2",
        "dir": "tatoeba",
    },
}


def raw_path(key: str) -> Path:
    s = SOURCES[key]
    return RAW / s["dir"] / s["url"].rsplit("/", 1)[1]


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


def done(path: Path) -> bool:
    if path.exists() and path.stat().st_size > 0:
        log(f"skip (exists): {path.relative_to(REPO)}")
        return True
    return False


def write_json(path: Path, obj, indent=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, indent=indent, sort_keys=False)
        f.write("\n")
    os.replace(tmp, path)


def read_json(path: Path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write_jsonl(path: Path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    n = 0
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False, separators=(",", ":")))
            f.write("\n")
            n += 1
    os.replace(tmp, path)
    return n


def read_jsonl(path: Path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            if line.strip():
                yield json.loads(line)


def manifest() -> dict:
    p = CACHE / "manifest.json"
    return read_json(p) if p.exists() else {}
