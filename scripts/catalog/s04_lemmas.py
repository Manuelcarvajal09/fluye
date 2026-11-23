"""Stage 5: lemmatize the wordfreq list, rank lemmas, and build one skeleton
entry per lemma+POS from Wiktionary (main sense, up to 2 extra senses, Spanish
candidates per sense, IPA, forms, spelling variants, register).

Frequency attribution: each surface word's wordfreq frequency is credited to
its lemma(s). Inflections (lemminflect, or Wiktionary "form of" senses) never
become entries of their own; an ambiguous surface form that is also a lemma
(e.g. "left" = adj/noun and past of "leave") is split equally between the
candidate lemmas. Non-US spellings tagged by Wiktionary (colour) are credited
to the US lemma (color) and listed under "variants".

Output: work/entries_skeleton.jsonl, work/lemma_ranks.json
"""
from __future__ import annotations

import bz2
import math
import re
from collections import defaultdict

import lemminflect

from common import (MAX_LEMMA_RANK, MAX_POS_PER_LEMMA, WORK, done, log, raw_path, read_jsonl,
                    write_json, write_jsonl)

OUT = WORK / "entries_skeleton.jsonl"

POS_MAP = {
    "noun": "noun", "verb": "verb", "adj": "adj", "adv": "adv", "pron": "pron",
    "det": "det", "article": "det", "prep": "prep", "postp": "prep", "conj": "conj",
    "intj": "interj", "num": "num", "particle": "other",
}
FUNC = {"det", "pron", "prep", "conj"}
# wordfreq tokens that are foreign function words, abbreviations, chat noise or name parts
STOPLIST = {
    "de", "la", "le", "el", "les", "los", "du", "des", "di", "da", "del", "der", "den", "van",
    "von", "al", "et", "st", "non", "ii", "iii", "iv", "vi", "vii", "viii", "ix", "xi", "mr",
    "mrs", "ms", "dr", "jr", "sr", "inc", "ltd", "co", "vs", "etc", "ie", "eg", "e", "pre",
    "anti", "ca", "cf", "ft", "lb", "lbs", "mm", "cm", "km", "kg", "mg", "ml", "pm", "tv", "pc",
    "uk", "usa", "eu", "bc", "ok", "dc", "nyc", "jan", "feb", "apr", "jun", "jul", "aug",
    "sep", "sept", "oct", "nov", "dec", "mon", "tue", "wed", "thu", "fri", "ur", "im", "ya",
    "dat", "lol", "omg", "wtf", "btw", "san", "und", "ich", "je", "il", "que", "por", "para",
    "una", "se", "na", "ni", "ne", "te", "si", "y", "o", "u", "es", "en", "un", "re", "ll", "ve",
    "ed", "th", "nd", "rd", "pp", "op", "nt", "tho", "cuz", "gonna", "gotta", "wanna",
}
MODALS = {"can", "could", "may", "might", "must", "shall", "should", "will", "would", "ought"}
UPOS = {"noun": "NOUN", "verb": "VERB", "aux": "AUX", "adj": "ADJ", "adv": "ADV"}
# capitalized proper-noun entries that are standard learner vocabulary
NAME_WHITELIST = {
    "January", "February", "March", "April", "May", "June", "July", "August",
    "September", "October", "November", "December", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday", "Sunday", "Christmas", "Easter", "Halloween", "God",
    "Internet",
}


NOUN_PRE = {"a", "an", "the", "my", "your", "his", "her", "its", "our", "their", "this", "that",
            "these", "those", "some", "any", "no", "every", "each", "another"}
VERB_PRE = {"to", "will", "can", "could", "would", "should", "must", "might", "may", "don't",
            "didn't", "doesn't", "won't", "can't", "i", "you", "we", "they", "let's", "please",
            "never", "always", "often", "he", "she", "cannot", "couldn't", "wouldn't", "shouldn't"}
ADJ_PRE = {"very", "so", "too", "is", "are", "was", "were", "be", "been", "more", "most", "quite",
           "really", "look", "looks", "seems", "seem", "feel", "feels", "less", "pretty", "extremely"}


