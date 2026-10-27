"""Split a cut-out breed cell (3 animals, small → big, left → right) into three images.
Animals often touch, so instead of connected components we cut along the cheapest vertical
seam through the alpha channel (seam carving) inside the gap between two animals.
usage: python split_breeds.py cells_dir out_dir   (cells_dir/<name>.png → out_dir/<key>_<1|2|3>.webp)"""
import os, sys, glob, json
import numpy as np
from PIL import Image
from scipy import ndimage

def seam(a, lo, hi):
    """min-cost top→bottom path with x in [lo, hi); returns x per row"""
    H = a.shape[0]
    cost = a[:, lo:hi].astype(np.float64) + 0.002
    acc = cost.copy(); back = np.zeros_like(cost, dtype=np.int8)
    for y in range(1, H):
        prev = acc[y - 1]
        l = np.r_[np.inf, prev[:-1]] + 0.01; r = np.r_[prev[1:], np.inf] + 0.01
        stack = np.vstack([l, prev, r]); k = stack.argmin(0)
        acc[y] = cost[y] + stack[k, np.arange(stack.shape[1])]; back[y] = k - 1
    x = int(acc[-1].argmin()); path = [0] * H
    for y in range(H - 1, -1, -1):
        path[y] = x + lo; x = max(0, min(hi - lo - 1, x + int(back[y, x])))
    return np.array(path)

def split(img):
    rgba = np.asarray(img.convert("RGBA")); a = rgba[..., 3].astype(np.float32) / 255
    H, W = a.shape
    # drop tiny specks (cell number labels etc.)
    lab, n = ndimage.label(a > 0.3)
    if n:
        sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1)); big = sizes.max()
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > big * 0.02])
        a = np.where(ndimage.binary_dilation(keep, iterations=3), a, 0)
    cols = a.sum(0); xs = np.where(cols > 1)[0]; x0, x1 = xs.min(), xs.max()
    span = x1 - x0
    s1 = seam(a, x0 + int(span * .16), x0 + int(span * .48))
    s2 = seam(a, x0 + int(span * .42), x0 + int(span * .80))
    X = np.arange(W)[None, :]
    parts = [X < s1[:, None], (X >= s1[:, None]) & (X < s2[:, None]), X >= s2[:, None]]
    out = []
    for m in parts:
        al = np.where(m, a, 0)
        lab, n = ndimage.label(al > 0.3)
        if n > 1:   # keep the main body (+ big detached bits like a tail), drop slivers of the neighbour
            sz = ndimage.sum(np.ones_like(al), lab, range(1, n + 1)); big = sz.max()
            keep = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s > big * 0.08])
            al = np.where(ndimage.binary_dilation(keep, iterations=3), al, 0)
        ys, xs = np.where(al > 0.02)
        y0, y1, xa, xb = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        o = rgba[y0:y1, xa:xb].copy(); o[..., 3] = (al[y0:y1, xa:xb] * 255).astype(np.uint8)
        out.append(Image.fromarray(o, "RGBA"))
    return out

if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]; os.makedirs(dst, exist_ok=True)
    names = json.load(open(os.path.join(os.path.dirname(__file__), "breed_names.json")))
    meta = {}
    for p in sorted(glob.glob(os.path.join(src, "*.png"))):
        cell = os.path.splitext(os.path.basename(p))[0]
        key = names.get(cell)
        if not key: continue
        ims = split(Image.open(p))
        meta[key] = []
        for k, im in enumerate(ims, 1):
            if im.height > 640: im = im.resize((round(im.width * 640 / im.height), 640), Image.LANCZOS)
            im.save(os.path.join(dst, f"{key}_{k}.webp"), quality=86, alpha_quality=92, method=6)
            meta[key].append([im.width, im.height])
        print(key, meta[key])
    json.dump(meta, open(os.path.join(dst, "sizes.json"), "w"))
