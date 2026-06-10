# 中午吃什么

这是 `zhongwuchishenme.xyz` 的 Cloudflare Pages 静态站点。项目不需要构建命令，直接上传本文件夹即可。

## 本地预览

直接用浏览器打开：

```text
zhongwuchishenme/index.html
```

## Cloudflare Pages 部署

1. 登录 Cloudflare。
2. 进入 **Workers & Pages**。
3. 创建 Pages 项目。
4. 选择 **Direct Upload**。
5. 上传 `zhongwuchishenme` 文件夹，或先压缩成 zip 后上传。
6. 部署完成后，Cloudflare 会给你一个 `*.pages.dev` 临时网址。

## 绑定域名

在 Cloudflare Pages 项目中进入 **Custom domains**，添加：

```text
zhongwuchishenme.xyz
www.zhongwuchishenme.xyz
```

Cloudflare 会提示你需要的 DNS 设置。

## 阿里云域名 DNS

因为域名是在阿里云购买的，推荐把整个域名接入 Cloudflare：

1. 在 Cloudflare 添加站点 `zhongwuchishenme.xyz`。
2. Cloudflare 会分配两个 nameserver，例如类似：

```text
xxx.ns.cloudflare.com
yyy.ns.cloudflare.com
```

3. 登录阿里云域名控制台。
4. 找到 `zhongwuchishenme.xyz`。
5. 修改 DNS 服务器为 Cloudflare 给出的两个 nameserver。
6. 等待生效，通常几分钟到几小时，最长可能 24-48 小时。

Cloudflare Pages 绑定成功后，访问 `https://zhongwuchishenme.xyz` 即可打开网站。