def tatoeba_stats(words):
    """One pass over all Tatoeba English sentences:
    - proper-noun ratio: share of mid-sentence capitalized occurrences (john, japan, trump);
    - context counts per lowercase token: [total, after-determiner, after-verb-trigger,
      after-adjective-trigger] used as cheap POS-usage hints."""
    cap, low = defaultdict(int), defaultdict(int)
    ctx = defaultdict(lambda: [0, 0, 0, 0])
    with bz2.open(raw_path("tatoeba_eng"), "rt", encoding="utf-8") as f:
        for line in f:
            p = line.split("\t")
            if len(p) < 3:
                continue
            raw = p[2].replace("\u2019", "'").split()
            prev_raw, prev_low = "", ""
            for k, t in enumerate(raw):
                w = re.sub(r"^[^A-Za-z']+|[^A-Za-z']+$", "", t)
                lw = w.lower()
                if lw in words:
                    c = ctx[lw]
                    c[0] += 1
                    c[1] += prev_low in NOUN_PRE
                    c[2] += prev_low in VERB_PRE
                    c[3] += prev_low in ADJ_PRE
                    if k > 0 and prev_raw[-1:] not in '.?!:"':
                        if w[:1].isupper() and not w.isupper():
                            cap[lw] += 1
                        elif w.islower():
                            low[lw] += 1
                prev_raw, prev_low = t, lw
    ratio = {w: cap[w] / (cap[w] + low[w]) for w in cap if cap[w] + low[w] >= 5}
    return ratio, dict(ctx)


def pos_usage_ok(lemma, pos, ctx, wf):
    """Is a *secondary* noun/verb/adj reading of this lemma actually used?
    Evidence from Tatoeba contexts; falls back to wordfreq morphology when data is thin."""
    l = lemma.lower()
    base = ctx.get(l, [0, 0, 0, 0])
    if pos == "noun":
        plural = [f.lower() for f in lemminflect.getAllInflections(lemma, upos="NOUN").get("NNS", ())]
        hint = base[1] + sum(ctx.get(f, [0, 0])[1] for f in plural)
        total = base[0] + sum(ctx.get(f, [0])[0] for f in plural)
    elif pos == "verb":
        inf = lemminflect.getAllInflections(lemma, upos="VERB")
        past = {f.lower() for k in ("VBD", "VBN") for f in inf.get(k, ())} - {l}
        hint = base[2] + sum(ctx.get(f, [0, 0, 0])[2] for f in past)  # after to/modal/pronoun
        total = base[0] + sum(ctx.get(f, [0])[0] for f in past)
        if total < 20:
            return any(wf.get(f, 0) >= 0.03 * max(wf.get(l, 1e-12), 1e-12) for f in past)
    elif pos == "adj":
        inf = lemminflect.getAllInflections(lemma, upos="ADJ")
        degr = {f.lower() for k in ("JJR", "JJS") for f in inf.get(k, ())} - {l}
        hint = base[3] + sum(ctx.get(f, [0])[0] for f in degr)
        total = base[0]
    else:
        return True
    if total < 20:
        return None  # not enough data: caller decides
    return hint >= 3 and hint >= 0.05 * total


BAD_TAGS = {
    "obsolete", "archaic", "rare", "dialectal", "nonstandard", "misspelling", "proscribed",
    "Manglish", "Singlish", "eye-dialect", "pronunciation-spelling", "Internet",
    "abbreviation", "initialism", "acronym", "Scotland", "Ireland", "Australia",
    "New-Zealand", "India", "Philippines", "Nigeria", "South-Africa", "Singapore",
    "Malaysia", "Northern-England", "Geordie", "Hong-Kong", "Jamaica", "Caribbean",
    "Pakistan", "Kenya", "Ghana", "Wales", "Cornwall", "Yorkshire", "Multicultural-London-English",
    "African-American-Vernacular", "Southern-US", "Appalachia", "Newfoundland",
    "Cockney", "Liverpool", "Polari", "Scouse", "Ulster", "Hiberno-English",
}
REGION_TAGS = BAD_TAGS - {"obsolete", "archaic", "rare", "dialectal", "nonstandard", "misspelling",
                         "proscribed", "eye-dialect", "pronunciation-spelling", "Internet",
                         "abbreviation", "initialism", "acronym", "Manglish", "Singlish"}
SOFT_TAGS = {"dated", "historical", "slang", "vulgar", "offensive", "derogatory",
             "humorous", "poetic", "literary", "euphemistic", "uncommon"}
