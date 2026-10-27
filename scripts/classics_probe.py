"""Probe ru.wikisource for the classic works we want, so the real fetch list can use exact page titles."""
import json, sys, time, urllib.parse, urllib.request
API = "https://ru.wikisource.org/w/api.php"
UA = {"User-Agent": "PetRussianApp/1.0 (https://github.com/shizhongzhou/russian-learn; educational)"}
def q(**p):
    p.update(format="json", formatversion=2)
    for t in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + "?" + urllib.parse.urlencode(p), headers=UA), timeout=60) as r:
                return json.load(r)
        except Exception as e:
            time.sleep(2 + t * 3); err = e
    raise err
works = json.load(open(sys.argv[1]))
out = {}
for w in works:
    s = q(action="query", list="search", srsearch=w["q"], srnamespace=0, srlimit=8)
    hits = [x["title"] for x in s.get("query", {}).get("search", [])]
    info = {}
    for t in hits[:5]:
        sp = q(action="query", list="allpages", apprefix=t + "/", apnamespace=0, aplimit=60)
        subs = [x["title"] for x in sp.get("query", {}).get("allpages", [])]
        pr = q(action="query", prop="info|categories", titles=t, cllimit=20)
        pg = pr["query"]["pages"][0]
        info[t] = {"len": pg.get("length"), "subs": subs[:60], "nsubs": len(subs), "cats": [c["title"] for c in pg.get("categories", [])][:12]}
        time.sleep(0.3)
    out[w["id"]] = {"q": w["q"], "hits": hits, "info": info}
    print(w["id"], hits[:3], flush=True)
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
