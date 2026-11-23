"""Stage 7: choose the Spanish equivalent and Tatoeba examples for each entry.

Spanish (never invented, always a Wiktionary translation):
  1. translations attached to the main sense (first eligible Wiktionary sense);
  2. otherwise the first of the next 2 senses that has translations (that sense
     becomes the main sense, so gloss and Spanish stay coherent);
  3. otherwise any other sense's / unattached translations, only if the Spanish
     word is attested in Tatoeba Spanish translations of English sentences that
     contain the lemma (>=1 co-occurrence for the top 2,000, >=2 otherwise).
  Candidates are ordered: Mexico / Latin-America / untagged before Spain-only,
  then by Tatoeba co-occurrence, then Wiktionary order.

Examples: Tatoeba sentence pairs containing the lemma or an inflection, scored
for learner-friendliness (common vocabulary, 5-10 words, native authors, the
Spanish side containing the chosen equivalent, POS-compatible context).

Output: work/entries_enriched.jsonl
"""
from __future__ import annotations

import re
import unicodedata
from collections import defaultdict

from wordfreq import zipf_frequency

from common import ES_MAX_CHARS, EX_PER_ENTRY, WORK, done, log, read_json, read_jsonl, write_jsonl

OUT = WORK / "entries_enriched.jsonl"
TOK = re.compile(r"[a-z]+(?:[-'][a-z]+)*")
ES_TOK = re.compile(r"[a-zñ]+")
REGION_PRIO = {"Mexico": 0, "Latin-America": 1, "Spain": 3}
BAD_ES_TAGS = {"obsolete", "archaic", "rare", "dated", "vulgar", "derogatory", "offensive"}
VERB_PRE = {"to", "will", "can", "could", "would", "should", "must", "might", "may", "don't",
            "didn't", "doesn't", "won't", "can't", "i", "you", "we", "they", "let's", "please",
            "never", "always", "often"}
NOUN_PRE = {"a", "an", "the", "my", "your", "his", "her", "its", "our", "their", "this",
            "that", "these", "those", "some", "any", "no", "every", "each", "much", "many"}
ADJ_PRE = {"very", "so", "too", "is", "are", "was", "were", "be", "been", "more", "most",
           "quite", "really", "look", "looks", "seems", "feel", "feels", "less"}
ADV_PRE = set()


VOSEO = {"vos", "sos", "tenes", "queres", "podes", "sabes", "haces", "decis", "veni", "mira",
         "anda", "toma", "sentis", "vivis", "estas"} - {"sabes", "haces", "mira", "anda", "toma",
                                                        "estas"}
VOSOTROS = {"vosotros", "vosotras", "os", "vuestro", "vuestra", "vuestros", "vuestras"}
SPAIN_LEX = {"coche", "ordenador", "movil", "vale", "zumo", "gafas", "chaval", "guay", "tio", "tia",
             "piso", "conducir", "patata", "patatas", "cogi", "coger", "coges", "coge", "cogio"}


def dialect_penalty(tl):
    """Prefer Mexican/neutral Latin American Spanish in examples (Fluye targets Mexico)."""
    t = set(tl)
    pen = 0.0
    if t & VOSEO:
        pen += 2.0
    if t & VOSOTROS or any(w.endswith(("ais", "eis")) and len(w) > 5 for w in tl):
        pen += 1.5
    if t & SPAIN_LEX:
        pen += 0.7
    return pen


SOFT = {"slang", "vulgar", "offensive", "derogatory", "dated", "humorous", "historical",
        "poetic", "literary", "euphemistic", "uncommon", "informal"}


def shape_ok(w, pos):
    """Spanish candidate must look like the right part of speech (verb <-> infinitive)."""
    last = strip_acc(w.split()[0])
    is_inf = last.endswith(("ar", "er", "ir", "arse", "erse", "irse")) and len(last) > 3
    if pos in ("verb", "aux"):
        return is_inf
    if pos in ("noun", "adj", "adv"):
        return not is_inf or last in {"mar", "lugar", "hogar", "mujer", "placer", "poder", "deber",
                                      "ser", "amanecer", "atardecer", "taller", "collar", "azucar",
                                      "militar", "familiar", "popular", "regular", "similar",
                                      "particular", "solar", "dolar", "par", "bar", "altar"}
    return True