NON_US_SPELLING = {"UK", "British", "Commonwealth", "Canada", "Australia", "Ireland",
                   "New-Zealand", "South-Africa", "Oxford-British-English"}
LETTER_GLOSS = re.compile(r"letter|^The name of the Latin[- ]script", re.I)
KEEP_TAGS = {"slang", "vulgar", "offensive", "derogatory", "humorous", "dated", "literary",
             "euphemistic", "informal", "formal", "colloquial", "US", "UK", "British",
             "Canada", "countable", "uncountable", "transitive", "intransitive", "modal",
             "auxiliary", "plural", "plural-only", "not-comparable", "figuratively",
             "ergative", "ditransitive", "copulative", "idiomatic"}
REG_INFORMAL = {"informal", "colloquial", "slang"}


SPELL_RE = re.compile(r"^(?P<pre>.*?)\b(?:spelling|form) of (?P<x>[A-Za-z][A-Za-z'-]*)\.?$")
MAIN_REGIONS = {"US", "Canada", "UK", "British", "American", "General-American", "Commonwealth"}


def spelling_rel(s):
    """Classify 'X spelling of Y' glosses -> (kind, target, canada) or None.
    kind: 'uk' (this word is the non-US spelling), 'us' (this word is the US
    spelling of a Commonwealth headword), 'alt' (plain alternative spelling)."""
    m = SPELL_RE.match(s["g"])
    if not m or "spelling" not in s["g"]:
        return None
    pre, x = m.group("pre"), m.group("x")
    canada = bool(re.search(r"Canad|Commonwealth", pre))
    if re.search(r"\b(US|American)\b", pre):
        return ("us", x, canada)
    if re.search(r"British|\bUK\b|Commonwealth|Canad|Ireland", pre):
        return ("uk", x, canada)
    if re.match(r"^(Alternative|Standard|Informal|Uncommon)\s*$", pre.strip() or "Alternative"):
        return ("alt", x, False)
    return ("bad", x, False)


def sense_ok(s, pos):
    if s.get("form_of") or s.get("alt_of"):
        return False
    tags = set(s.get("tags") or ())
    bad = tags & BAD_TAGS
    if bad and not (tags & MAIN_REGIONS and bad <= REGION_TAGS):  # "US, Australia" is fine
        return False
    if "form-of" in tags or "alt-of" in tags:
        return False
    if SPELL_RE.match(s["g"]):
        return False
    g = s["g"]
    if not g or g.startswith("(") and g.endswith(")"):
        return False
    if pos in ("noun", "num") and LETTER_GLOSS.search(g) and "letter" in g.lower()[:60] and "Latin" in g:
        return False
    return True


def sense_penalty(s):
    return 1 if set(s.get("tags") or ()) & SOFT_TAGS else 0


def load_kaikki():
    by_word = defaultdict(list)
    for e in read_jsonl(WORK / "kaikki_subset.jsonl"):
        by_word[e["word"]].append(e)
    return by_word


STOPW = {"the", "a", "an", "of", "to", "or", "and", "in", "on", "for", "with", "by", "as", "at",
         "be", "is", "that", "this", "it", "from", "one", "some", "something", "someone", "etc",
         "used", "being", "which", "who", "its", "not", "any", "such", "other", "very"}


def _content(t):
    return {w for w in re.findall(r"[a-z]+", t.lower()) if len(w) > 2 and w not in STOPW}


def attach_by_overlap(label, senses):
    """Translation-table label (e.g. 'type, race, category') -> sense index by word overlap."""
    lw = _content(label)
    if not lw:
        return None
    scores = []
    for s in senses:
        gw = _content(s["g"])
        if gw:
            scores.append((len(lw & gw) / len(lw), -s["i"], s["i"]))
    scores.sort(reverse=True)
    if scores and scores[0][0] >= 0.5 and (len(scores) == 1 or scores[0][0] > scores[1][0]):
        return scores[0][2]
    return None


