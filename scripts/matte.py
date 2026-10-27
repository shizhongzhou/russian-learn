"""Cut the pet out of a white-background video, frame by frame (BiRefNet via rembg).
usage: python matte.py in.mp4 outdir [fps] [height]
Writes outdir/frames/*.png (RGBA, cropped to the union box), outdir/anim.webp and outdir/preview.jpg."""
import os, sys, subprocess, glob
import numpy as np
from PIL import Image
from rembg import new_session, remove

src, out = sys.argv[1], sys.argv[2]
fps = int(sys.argv[3]) if len(sys.argv) > 3 else 24
H = int(sys.argv[4]) if len(sys.argv) > 4 else 420
raw = os.path.join(out, "raw"); os.makedirs(raw, exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"fps={fps}", os.path.join(raw, "%04d.png")], check=True)
sess = new_session("birefnet-general")
cut = []
for p in sorted(glob.glob(os.path.join(raw, "*.png"))):
    im = Image.open(p).convert("RGB")
    mask = remove(im, session=sess, only_mask=True, post_process_mask=False)
    a = np.asarray(mask, dtype=np.float32) / 255.0
    a[a < 0.06] = 0                                   # drop faint ground shadow
    a = np.clip((a - 0.06) / 0.88, 0, 1) if a.max() > 0 else a
    rgb = np.asarray(im, dtype=np.float32)
    bg = np.median(rgb[a < 0.01], axis=0) if (a < 0.01).any() else np.array([245, 245, 247], np.float32)
    # remove the white halo: un-mix the background colour from semi-transparent edge pixels
    am = np.maximum(a, 1e-3)[..., None]
    fg = np.clip((rgb - (1 - am) * bg) / am, 0, 255)
    fg = np.where(a[..., None] > 0.97, rgb, fg)
    cut.append(np.dstack([fg, a * 255]).astype(np.uint8))
    print(p, flush=True)
# union bounding box over all frames so the animation doesn't jitter
al = np.stack([c[..., 3] for c in cut]).max(0)
ys, xs = np.where(al > 8)
pad = 12
y0, y1 = max(0, ys.min() - pad), min(al.shape[0], ys.max() + pad)
x0, x1 = max(0, xs.min() - pad), min(al.shape[1], xs.max() + pad)
scale = H / (y1 - y0)
W = int(round((x1 - x0) * scale))
fdir = os.path.join(out, "frames"); os.makedirs(fdir, exist_ok=True)
frames = []
for i, c in enumerate(cut):
    f = Image.fromarray(c[y0:y1, x0:x1], "RGBA").resize((W, H), Image.LANCZOS)
    f.save(os.path.join(fdir, f"{i:03d}.png"), optimize=True)
    frames.append(f)
frames[0].save(os.path.join(out, "anim.webp"), save_all=True, append_images=frames[1:], duration=int(1000 / fps), loop=0,
               quality=82, alpha_quality=90, method=6)
# QA sheet on a checker background
n = len(frames); step = max(1, n // 12); pick = frames[::step][:12]
cw, ch = W // 2, H // 2
sheet = Image.new("RGB", (cw * 6, ch * 2), (40, 40, 40))
for k, f in enumerate(pick):
    tile = Image.new("RGB", (cw, ch), (200, 120, 200) if k % 2 else (60, 160, 90))
    t = f.resize((cw, ch)); tile.paste(t, (0, 0), t)
    sheet.paste(tile, ((k % 6) * cw, (k // 6) * ch))
sheet.save(os.path.join(out, "preview.jpg"), quality=85)
print("box", x0, y0, x1, y1, "size", W, H, "frames", n, "webp", os.path.getsize(os.path.join(out, "anim.webp")))
