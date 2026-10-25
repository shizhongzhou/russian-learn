#!/usr/bin/env bash
# After `npx cap add ios`: permissions, names, icon and splash.
set -euo pipefail
cd "$(dirname "$0")/.."
PL=ios/App/App/Info.plist
pb() { /usr/libexec/PlistBuddy -c "$1" "$PL" 2>/dev/null || true; }
pb "Add :NSMicrophoneUsageDescription string 跟读练习需要用麦克风听你读俄语并打分"
pb "Set :NSMicrophoneUsageDescription 跟读练习需要用麦克风听你读俄语并打分"
pb "Add :NSSpeechRecognitionUsageDescription string 用 iPhone 的语音识别给你的俄语发音打分"
pb "Set :NSSpeechRecognitionUsageDescription 用 iPhone 的语音识别给你的俄语发音打分"
pb "Set :CFBundleDisplayName 猫猫俄语通"
pb "Add :CFBundleDisplayName string 猫猫俄语通"
pb "Add :ITSAppUsesNonExemptEncryption bool false"
pb "Delete :UISupportedInterfaceOrientations"
pb "Add :UISupportedInterfaceOrientations array"
pb "Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationPortrait"
pb "Add :UIRequiresFullScreen bool true"
# app icon (single 1024 image)
ICON_DIR=ios/App/App/Assets.xcassets/AppIcon.appiconset
for f in "$ICON_DIR"/*.png; do cp assets/AppIcon-1024.png "$f"; done
# splash screen
SPL=ios/App/App/Assets.xcassets/Splash.imageset
if [ -d "$SPL" ]; then for f in "$SPL"/*.png; do cp assets/splash-2732.png "$f"; done; fi
echo "iOS project patched"