def merge_pos(entries):
    """Merge etymologies of the same word+pos (keeps sense order, first-etym sounds)."""
    out = {}
    for e in entries:
        p = e["pos"]
        if p == "verb" and e["word"] in MODALS:
            p = "aux"
        elif p == "name":
            if e["word"] not in NAME_WHITELIST:
                continue
            p = "noun"
        else:
            p = POS_MAP.get(p)
            if not p:
                continue
        # unattached translations -> attach by wiktextract disambiguation score
        senses = [dict(s) for s in e["senses"]]
        by_idx = {s["i"]: s for s in senses}
        loose = []
        for t in e.get("es") or ():
            k = attach_by_overlap(t.get("sense") or "", senses)
            d = t.get("dis")
            if k is None and d and d[1] >= 60 and d[0] in by_idx:
                k = d[0]
            if k is not None:
                by_idx[k].setdefault("es", []).append(t)
            else:
                loose.append(t)
        if p not in out:
            out[p] = {"word": e["word"], "pos": p, "senses": [], "loose_es": [],
                      "sounds": e.get("sounds") or [], "forms": e.get("forms") or []}
        m = out[p]
        m["senses"].extend(senses)
        m["loose_es"].extend(loose)
        if not m["sounds"]:
            m["sounds"] = e.get("sounds") or []
    return out


def pick_ipa(sounds, pos):
    def score(so, want):
        tags = so["tags"]
        txt = " ".join(tags)
        hit = any(t in tags for t in want) or any(f"note:{w}" in txt for w in ("US", "GA"))
        if not hit:
            return None
        s = 0
        if so["ipa"].startswith("/"):
            s += 2
        if pos in txt:  # e.g. stress differs for noun/verb
            s += 3
        if "weak" in txt:
            s -= 2
        return s
    res = {}
    for key, want in (("ipa_us", ("General-American", "US", "American")),
                      ("ipa_ca", ("Canada", "Canadian"))):
        best = None
        for i, so in enumerate(sounds):
            sc = score(so, want)
            if sc is not None and (best is None or sc > best[0]):
                best = (sc, -i, so["ipa"])
        if best:
            res[key] = best[2]
    if "ipa_us" not in res:
        # pronunciations with no accent label in Wiktionary (apply to all accents)
        def accentless(so):
            for t in so["tags"]:
                if t[:1].isupper() or (t.startswith("note:") and re.search(r"[A-Z]", t[5:6] + t[6:]) and
                                       re.search(r"English|UK|US|Irish|Scottish|Austral|Canad|accent", t)):
                    return False
            return so["ipa"].startswith("/")
        untagged = [so for so in sounds if accentless(so)]
        untagged.sort(key=lambda so: any(x in " ".join(so["tags"]) for x in ("weak", "unstressed", "colloquial")))
        if untagged:
            res["ipa"] = untagged[0]["ipa"]   # accent not specified by Wiktionary
    return res


def forms_for(lemma, pos, wikt_forms):
    up = UPOS.get(pos)
    fs = []
    if up:
        try:
            inf = lemminflect.getAllInflections(lemma, upos=up if up != "AUX" else "AUX")
        except Exception:
            inf = {}
        for vals in inf.values():
            fs.extend(vals)
    if not fs and pos in UPOS:
        for f in wikt_forms:
            tags = set(f["tags"])
            if tags & {"plural", "past", "participle", "present", "comparative", "superlative",
                       "third-person"} and not tags & {"obsolete", "archaic", "dialectal", "rare"}:
                fs.append(f["f"])
    seen, out = set(), []
    for f in fs:
        if f != lemma and f not in seen and re.match(r"^[A-Za-z][A-Za-z'-]*$", f):
            seen.add(f)
            out.append(f)
    return out[:8]


