#!/usr/bin/env bash
# One-step setup on a Mac: builds the iOS project and opens it in Xcode.
# In Xcode: Signing & Capabilities → Team = your Apple ID, pick your iPhone, press ▶.
set -euo pipefail
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "需要先安装 Node.js：https://nodejs.org （下载 LTS 版安装后重新运行）"; exit 1; }
command -v xcodebuild >/dev/null || { echo "需要先在 App Store 安装 Xcode，并打开一次同意协议"; exit 1; }
if ! command -v pod >/dev/null; then
  echo "安装 CocoaPods（可能需要输入电脑密码）…"
  if command -v brew >/dev/null; then brew install cocoapods; else sudo gem install cocoapods; fi
fi
echo "① 安装 Capacitor…"
npm install --no-audit --no-fund --legacy-peer-deps
echo "② 复制网页内容…"
bash scripts/prepare-web.sh
echo "③ 生成 iOS 工程…"
if [ ! -d ios ]; then npx cap add ios --packagemanager CocoaPods || npx cap add ios; fi
bash scripts/patch-ios.sh
npx cap sync ios
echo "④ 打开 Xcode…"
npx cap open ios
cat <<'TXT'

在 Xcode 里：
  1. 左侧点最上面的 “App” → 中间选 “Signing & Capabilities”
  2. Team 选你的 Apple ID（没有就点 Add an Account… 登录）
  3. 如果提示 Bundle Identifier 被占用，把它改成 io.github.你的名字.maomao
  4. 用数据线连上 iPhone，顶部设备选你的 iPhone，按 ▶ 运行
  5. 第一次运行后在 iPhone：设置 → 通用 → VPN与设备管理 → 信任你的 Apple ID
     （iOS 16+ 还要：设置 → 隐私与安全性 → 开发者模式 → 打开，重启）
以后更新：在 russian-learn 目录 git pull，然后重新运行 bash native/setup-mac.sh
TXT
