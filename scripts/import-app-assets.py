"""Restore release-hosted app assets, verifying the archive and every file."""
from pathlib import Path
import hashlib,json,shutil,tempfile,time,urllib.request,urllib.error,zipfile
ROOT=Path(__file__).resolve().parents[1]
def digest(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def main():
 lock=json.loads((ROOT/'app-assets.json').read_text())
 missing=[item for item in lock['files'] if not (ROOT/item['path']).is_file() or (ROOT/item['path']).stat().st_size!=item['size'] or digest(ROOT/item['path'])!=item['sha256']]
 if not missing:print('App assets are already complete.');return
 with tempfile.TemporaryDirectory(prefix='maomao-assets-') as tmp:
  archive=Path(tmp)/'resources.zip'
  req=urllib.request.Request(lock['url'],headers={'User-Agent':'MaoMao-asset-import/1.0'})
  deadline=time.monotonic()+900
  while True:
   try:
    with urllib.request.urlopen(req,timeout=120) as src,archive.open('wb') as dst:shutil.copyfileobj(src,dst,1024*1024)
    break
   except urllib.error.HTTPError as exc:
    if exc.code not in [404,429,500,502,503,504] or time.monotonic()>=deadline:raise
    print('Release assets are not ready yet; retrying in 30 seconds.',flush=True)
    time.sleep(30)
  if digest(archive)!=lock['sha256']:raise ValueError('Resource archive checksum mismatch')
  with zipfile.ZipFile(archive) as z:
   for item in missing:
    target=(ROOT/item['path']).resolve()
    if not target.is_relative_to(ROOT):raise ValueError('Unsafe resource path')
    target.parent.mkdir(parents=True,exist_ok=True)
    with z.open(item['path']) as src,target.open('wb') as dst:shutil.copyfileobj(src,dst,1024*1024)
    if digest(target)!=item['sha256']:raise ValueError('Resource file checksum mismatch: '+item['path'])
 print('Restored',len(missing),'app assets.')
if __name__=='__main__':main()
