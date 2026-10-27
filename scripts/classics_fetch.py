"""Fetch public-domain Russian classics (original text only) from ru.wikisource.org.
Writes data/books/index.json and data/books/<id>/<n>.json (one file per chapter).
Text is from Wikisource (public domain originals; pre-reform spelling is converted to modern)."""
import json, os, traceback, re, sys, time, urllib.parse, urllib.request
from bs4 import BeautifulSoup
API = "https://ru.wikisource.org/w/api.php"
UA = {"User-Agent": "PetRussianApp/1.0 (https://github.com/shizhongzhou/russian-learn; educational, non-commercial)"}
OUT = sys.argv[2]
def api(**p):
    p.update(format="json", formatversion=2)
    err = None
    for t in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + "?" + urllib.parse.urlencode(p), headers=UA), timeout=90) as r:
                return json.load(r)
        except Exception as e:
            err = e; time.sleep(2 + t * 4)
    raise err
norm = lambda s: s.replace("ё", "е").replace("Ё", "Е").lower()
def parse(title):
    d = api(action="parse", page=title, prop="text", redirects=1, disablelimitreport=1, disableeditsection=1)
    if "error" in d: return None, None
    return d["parse"]["title"], BeautifulSoup(d["parse"]["text"], "html.parser")
DROP = [".ws-noexport", ".noprint", ".reference", "sup", ".mw-editsection", "#headertemplate", ".headertemplate", "ol.references", ".references",
        "style", "script", ".mw-references-wrap", ".ws-pagenum", ".pagenum", ".infobox", ".navbox", ".metadata", "span.ws-pagenum", ".prp-page-qualityheader", ".mw-empty-elt", ".plainlinks"]
def sublinks(soup, base):
    out = []
    for a in soup.select("a[title]"):
        t = a["title"]
        if t.startswith(base + "/") and t not in out and "action=edit" not in a.get("href", ""):
            out.append(t)
    return out
def text_of(soup):
    s = BeautifulSoup(str(soup), "html.parser")
    for sel in DROP:
        for x in s.select(sel): x.decompose()
    for tb in s.find_all("table"):
        cls = " ".join(tb.get("class", [])) + " " + (tb.get("id") or "")
        if re.search(r"header|nav|info|metadata|toc|messagebox|ambox", cls, re.I) or (len(tb.get_text(strip=True)) < 200 and not tb.select(".poem")):
            tb.decompose()
    for pd in s.select("div.poem"):
        if not pd.find("p"):
            pd.name = "p"
    paras = []
    for el in s.find_all(["p", "h2", "h3", "h4", "dd"]):
        if el.find_parent(["p", "dd"]) : continue
        for br in el.find_all("br"): br.replace_with("\n")
        t = el.get_text()
        t = re.sub(r"[ \t ]+", " ", t)
        t = "\n".join(l.strip() for l in t.split("\n")).strip()
        t = re.sub(r"\[\d+\]", "", t)
        if not t or len(t) < 2: continue
        if el.name in ("h2", "h3", "h4"): t = "## " + t
        paras.append(t)
    return paras
PRE = re.compile("[ѣѢіІѳѲѵ]")
def modernize(p):
    p = p.replace("ѣ", "е").replace("Ѣ", "Е").replace("і", "и").replace("І", "И").replace("ѳ", "ф").replace("Ѳ", "Ф").replace("ѵ", "и")
    p = re.sub(r"(?<=[бвгджзклмнпрстфхцчшщ])ъ(?![а-яё])", "", p)
    p = re.sub(r"(?<=[БВГДЖЗКЛМНПРСТФХЦЧШЩ])Ъ(?![А-ЯЁа-яё])", "", p)
    return p
def ed_rank(t):
    tail = t.rsplit("/", 1)[-1]
    if "ДО" in tail: return -5
    r = 0
    if "(СО)" in tail or tail == "СО": r = 5
    elif "ВТ:Ё" in tail: r = 4
    elif "(ВТ" in tail: r = 3
    elif "с ударениями" in tail: r = -2
    elif "Версия" in tail: r = 1
    elif tail.startswith("Вариант"): r = 2 + (1 if "ПСС" in tail else 0)
    m = re.search(r"(1[89]\d\d|20\d\d)", tail)
    if m: r += int(m.group(1)) / 10000
    return r
