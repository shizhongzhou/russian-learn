"""Download one landmark photo per travel city from Wikimedia Commons (free licences only) + credits.
usage: python city_photos.py outdir"""
import json, os, sys, urllib.parse, urllib.request, io
from PIL import Image
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
Q = {
  "moscow": "Saint Basil's Cathedral Red Square", "spb": "Winter Palace Saint Petersburg Palace Square", "baikal": "Lake Baikal shore",
  "kazan": "Kazan Kremlin Kul Sharif", "tokyo": "Tokyo Tower night", "kyoto": "Kiyomizu-dera Kyoto", "osaka": "Osaka Castle",
  "paris": "Eiffel Tower Paris", "lyon": "Lyon Fourviere Saone", "nice": "Nice Promenade des Anglais beach", "marseille": "Marseille Vieux-Port Notre-Dame de la Garde",
  "beijing": "Forbidden City Beijing", "harbin": "Saint Sophia Cathedral Harbin", "chengdu": "giant panda Chengdu",
}
OK = ("cc0", "public domain", "pd", "cc by", "cc-by")
UA = {"User-Agent": "PetRussianApp/1.0 (educational app; contact via github shizhongzhou)"}
def api(params):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))
credits = {}
for key, q in Q.items():
    r = api({"action": "query", "format": "json", "generator": "search", "gsrnamespace": 6, "gsrsearch": q + " filetype:bitmap", "gsrlimit": 25,
             "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": 900})
    pages = sorted((r.get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    best = None
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]; md = ii.get("extmetadata", {})
        lic = (md.get("LicenseShortName", {}).get("value") or "").lower()
        if not any(lic.startswith(o) for o in OK) or "nc" in lic or "nd" in lic: continue
        w, h = ii.get("width", 0), ii.get("height", 0)
        if w < 1200 or not (1.2 <= w / max(h, 1) <= 2.0): continue
        best = (p, ii, md); break
    if not best: print("NONE", key); continue
    p, ii, md = best
    data = urllib.request.urlopen(urllib.request.Request(ii["thumburl"], headers=UA), timeout=60).read()
    im = Image.open(io.BytesIO(data)).convert("RGB"); im.thumbnail((900, 900))
    im.save(os.path.join(OUT, f"{key}.webp"), quality=80, method=6)
    import re
    strip = lambda s: re.sub("<[^>]+>", "", s or "").strip()
    credits[key] = {"title": p["title"], "author": strip(md.get("Artist", {}).get("value"))[:80], "license": md.get("LicenseShortName", {}).get("value"),
                    "page": ii.get("descriptionurl")}
    print(key, p["title"], credits[key]["license"])
json.dump(credits, open(os.path.join(OUT, "credits.json"), "w"), ensure_ascii=False, indent=1)
