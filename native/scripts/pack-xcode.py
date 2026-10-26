#!/usr/bin/env python3
"""Make a self-contained Xcode project folder: no npm, no CocoaPods, no network for Capacitor.
Usage: pack-xcode.py <native dir> <resolved spm dir> <output dir>"""
import os, re, shutil, sys, glob
native, spm, out = sys.argv[1:4]
dst = os.path.join(out, "native")
os.makedirs(dst, exist_ok=True)
shutil.copytree(os.path.join(native, "ios"), os.path.join(dst, "ios"), symlinks=True,
                ignore=shutil.ignore_patterns("build", "DerivedData", "Payload"))
cap_pkg = os.path.join(native, "ios/App/CapApp-SPM/Package.swift")
src = open(cap_pkg).read()
# 1) plugins referenced by path → copy just what iOS needs
for rel in re.findall(r'path: "\.\./\.\./\.\./node_modules/([^"]+)"', src):
    s, d = os.path.join(native, "node_modules", rel), os.path.join(dst, "node_modules", rel)
    shutil.copytree(s, d, symlinks=True, ignore=shutil.ignore_patterns("android", "node_modules", "example*", "*.md"))
# 2) vendor capacitor-swift-pm with its binary xcframeworks, referenced by local path
co = os.path.join(spm, "checkouts", "capacitor-swift-pm")
cdst = os.path.join(dst, "capacitor-swift-pm")
shutil.copytree(co, cdst, symlinks=True, ignore=shutil.ignore_patterns(".git", ".github", ".swiftpm"))
os.system(f'chmod -R u+w "{dst}"')   # SwiftPM checkouts are read-only
pkg = open(os.path.join(cdst, "Package.swift")).read()
for name in re.findall(r'\.binaryTarget\(\s*name:\s*"([^"]+)"', pkg):
    fw = glob.glob(os.path.join(spm, "artifacts", "**", name + ".xcframework"), recursive=True)
    assert fw, f"xcframework for {name} not found"
    shutil.copytree(fw[0], os.path.join(cdst, name + ".xcframework"), symlinks=True)
    pkg = re.sub(r'\.binaryTarget\(\s*name:\s*"%s"\s*,\s*url:\s*"[^"]*"\s*,\s*checksum:\s*"[^"]*"\s*\)' % name,
                 f'.binaryTarget(name: "{name}", path: "{name}.xcframework")', pkg)
assert "url:" not in pkg, pkg
open(os.path.join(cdst, "Package.swift"), "w").write(pkg)
os.system(f'chmod -R u+w "{dst}"')
# 3) point every Package.swift at the local copy
remote = re.compile(r'\.package\(\s*url:\s*"https://github\.com/ionic-team/capacitor-swift-pm(?:\.git)?"\s*,[^)]*\)')
for f in glob.glob(os.path.join(dst, "**", "Package.swift"), recursive=True):
    if os.path.dirname(f) == cdst: continue
    rel = os.path.relpath(cdst, os.path.dirname(f))
    t = remote.sub(f'.package(name: "capacitor-swift-pm", path: "{rel}")', open(f).read())
    open(f, "w").write(t)
    left = [l for l in t.splitlines() if ".package(url:" in l]
    assert not left, (f, left)
# 4) drop stale pins
for f in glob.glob(os.path.join(dst, "ios", "**", "Package.resolved"), recursive=True): os.remove(f)
print("packed", dst)
