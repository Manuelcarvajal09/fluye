"""Stage 2: surface-word frequency list from wordfreq.

Output: work/wordfreq_words.jsonl  -> {"w": word, "i": index, "f": word_frequency}
Only plausible lexical tokens are kept (letters, optional internal hyphen or
apostrophe for o'clock-type words); numerals and stray single letters dropped.
"""
from __future__ import annotations

import re

import wordfreq
from wordfreq import top_n_list, word_frequency

from common import WORDFREQ_TOP_N, WORK, done, log, write_json, write_jsonl

OUT = WORK / "wordfreq_words.jsonl"
TOKEN = re.compile(r"^[a-z]+(?:[-'][a-z]+)*$")


def run():
    if done(OUT):
        return
    words = top_n_list("en", WORDFREQ_TOP_N, wordlist="best")
    rows = []
    for i, w in enumerate(words):
        if not TOKEN.match(w):
            continue
        if len(w) == 1 and w not in ("a", "i"):
            continue
        if "'" in w and w != "o'clock":   # contractions/clitics (don't, it's, 's)
            continue
        rows.append({"w": w, "i": i, "f": word_frequency(w, "en", wordlist="best")})
    write_jsonl(OUT, rows)
    write_json(WORK / "wordfreq_meta.json", {
        "wordfreq_version": getattr(wordfreq, "__version__", None) or _pkg_version(),
        "top_n": WORDFREQ_TOP_N, "kept": len(rows), "wordlist": "best", "lang": "en",
    })
    log(f"wordfreq: {len(rows)} of {len(words)} surface words kept")


def _pkg_version():
    from importlib.metadata import version
    return version("wordfreq")


if __name__ == "__main__":
    run()
