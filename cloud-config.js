/* 云开发（腾讯云 CloudBase）连接配置。
   env：云开发环境 ID；accessKey：控制台「API Key 配置」里的 Publishable Key（可以公开，放在前端没问题）。
   留空时 App 照常离线使用，排行榜 / 好友 / 同步入口会显示“云服务还没开启”。 */
window.CLOUD_CONFIG = {
  env: "",
  accessKey: "",
  region: "ap-shanghai",
};