def run():
    if done(OUT):
        return
    kk = load_kaikki()
    wf_words = {r["w"] for r in read_jsonl(WORK / "wordfreq_words.jsonl")}
    wf_freq = {r["w"]: r["f"] for r in read_jsonl(WORK / "wordfreq_words.jsonl")}
    pn_ratio, ctx = tatoeba_stats(wf_words)
    merged = {w: merge_pos(es) for w, es in kk.items()}
    all_es = defaultdict(dict)  # headword -> {spanish word: (raw pos, translation)} over all POS
    for w, es in kk.items():
        for e in es:
            for t in list(e.get("es") or []) + [t for s in e["senses"] for t in s.get("es") or []]:
                all_es[w].setdefault(t["w"], (e["pos"], t))

    # spelling variants: canonical lemma = US spelling; non-US spellings credit it
    def has_ok(word):
        return any(sense_ok(s, p) for p, m in merged.get(word, {}).items() for s in m["senses"])
    variant_of, alt_target = {}, {}
    for w in list(merged):
        for p, m in list(merged[w].items()):
            for s in m["senses"]:
                rel = spelling_rel(s)
                if not rel or rel[1] == w:
                    continue
                kind, x, canada = rel
                if kind == "uk":
                    variant_of.setdefault(w.lower(), (x, w if canada else None))
                elif kind == "us" and not has_ok(w) and has_ok(x):
                    # US headword without senses: borrow the Commonwealth entry, keep US spelling
                    merged[w] = {pp: {**mm, "word": w} for pp, mm in merged[x].items()}
                    variant_of.setdefault(x.lower(), (w, w if canada else None))
                elif kind == "alt" and not has_ok(w):
                    alt_target.setdefault(w.lower(), x.lower())
    # words whose eligible senses exist (own lemma entries), by lowercase key
    def own_entries(w):
        cands = []
        for head in dict.fromkeys([w, w.capitalize(), "I" if w == "i" else w]):  # fixed order
            for p, m in merged.get(head, {}).items():
                ok = [s for s in m["senses"] if sense_ok(s, p)]
                if ok:
                    cands.append((head, p, len(ok)))
        # same POS from lower and Capitalized headword: keep the richer one
        best = {}
        for head, p, n in cands:
            if p not in best or n > best[p][2]:
                best[p] = (head, p, n)
        res = list(best.values())
        # a POS for which lemminflect says this surface word is an inflection is not a lemma
        if w in STOPLIST:
            return []
        lem = {} if w in MODALS else (lemminflect.getAllLemmas(w) or {})

        def is_infl(p):
            ups = [u for u in ({"aux": ("AUX", "VERB")}.get(p) or (UPOS.get(p),)) if u in lem]
            return bool(ups) and all(lem[u][0].lower() != w for u in ups)
        res = [r for r in res if not is_infl(r[1])]
        inflection_word = any(v and v[0].lower() != w for v in lem.values())
        if inflection_word:  # "having", "things", "going": keep only substantial own senses
            def has_es(r):
                m = merged[r[0]][r[1]]
                return any(s.get("es") for s in m["senses"] if sense_ok(s, r[1]))
            res = [r for r in res if r[2] >= 3 and has_es(r)]
        # mostly capitalized in running text -> proper noun; drop the lowercase headword
        if pn_ratio.get(w, 0) >= 0.75 and w.capitalize() not in NAME_WHITELIST:
            res = [r for r in res if r[0] != w]
        # Capitalized headwords (English, Monday) only when they clearly dominate the lowercase word
        low_n = sum(n for h, p, n in cands if h == w)
        cap = w.capitalize()
        cap_n = sum(n for h, p, n in cands if h != w)
        cap_is_name = any(e["pos"] == "name" for e in kk.get(cap, ()))
        cap_ok = (not inflection_word and (cap_n >= 2 * max(low_n, 1) or low_n == 0)
                  and not (cap_is_name and cap_n < 4))
        res = [r for r in res if r[0] == w or r[0] in NAME_WHITELIST or r[0] == "I" or cap_ok]
        # proper-noun dominated lowercase words (john, kim): few lowercase senses + a Name entry
        cap = w.capitalize()
        if any(e["pos"] == "name" for e in kk.get(cap, ())) and cap not in NAME_WHITELIST:
            total = sum(n for h, p, n in res if h == w)
            if total < 3:
                res = [r for r in res if r[0] != w]
        return res

    def wikt_targets(w):
        """lemma targets from Wiktionary form-of senses (when no own senses for that POS)."""
        t = []
        for head in dict.fromkeys([w, w.capitalize()]):
            for p, m in merged.get(head, {}).items():
                if any(sense_ok(s, p) for s in m["senses"]):
                    continue
                for s in m["senses"]:
                    if set(s.get("tags") or ()) & BAD_TAGS:
                        continue
                    for x in s.get("form_of") or ():
                        if x and x.lower() != w and " " not in x:
                            t.append(x.lower())
        return t

    freq = defaultdict(float)
    forms_seen = defaultdict(set)
    variants = defaultdict(dict)
    own_cache = {}
    for r in read_jsonl(WORK / "wordfreq_words.jsonl"):
        w, f = r["w"], r["f"]
        if w in variant_of:
            tgt, ca = variant_of[w]
            tl = tgt.lower()
            freq[tl] += f
            v = variants[tl]
            v["us"] = tgt
            v["uk"] = w
            if ca:
                v["ca"] = ca
            continue
        if w in alt_target and not own_entries(w):
            freq[alt_target[w]] += f
            continue
        if w in STOPLIST:
            continue
        own = own_entries(w)
        own_cache[w] = own
        lem = {} if w in MODALS else (lemminflect.getAllLemmas(w) or {})
        targets = {vals[0].lower() for vals in lem.values() if vals and vals[0].lower() != w}
        if not lem:
            targets |= set(wikt_targets(w))
        targets.discard(w)
        bucket = ([w] if own else []) + sorted(targets)
        if not bucket:
            continue
        share = f / len(bucket)
        for b in bucket:
            freq[b] += share
            if b != w:
                forms_seen[b].add(w)

    # rank lemmas that actually have own entries
    ranked = []
    for lem_key, f in freq.items():
        own = own_cache.get(lem_key)
        if own is None:
            own = own_entries(lem_key)
            own_cache[lem_key] = own
        if own:
            ranked.append((lem_key, f))
    ranked.sort(key=lambda x: (-x[1], x[0]))
    ranks = {k: i + 1 for i, (k, _) in enumerate(ranked)}
    write_json(WORK / "lemma_ranks.json", {"n_lemmas_ranked": len(ranked)})

    rows = []
    for lem_key, f in ranked[:MAX_LEMMA_RANK]:
        rank = ranks[lem_key]
        zipf = round(math.log10(f * 1e9), 2) if f > 0 else 0.0
        own = own_cache[lem_key]
        cands = []
        for head, p, n in own:
            m = merged[head][p]
            ok = [s for s in m["senses"] if sense_ok(s, p)]
            ok.sort(key=lambda s: (sense_penalty(s), 0))  # stable: keep Wiktionary order within bucket
            has_es = any(s.get("es") for s in ok) or bool(m["loose_es"])
            score = min(len(ok), 12) + (4 if has_es else 0)
            cands.append((score, head, p, m, ok, has_es))
        cands.sort(key=lambda c: (-c[0], c[2]))
        keep = []
        for c in cands:
            if not keep:
                keep.append(c)
                continue
            if len(keep) >= MAX_POS_PER_LEMMA:
                break
            n_ok, sense_es = len(c[4]), any(s.get("es") for s in c[4])
            if (keep[0][2] in FUNC and c[2] not in FUNC | {"adv", "interj", "other", "num", "aux"}
                    and n_ok < 6):
                continue
            if not ((n_ok >= 3 and sense_es) or n_ok >= 6):
                continue
            used = pos_usage_ok(c[1], c[2], ctx, wf_freq)
            if used is False or (used is None and not (n_ok >= 4 and sense_es)):
                continue
            keep.append(c)
        for order, (score, head, p, m, ok, has_es) in enumerate(keep):
            senses = []
            seen_g = set()
            for s in ok[:40]:
                if s["g"] in seen_g:
                    continue
                seen_g.add(s["g"])
                senses.append({"g": s["g"], "tags": s.get("tags") or [],
                               "es": s.get("es") or []})
            e = {
                "lemma": head, "pos": p, "rank": rank, "zipf": zipf, "pos_order": order,
                "senses": senses, "loose_es": m["loose_es"],
                "xpos_es": [t for pp, t in all_es[head].values()
                            if ({"verb": "aux"}.get(pp, pp) if p == "aux" else POS_MAP.get(pp, pp)) != p],
                "forms": forms_for(head, p, m["forms"]),
                **pick_ipa(m["sounds"] or next((mm["sounds"] for mm in merged[head].values()
                                                 if mm["sounds"]), []), p),
            }
            if lem_key in variants:
                e["variants"] = variants[lem_key]
            rows.append(e)
    n = write_jsonl(OUT, rows)
    log(f"lemmas: {len(ranked):,} ranked, {min(len(ranked), MAX_LEMMA_RANK):,} kept -> {n:,} lemma+POS entries")


if __name__ == "__main__":
    run()
