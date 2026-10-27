# 猫猫俄语通 · 云端接入（腾讯云开发 CloudBase）

App 已经写好了云端功能：游客自动建档、手机号/邮箱验证码登录（Apple 登录预留）、云存档多设备同步、排行榜、好友（好友码、看对方的猫、送零食）、管理后台。
**只差把它连到你自己的腾讯云环境。** 在连上之前，App 照常离线可用，云端入口会显示“云服务还没开启”。

## 一、你需要在腾讯云做的事（约 20 分钟）

1. **注册并实名**：打开 <https://cloud.tencent.com> 注册，完成个人或企业实名认证。
2. **开通云开发**：进入「云开发 CloudBase」控制台 → 新建环境，地域选 **上海**，记下 **环境 ID**（形如 `maomao-1a2b3c`）。
3. **身份认证**（控制台 → 身份认证 / 登录方式）：
   - 打开 **匿名登录**（游客）；
   - 打开 **短信验证码登录**（需要购买短信资源包，按条计费）；
   - 打开 **邮箱验证码登录**，按提示填写发件邮箱（可用 QQ 邮箱 / 企业邮箱的 SMTP 授权码）。
4. **API Key**（控制台 → 环境配置 → API Key）：生成一个 **Publishable Key**，它可以公开放在前端。
5. **安全来源 / Web 安全域名**：添加
   - `shizhongzhou.github.io`、`localhost`
   - App 用的：`capacitor://localhost`（iPhone）、`https://localhost`（安卓）
   - 以后的正式域名（备案后）以及云开发静态托管的默认域名
6. **部署用的密钥**：「访问管理 CAM」→ API 密钥 → 新建密钥，得到 **SecretId / SecretKey**（只给 CloudBase 权限即可，**不要发给任何人或放进代码**）。

## 二、填进项目

- 把 **环境 ID** 和 **Publishable Key** 发给 Claude，或者自己填进项目根目录的 `cloud-config.js`。
- 在 GitHub 仓库 → Settings → Secrets and variables → Actions，新建这几个 secret：
  - `TCB_ENV_ID`：环境 ID
  - `TCB_SECRET_ID`、`TCB_SECRET_KEY`：上面第 6 步的密钥
  - `ADMIN_UIDS`：你的用户 ID（第一次登录后，在账号页能看到；多个用英文逗号隔开）

之后每次推送代码，GitHub 会自动：部署云函数 `api` → 把网站发布到云开发静态托管（国内 CDN）。

## 三、备案提醒

- **网站**：用自己的域名对外服务需要 ICP 备案；备案前可先用云开发给的默认域名测试。
- **App**：在国内应用商店上架需要做 **App 备案**（在腾讯云备案控制台办理，需要实名和 App 包名 `io.github.shizhongzhou.maomao`）。
- **Apple 登录**：需要付费的 Apple 开发者账号，并在控制台下载“自定义登录私钥”配置给云函数（环境变量 `TCB_CUSTOM_LOGIN_KEY`）。

## 数据结构

| 集合 | 内容 |
|---|---|
| `players` | 每个玩家一条（`_id` = 用户 ID）：昵称、猫、等级、连续天数、本周答对、好友码、完整存档 `state` |
| `friendships` | 好友关系（`a_b` 为主键，`pending` / `ok`） |
| `gifts` | 好友送的零食，玩家打开 App 时领取 |
| `daily_active` | 每日活跃记录（后台统计用） |

所有集合只允许云函数读写；客户端只能通过云函数 `api` 访问，身份由 CloudBase 登录态决定。
