"""Fluye English vocabulary catalog — one-command, resumable build.

Usage (from the repo root):
    python -I scripts/catalog/build.py            # run every stage (skips finished ones)
    python -I scripts/catalog/build.py --from 5   # redo stages 5.. (deletes their outputs)

On first run it creates a private virtualenv in .catalog-cache/venv, installs the
pinned requirements (scripts/catalog/requirements.txt) and re-runs itself there.
"""
from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))  # -I does not add the script dir to sys.path
sys.dont_write_bytecode = True  # keep scripts/catalog free of __pycache__

REPO = HERE.parents[1]
VENV = REPO / ".catalog-cache" / "venv"
VPY = VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def in_venv():
    return Path(sys.prefix).resolve() == VENV.resolve()


def bootstrap():
    if not VPY.exists():
        print("creating virtualenv", VENV, flush=True)
        subprocess.check_call([sys.executable, "-I", "-m", "venv", str(VENV)])
    subprocess.check_call([str(VPY), "-I", "-m", "pip", "install", "-q", "--disable-pip-version-check",
                           "-r", str(HERE / "requirements.txt")])
    sys.exit(subprocess.call([str(VPY), "-I", str(Path(__file__).resolve()), *sys.argv[1:]]))


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    if not in_venv():
        bootstrap()
        return
    from common import WORK, log
    import s01_download, s02_wordfreq, s03_kaikki, s03b_kaikki_es, s04_lemmas
    import s05_tatoeba, s06_enrich, s07_output

    stages = [
        (1, "download", s01_download, []),
        (2, "wordfreq", s02_wordfreq, ["wordfreq_words.jsonl", "wordfreq_meta.json"]),
        (3, "kaikki", s03_kaikki, ["kaikki_subset.jsonl", "kaikki_meta.json"]),
        (4, "kaikki-es reverse index", s03b_kaikki_es, ["es_reverse.json"]),
        (5, "lemmas", s04_lemmas, ["entries_skeleton.jsonl", "lemma_ranks.json"]),
        (6, "tatoeba", s05_tatoeba, ["tatoeba_pairs.jsonl", "tatoeba_meta.json"]),
        (7, "enrich", s06_enrich, ["entries_enriched.jsonl"]),
        (8, "output", s07_output, []),
    ]
    start = 1
    if "--from" in sys.argv:
        start = int(sys.argv[sys.argv.index("--from") + 1])
        for n, _, _, outs in stages:
            if n >= start:
                for o in outs:
                    (WORK / o).unlink(missing_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    for n, name, mod, _ in stages:
        t = time.time()
        log(f"== stage {n}: {name}")
        mod.run()
        log(f"   stage {n} done in {time.time() - t:.0f}s")
    log(f"build finished in {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
