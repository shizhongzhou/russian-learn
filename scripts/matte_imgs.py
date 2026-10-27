"""Breed sheets: each cell shows one breed at 3 growth stages (small → big) on white.
Upscale 4x (Real-ESRGAN), cut out (BiRefNet), split into the 3 animals.
usage: python matte_imgs.py indir outdir  → outdir/<name>_<1|2|3>.webp + sizes.json"""
import os, sys, glob, json
import numpy as np, torch
from PIL import Image
from scipy import ndimage
from spandrel import ModelLoader
from rembg import new_session, remove

src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
up = ModelLoader().load_from_file("RealESRGAN_x4plus.pth").eval()
sess = new_session("birefnet-general")
sizes = {}
for p in sorted(glob.glob(os.path.join(src, "*.png"))):
    name = os.path.splitext(os.path.basename(p))[0]
    im = Image.open(p).convert("RGB")
    with torch.no_grad():
        t = torch.from_numpy(np.asarray(im, np.float32) / 255).permute(2, 0, 1)[None]
        big = (up(t)[0].clamp(0, 1).permute(1, 2, 0).numpy() * 255).astype(np.uint8)
    big = Image.fromarray(big)
    a = np.asarray(remove(big, session=sess, only_mask=True, post_process_mask=False), np.float32) / 255
    a[a < 0.06] = 0
    rgb = np.asarray(big, np.float32)
    bg = np.array([250, 250, 250], np.float32)
    am = np.maximum(a, 1e-3)[..., None]
    fg = np.where(a[..., None] > 0.97, rgb, np.clip((rgb - (1 - am) * bg) / am, 0, 255))
    lab, n = ndimage.label(ndimage.binary_dilation(a > 0.5, iterations=6))
    comps = sorted([(int((lab == i).sum()), i) for i in range(1, n + 1)], reverse=True)[:3]
    comps = sorted(comps, key=lambda c: ndimage.find_objects((lab == c[1]).astype(int))[0][1].start)
    sizes[name] = []
    for k, (_, i) in enumerate(comps, 1):
        m = ndimage.binary_dilation(lab == i, iterations=4)
        ys, xs = np.where(m & (a > 0.02))
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        al = np.where(m, a, 0)[y0:y1, x0:x1]
        rgba = np.dstack([fg[y0:y1, x0:x1], al * 255]).astype(np.uint8)
        img = Image.fromarray(rgba, "RGBA")
        img.save(os.path.join(out, f"{name}_{k}.webp"), quality=88, alpha_quality=95, method=6)
        sizes[name].append([int(x1 - x0), int(y1 - y0)])
    print(name, sizes[name], flush=True)
json.dump(sizes, open(os.path.join(out, "sizes.json"), "w"))
