#!/usr/bin/env bash
# After `npx cap add android`: permissions, icons, splash, version, app name.
set -euo pipefail
cd "$(dirname "$0")/.."
RES=android/app/src/main/res
MAN=android/app/src/main/AndroidManifest.xml
A=assets/android
# icons
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  for k in ic_launcher ic_launcher_round ic_launcher_foreground; do
    [ -d "$RES/mipmap-$d" ] && cp "$A/$k-$d.png" "$RES/mipmap-$d/$k.png"
  done
done
mkdir -p $RES/values
cat > $RES/values/ic_launcher_background.xml <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources><color name="ic_launcher_background">#F6E2CC</color></resources>
XML
# splash: plain background + centred cat (no stretching)
find $RES -name 'splash.png' -delete
mkdir -p $RES/drawable-nodpi && cp $A/splash_cat.png $RES/drawable-nodpi/splash_cat.png
cat > $RES/drawable/splash.xml <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/mm_splash_bg"/>
  <item android:gravity="center" android:width="220dp" android:height="256dp" android:drawable="@drawable/splash_cat"/>
</layer-list>
XML
cat > $RES/values/mm_colors.xml <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources><color name="mm_splash_bg">#F6F1E9</color></resources>
XML
# app name
sed -i -E 's#<string name="app_name">[^<]*</string>#<string name="app_name">猫猫俄语通</string>#; s#<string name="title_activity_main">[^<]*</string>#<string name="title_activity_main">猫猫俄语通</string>#' $RES/values/strings.xml
# permissions + package visibility for speech recognition and text-to-speech
python3 - "$MAN" <<'PY'
import sys,re
p=sys.argv[1]; s=open(p).read()
add=''
for perm in ["android.permission.RECORD_AUDIO","android.permission.INTERNET"]:
    if perm not in s: add+=f'    <uses-permission android:name="{perm}" />\n'
if "<queries>" not in s:
    add+='    <queries>\n        <intent><action android:name="android.speech.RecognitionService" /></intent>\n        <intent><action android:name="android.intent.action.TTS_SERVICE" /></intent>\n    </queries>\n'
s=s.replace("</manifest>", add+"</manifest>")
s=s.replace('android:screenOrientation="', 'android:screenOrientation="') # keep
if 'screenOrientation' not in s:
    s=s.replace('android:name=".MainActivity"','android:name=".MainActivity"\n            android:screenOrientation="portrait"',1)
open(p,"w").write(s)
PY
# version code = build number
VC=${BUILD_NUMBER:-1}
for g in android/app/build.gradle android/app/build.gradle.kts; do
  [ -f "$g" ] && sed -i -E "s/versionCode( =)? [0-9]+/versionCode\1 $VC/; s/versionName( =)? \"[^\"]*\"/versionName\1 \"1.0.$VC\"/" "$g"
done
echo "Android project patched (versionCode $VC)"
