#!/usr/bin/env bash
# Copy the website into native/www (the folder Capacitor bundles into the app).
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=..
rm -rf www && mkdir -p www
cp "$ROOT"/index.html "$ROOT"/*.js "$ROOT"/*.css "$ROOT"/manifest.webmanifest www/
cp -R "$ROOT"/data "$ROOT"/icons "$ROOT"/img www/
[ -d "$ROOT"/vendor ] && cp -R "$ROOT"/vendor www/
rm -f www/sw.js   # service workers don't run inside the app's web view
# load the Capacitor runtime (for native plugins) before the app scripts
if [ -f node_modules/@capacitor/core/dist/capacitor.js ]; then
  cp node_modules/@capacitor/core/dist/capacitor.js www/capacitor.js
  perl -0pi -e 's#<script src="cat.js"></script>#<script src="capacitor.js"></script>\n<script src="cat.js"></script>#' www/index.html
fi
ls node_modules/@capacitor/core/dist/ || true
echo "web assets ready: $(du -sh www | cut -f1)"
