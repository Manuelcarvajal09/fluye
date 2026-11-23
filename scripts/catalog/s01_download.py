"""Stage 1: download raw sources (resumable) and record their metadata.

Files go to .catalog-cache/raw/<source>/ and are treated strictly as data.
Metadata (URL, size, Last-Modified, sha256, download time) -> .catalog-cache/manifest.json
"""
from __future__ import annotations

import hashlib
import time
import urllib.request

from common import CACHE, SOURCES, log, manifest, raw_path, write_json

UA = "fluye-catalog-builder/1.0 (+data pipeline; python-urllib)"


def head(url):
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return int(r.headers.get("Content-Length") or 0), r.headers.get("Last-Modified", "")


def fetch(url, dest, total):
    dest.parent.mkdir(parents=True, exist_ok=True)
    part = dest.with_suffix(dest.suffix + ".part")
    have = part.stat().st_size if part.exists() else 0
    headers = {"User-Agent": UA}
    if have:
        headers["Range"] = f"bytes={have}-"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=120) as r:
        mode = "ab" if (have and r.status == 206) else "wb"
        if mode == "wb":
            have = 0
        last = time.time()
        with open(part, mode) as f:
            while True:
                chunk = r.read(1 << 20)
                if not chunk:
                    break
                f.write(chunk)
                have += len(chunk)
                if time.time() - last > 15:
                    log(f"  {dest.name}: {have/1e6:.0f}/{total/1e6:.0f} MB")
                    last = time.time()
    if total and part.stat().st_size != total:
        raise RuntimeError(f"incomplete download {dest.name}: {part.stat().st_size} != {total}")
    part.replace(dest)


def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def run():
    man = manifest()
    changed = False
    for key, s in SOURCES.items():
        dest = raw_path(key)
        if dest.exists() and key in man:
            log(f"skip (cached): {dest.name}")
            continue
        size, lm = head(s["url"])
        if not dest.exists():
            log(f"download {s['url']} ({size/1e6:.1f} MB)")
            for attempt in range(5):
                try:
                    fetch(s["url"], dest, size)
                    break
                except Exception as e:  # network hiccup: resume
                    log(f"  retry {attempt+1}: {e}")
                    time.sleep(5)
            else:
                raise RuntimeError(f"failed to download {s['url']}")
        man[key] = {
            "url": s["url"],
            "file": str(dest.relative_to(CACHE)).replace("\\", "/"),
            "bytes": dest.stat().st_size,
            "last_modified": lm,
            "sha256": sha256(dest),
            "downloaded_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        }
        changed = True
        write_json(CACHE / "manifest.json", man, indent=2)
    if changed:
        log("manifest updated")


if __name__ == "__main__":
    run()
