/opt/homebrew/Library/Homebrew/cmd/shellenv.sh: line 27: /bin/ps: Operation not permitted
# 俄语阶梯 · Русский шаг за шагом

免费的俄语学习网站，面向中文学习者：<https://shizhongzhou.github.io/russian-learn/>

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

朗读使用浏览器自带的俄语语音（Web Speech API）。电脑上推荐 Chrome 或 Edge；手机上如果没有声音，请在系统“文字转语音输出”设置中下载并启用俄语语音包，然后刷新页面。安卓浏览器若语音队列未启动，页面会自动尝试恢复并显示错误提示。

## 文件结构

```
index.html   页面
style.css    样式
app.js       全部交互逻辑（无需构建）
data/words_XX.json    各级词汇：[带重音的词, 中文, 词性, 性/体, 英文]
data/content_XX.json  各级对话、听力、新闻
```

更新新闻只需编辑对应的 `data/content_XX.json` 中的 `news` 数组。

## 数据来源与许可

- 词形、重音和英文释义来自 [OpenRussian 词典数据](https://github.com/Badestrand/russian-dictionary)（CC BY-SA 4.0），词汇表因此同样以 **CC BY-SA 4.0** 发布。
- 词频排序来自 [wordfreq](https://github.com/rspeer/wordfreq)。
- 等级按词频划分（A1 为最常用的 1000 词，以此类推），与官方 ТРКИ 词表不完全一致，仅供参考。
- 中文释义、对话、听力和新闻改写为本站原创；新闻注明了信息来源。