EDITION = re.compile(r"(^Вариант|\((СО|ДО|ВТ)|ВТ:Ё|Версия \d|^(ПСС|СС|С) |^\d{4}( |$)|^СО$|^ДО$|Редакция|^Б-ка)")
def is_edition(t): return bool(EDITION.search(t.rsplit("/", 1)[-1]))
def chapter_title(t, root): return t[len(root) + 1:] if t.startswith(root + "/") else t.rsplit("/", 1)[-1]
def collect(title, depth=0, label=None):
    """returns list of (chapter label, paragraphs)"""
    real, soup = parse(title)
    if not soup: return []
    paras = text_of(soup)
    links = [l for l in sublinks(soup, real) if not l.endswith("/Примечания")]
    eds = [l for l in links if is_edition(l)]
    chs = [l for l in links if not is_edition(l)]
    body = sum(len(p) for p in paras if not p.startswith("## "))
    pre = sum(len(PRE.findall(p)) for p in paras)
    good_eds = [e for e in eds if ed_rank(e) > 0]
    if depth < 3 and eds and (body < 1500 or (pre > 20 and good_eds)) and not chs:
        best = max(eds, key=ed_rank)
        if ed_rank(best) > -5 or body < 300:
            return collect(best, depth + 1, label)
    if depth < 3 and chs and body < 3000:
        out = []
        for c in chs:
            time.sleep(0.15)
            sub = collect(c, depth + 1, chapter_title(c, real))
            if label and len(sub) > 0: sub = [((label + " · " + l) if l and l != label else label, p) for l, p in sub]
            out += sub
        if out: return out
    return [(label or "", paras)] if body > 0 else []
def resplit(chapters, soft=9000, hard=40000):
    """break very long chapters (whole volumes) at their own headings so one screen-load stays small"""
    out = []
    for label, ps in chapters:
        if sum(len(p) for p in ps) <= hard: out.append((label, ps)); continue
        part, cur, curl, size, cont = "", [], None, 0, 1
        def flush():
            nonlocal cur, size
            if cur: out.append((" · ".join(x for x in (label, part, curl) if x), cur))
            cur, size = [], 0
        for p in ps:
            if p.startswith("## "):
                h = p[3:].strip().rstrip(".")
                if re.match(r"^(ЧАСТЬ|Часть|КНИГА|Книга)", h):
                    flush(); part = h; curl = None; cont = 1; continue
                if size >= soft or not cur:
                    flush(); curl = h; cont = 1; continue
            cur.append(p); size += len(p)
            if size >= hard:
                flush(); cont += 1; curl = f"{(curl or '').split(' (')[0]} ({cont})".strip()
        flush()
    return out
def search(w):
    sur = w["author"].split()[-1]
    for q in (f'intitle:"{w["title"].split(",")[0]}" {sur}', f'{w["title"]} {sur}'):
        d = {}
        for t in range(4):
            d = api(action="query", list="search", srsearch=q, srnamespace=0, srlimit=15)
            if "query" in d: break
            time.sleep(5 + 5 * t)
        hits = [x["title"] for x in d.get("query", {}).get("search", [])]
        for h in hits:
            if norm(h).startswith(norm(w["title"])) and f"({sur}" in h and "/" not in h: return h
        for h in hits:
            if norm(w["title"]) in norm(h) and f"({sur}" in h and "/" not in h: return h
    return None
works = json.load(open(sys.argv[1]))
only = set(sys.argv[3].split(",")) if len(sys.argv) > 3 and sys.argv[3] else None
os.makedirs(OUT, exist_ok=True)
idx_path = os.path.join(OUT, "index.json")
index = {b["id"]: b for b in json.load(open(idx_path))} if os.path.exists(idx_path) else {}
report = []
for w in works:
    if only and w["id"] not in only: continue
    try:
        root = w.get("root") or search(w)
        if not root: report.append(f"MISS {w['id']} {w['title']}"); continue
        chapters = collect(root)
    except Exception as e:
        import traceback; report.append(f"ERR {w['id']} {e!r} {traceback.format_exc()[-400:]}"); print(report[-1], flush=True); continue
    chapters = [(l, [modernize(p) for p in ps]) for l, ps in chapters if ps]
    chapters = resplit(chapters)
    total = sum(len(p) for _, ps in chapters for p in ps)
    if total < 200: report.append(f"SHORT {w['id']} {root} {total}"); continue
    d = os.path.join(OUT, w["id"]); os.makedirs(d, exist_ok=True)
    for f in os.listdir(d): os.remove(os.path.join(d, f))
    chmeta = []
    for n, (l, ps) in enumerate(chapters):
        json.dump({"t": l, "p": ps}, open(os.path.join(d, f"{n}.json"), "w"), ensure_ascii=False, separators=(",", ":"))
        chmeta.append({"t": l, "n": sum(len(p) for p in ps)})
    meta = {k: w[k] for k in ("id", "author", "title", "level", "year", "kind")}
    meta.update(src="https://ru.wikisource.org/wiki/" + urllib.parse.quote(root.replace(" ", "_")), page=root, chars=total, ch=chmeta)
    index[w["id"]] = meta
    report.append(f"OK {w['id']} {w['title']} ← {root} · {len(chapters)} ch · {total} chars")
    print(report[-1], flush=True)
order = [w["id"] for w in works]
json.dump([index[i] for i in order if i in index], open(idx_path, "w"), ensure_ascii=False, indent=0)
open(os.path.join(OUT, "_report.txt"), "w").write("\n".join(report))
print("\n".join(r for r in report if not r.startswith("OK")))