def strip_acc(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")


def es_stem(word):
    w = strip_acc(word)
    if w.endswith("se") and len(w) > 5 and w[-4:-2] in ("ar", "er", "ir"):
        w = w[:-2]
    if len(w) > 4 and w[-2:] in ("ar", "er", "ir"):
        return w[:-2]
    if len(w) >= 5:
        return w[:-1]
    return w


def es_matcher(cand):
    parts = [p for p in ES_TOK.findall(strip_acc(cand)) if p]
    if not parts:
        return None
    stems = [es_stem(p) if len(p) > 3 else p for p in parts]

    def m(tokset, toks):
        for st, raw in zip(stems, parts):
            if len(st) < 3 or st == raw:
                if raw not in tokset and raw + "s" not in tokset and raw + "es" not in tokset:
                    return False
            elif not any(t.startswith(st) for t in toks):
                return False
        return True
    return m


def clean_es(trs):
    out = []
    for t in trs:
        w = re.sub(r"\s+", " ", t["w"]).strip()
        tags = set(t.get("tags") or ()) | set(t.get("note") or ())
        if (not w or len(w) > 30 or re.search(r"[()\[\]=/;:…]|\d|\.\.\.", w) or tags & BAD_ES_TAGS
                or w.startswith("-") or w.endswith("-")):
            continue
        reg = min([REGION_PRIO.get(x, 2) for x in tags if x[0].isupper()] or [1])
        out.append((w, reg))
    return out


def join_es(words):
    out, seen = [], set()
    for w in words:
        k = strip_acc(w)
        if k in seen:
            continue
        cand = ", ".join(out + [w])
        if len(cand) > ES_MAX_CHARS:
            break
        out.append(w)
        seen.add(k)
        if len(out) == 3:
            break
    return ", ".join(out)


def run():
    if done(OUT):
        return
    pairs = list(read_jsonl(WORK / "tatoeba_pairs.jsonl"))
    index = defaultdict(list)
    meta = []
    zcache = {}

    def z(t):
        if t not in zcache:
            zcache[t] = zipf_frequency(t, "en")
        return zcache[t]
    for i, p in enumerate(pairs):
        toks = TOK.findall(p["en"].lower().replace("’", "'"))
        for t in set(toks):
            index[t].append(i)
        zs = sorted(z(t) for t in toks)
        caps = sum(1 for w in p["en"].split()[1:] if w[:1].isupper() and w not in ("I", "I'm", "I'll", "I've", "I'd"))
        es_toks = []
        for e in p["es"]:
            tl = ES_TOK.findall(strip_acc(e[1]))
            es_toks.append((set(tl), tl, dialect_penalty(tl)))
        meta.append((toks, zs, caps, es_toks))
    log(f"enrich: indexed {len(pairs):,} pairs, {len(index):,} tokens")

    es_rev = read_json(WORK / "es_reverse.json")
    used_global = set()
    rows = []
    entries = list(read_jsonl(WORK / "entries_skeleton.jsonl"))
    entries.sort(key=lambda e: (e["rank"], e["pos_order"]))
    used_by_lemma = defaultdict(set)
    for n, e in enumerate(entries):
        if n and n % 2000 == 0:
            log(f"  enrich {n:,}/{len(entries):,}")
        lemma_l = e["lemma"].lower()
        forms = {lemma_l} | {f.lower() for f in e["forms"]}
        cand_ids = sorted({i for f in forms for i in index.get(f, ())})
        sample = cand_ids if len(cand_ids) <= 1500 else cand_ids[:: len(cand_ids) // 1500 + 1]

        # ---- Spanish candidates & co-occurrence evidence
        sense_c = [clean_es(s["es"]) for s in e["senses"]]
        loose_c = clean_es(e.get("loose_es") or [])
        xpos_c = clean_es(e.get("xpos_es") or [])
        rev_c = [(w, 1) for w, _k in es_rev.get(f"{lemma_l}|{e['pos'] if e['pos'] != 'aux' else 'verb'}", [])][:25]
        all_words = {w for lst in sense_c + [loose_c, xpos_c, rev_c] for w, _ in lst}
        cooc = {}
        for w in all_words:
            m = es_matcher(w)
            if not m:
                cooc[w] = 0
                continue
            c = 0
            for i in sample:
                if any(m(ts, tl) for ts, tl, _ in meta[i][3]):
                    c += 1
            cooc[w] = c

        def order(lst):
            idx = {w: k for k, (w, _) in reversed(list(enumerate(lst)))}
            uniq = {}
            for w, reg in lst:
                uniq[w] = min(reg, uniq.get(w, 9))
            best_reg = min(uniq.values(), default=9)
            ws = [w for w in uniq if not (uniq[w] >= 3 and best_reg < 3)]
            return sorted(ws, key=lambda w: (uniq[w] >= 2, -cooc.get(w, 0), idx[w]))

        main, es_words, es_src = 0, [], ""
        if e["senses"] and sense_c[0]:
            es_words, es_src = order(sense_c[0]), "wiktionary:main-sense"
        if not es_words:
            # Wiktionary translations from other senses / unattached tables / other POS of the
            # same headword, accepted only with Tatoeba evidence; the main sense stays the first.
            base = 1 if e["rank"] <= 2000 else 2
            for label, lists, frac in (("other-sense", sense_c[1:] + [loose_c], 0.05),
                                       ("other-pos", [xpos_c], 0.10),
                                       ("es-entries", [rev_c], 0.10)):
                need = max(base, int(frac * len(sample) + 0.999))
                ws = [w for lst in lists for w in order(lst)
                      if cooc.get(w, 0) >= need and shape_ok(w, e["pos"])]
                if label == "other-pos" and e["pos"] not in ("noun", "verb", "adj", "adv"):
                    ws = []
                if ws:
                    ws = sorted(dict.fromkeys(ws), key=lambda w: -cooc[w])
                    es_words = ws
                    es_src = f"wiktionary:{label}+tatoeba-evidence"
                    if label == "other-sense":
                        # make the sense that owns the winning translation the main sense,
                        # so gloss and Spanish agree (unless it is a slang/dated sense)
                        for k in range(1, len(sense_c)):
                            if ws[0] in {w for w, _ in sense_c[k]}:
                                if not set(e["senses"][k]["tags"]) & SOFT:
                                    main = k
                                    es_words = [w for w in ws if w in {x for x, _ in sense_c[k]}] or ws
                                break
                    break
        if es_src.startswith("wiktionary:es-entries"):
            es_src = "wiktionary-es-entries+tatoeba-evidence"
        if not es_words:
            for k in (1, 2):  # no evidence: next senses that have their own translations
                if k < len(sense_c) and sense_c[k]:
                    main, es_words, es_src = k, order(sense_c[k]), "wiktionary:sense-%d" % (k + 1)
                    break
        # drop country-specific extras (e.g. Argentina-only) when a neutral/Mexican one exists
        reg_of = {}
        for lst in sense_c + [loose_c, xpos_c]:
            for w, r in lst:
                reg_of[w] = min(r, reg_of.get(w, 9))
        if es_words and reg_of.get(es_words[0], 1) <= 1:
            es_words = es_words[:1] + [w for w in es_words[1:] if reg_of.get(w, 1) <= 1]
        # first equivalent always; further ones only when Tatoeba attests them too
        if sample:
            es_words = es_words[:1] + [w for w in es_words[1:] if cooc.get(w, 0) >= 1]
        else:
            es_words = es_words[:2]
        es = join_es(es_words)
        matchers = [m for m in (es_matcher(w) for w in es_words[:3]) if m]

        # ---- examples
        pos = e["pos"]
        pre = {"verb": VERB_PRE, "aux": VERB_PRE, "noun": NOUN_PRE, "adj": ADJ_PRE}.get(pos, ADV_PRE)
        scored = []
        for i in cand_ids:
            if i in used_by_lemma[lemma_l]:
                continue
            toks, zs, caps, es_toks = meta[i]
            pos_hits = [k for k, t in enumerate(toks) if t in forms]
            if not pos_hits:
                continue
            others = [z(t) for t in toks if t not in forms]
            rare = min(others) if others else 6
            nw = len(toks)
            p = pairs[i]
            # best Spanish translation for this sentence
            best_es, best_es_s = None, -9
            for k, (ts, tl, dpen) in enumerate(es_toks):
                s = 0.6 * p["es"][k][3] - dpen
                if any(m(ts, tl) for m in matchers):
                    s += 3
                s -= 0.05 * abs(len(tl) - nw)
                if s > best_es_s:
                    best_es, best_es_s = k, s
            sc = 2 * min(rare, 5.5) + 1.5 * p["en_native"] + best_es_s - 0.15 * abs(nw - 8) - 0.4 * caps
            if pre and any(k > 0 and toks[k - 1] in pre for k in pos_hits):
                sc += 1.5
            if i in used_global:
                sc -= 0.7
            scored.append((-sc, i, best_es))
        scored.sort()
        ex = []
        chosen_toks = []
        for negsc, i, k in scored:
            toks = set(meta[i][0])
            if any(len(toks & c) / max(1, len(toks | c)) > 0.6 for c in chosen_toks):
                continue
            p = pairs[i]
            es_id, es_text, es_user, _ = p["es"][k]
            ex.append({"en": p["en"], "es": es_text, "src": f"tatoeba:{p['en_id']}-{es_id}",
                       "_by": [p["en_user"], es_user]})
            chosen_toks.append(toks)
            used_global.add(i)
            used_by_lemma[lemma_l].add(i)
            if len(ex) == EX_PER_ENTRY:
                break

        out = dict(e)
        out["main"] = main
        out["es"] = es
        out["es_src"] = es_src
        out["ex"] = ex
        out["extra"] = [
            {"g": s["g"], "es": join_es(order(sense_c[k]))}
            for k, s in enumerate(e["senses"]) if k != main
        ][:2]
        rows.append(out)
    write_jsonl(OUT, rows)
    log(f"enrich: {len(rows):,} entries")


if __name__ == "__main__":
    run()
