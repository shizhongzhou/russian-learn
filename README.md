# 猫猫俄语通

学俄语，养一只猫。面向中文学习者的免费俄语学习 App（可添加到手机桌面）：<https://shizhongzhou.github.io/russian-learn/>

## 2026-10-31 更新包（r10）

- [安卓 APK](https://github.com/shizhongzhou/russian-learn/releases/download/ios-latest/MaoMaoRussian-20261031-preview.apk)
- [Xcode 工程包](https://github.com/shizhongzhou/russian-learn/releases/download/ios-latest/MaoMao-Xcode-20261031.zip)
- [教材、高清宠物与模型资源包](https://github.com/shizhongzhou/russian-learn/releases/download/ios-latest/MaoMao-Resources-20261031.zip)
- [本轮更新与验证范围](UPDATE-20261031.md)

宠物页新增小橘“跑一跑”：播放 5 秒原地跑步预览，动作以 60 Hz 采样；设备实际帧率取决于浏览器和硬件。保留已有蹭蹭动作，未经验证的自动眨眼保持关闭。新的睡眠、进食及其他连续动作仍需验收，以下历史玩法说明不代表这些新动画已完成。

源码与大资源分开保存。从源码构建或部署前，先在仓库根目录运行：

```sh
python3 scripts/import-app-assets.py
```

脚本读取 `app-assets.json`，下载本轮 Release 资源包并校验压缩包、文件大小和逐文件 SHA-256，再还原模型、声音、教材及相关图片。`native/scripts/prepare-web.sh` 和网页发布流程也会执行还原；只检出源码不能保证资源齐全。APK 已通过签名校验，但未进行本轮真机安装；Xcode 工程包已检查内容，未进行本轮原生编译或真机运行。下载资产及云端发布是否就绪，以实际 Release 和部署结果为准。

## 内容

| 等级 | 新增词汇 | 累计 |
|---|---|---|
| A1 | 1 000 | 1 000 |
| A2 | 1 000 | 2 000 |
| B1 | 3 000 | 5 000 |
| B2 | 5 000 | 10 000 |
| C1 | 5 000 | 15 000 |
| C2 | 4 815 | 19 815 |

每个等级包含：

- **单词**：本级全部词汇，带重音、词性、中文释义，点击发音，可搜索、按词性筛选。
- **对话**：情景对话，两个角色用不同声音朗读，逐句中文翻译。
- **听力**：先只听不看，再答题，最后显示原文和翻译核对。
- **新闻**：根据近期真实新闻按该级难度改写的俄文短文，逐句中文翻译，可选慢速 / 正常 / 倍速朗读。

朗读使用浏览器自带的俄语语音（Web Speech API）。电脑上推荐 Chrome 或 Edge；手机上如果没有声音，请在系统设置中下载俄语语音包。

## 猫咪玩法

- 注册（本机档案）后选择猫咪品种（布偶、橘猫、英短蓝猫、三花、黑猫）并起名。
- 学习赚**猫粮和水**：答对题、背会单词、听完对话/听力/新闻、读完文章、跟读、写作、通过等级考试。
- 成长值越高，猫越胖越可爱（小奶猫 → 铃铛小猫 → 蝴蝶结萌猫 → 花环小仙猫），并解锁逗猫棒、猫窝、猫爬架等。
- 不学习：1 天会饿、2 天会渴、3 天变瘦、7 天生病，需要在宠物医院用猫粮和水买药，再连续学习 3 天康复。
- 猫咪会在主页小窝和学习页面里走动、睡觉、吃饭；点它会喵叫。
- 数据保存在浏览器本地（localStorage），暂不支持云同步。“桌面陪伴”需要后续的安卓原生 App。

## 文件结构

```
index.html   页面
style.css    样式
cat.js       猫咪、小窝场景的绘制和喵叫声
pet.js       猫咪状态、奖励、成长、生病
app.js       学习内容（单词、语法、对话、听力、新闻）
pages.js     主页、学习、每日测验、喵喵、小卖部、医院、账号
study.js     背单词、写作、等级考试
sw.js / manifest.webmanifest / icons/   PWA
data/words_XX.json    各级词汇：[带重音的词, 中文, 词性, 性/体, 英文]
data/content_XX.json  各级对话、听力、新闻
```

更新新闻只需编辑对应的 `data/content_XX.json` 中的 `news` 数组。

## 数据来源与许可

- 词形、重音和英文释义来自 [OpenRussian 词典数据](https://github.com/Badestrand/russian-dictionary)（CC BY-SA 4.0），词汇表因此同样以 **CC BY-SA 4.0** 发布。
- 词频排序来自 [wordfreq](https://github.com/rspeer/wordfreq)。
- 等级按词频划分（A1 为最常用的 1000 词，以此类推），与官方 ТРКИ 词表不完全一致，仅供参考。
- 中文释义、对话、听力和新闻改写为本站原创；新闻注明了信息来源。
