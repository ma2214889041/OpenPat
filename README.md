<div align="center">
  <h1>🦞 Lobster Pet</h1>
  <p>把你的 OpenClaw AI Agent 变成一只会动的虚拟龙虾</p>
  <p>
    <a href="https://lobster.pet">lobster.pet</a> ·
    <a href="#快速开始">快速开始</a> ·
    <a href="#功能">功能</a> ·
    <a href="#部署">部署</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
    <img src="https://img.shields.io/badge/OpenClaw-compatible-red?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyeiIvPjwvc3ZnPg==" />
  </p>
</div>

---

> **OpenClaw** 是增长最快的开源 AI Agent 框架（302K+ ⭐）。Lobster Pet 是它的情感化伴侣工具：让你的 Agent 工作状态以一只可爱龙虾的形式呈现，并支持一键生成炫耀卡片分享到朋友圈。

## 快速开始

```bash
npx lobster-pet
```

打开浏览器，填入 Gateway 地址和 Token，你的龙虾就活了。

**自动检测 Token：** 如果你已经安装过 OpenClaw，`npx lobster-pet` 会自动读取 `~/.openclaw/openclaw.json` 中的配置，无需手动填写。

## 功能

### 🦞 龙虾状态动画

7 种状态，每种都有独立 CSS 动画：

| 状态 | 龙虾表现 |
|------|---------|
| `idle` | 慵懒摆动触角 |
| `thinking` | 挠头、眼睛转动、冒泡泡 |
| `tool_call` | 举起大钳子忙碌，钳子闪电 |
| `done` | 开心蹦跳，弹出 ✔ |
| `error` | 趴倒冒问号（点击查看错误日志）|
| `token_exhausted` | 眼皮下垂、💸 图标 |
| `offline` | 盖着小被子打呼 |

### 📊 实时数据面板

- Token 消耗（input/output 分开显示）
- 工具调用次数 & 成功率
- 当前任务运行时长
- 模型名称（默认隐藏，点击显示）
- 💰 成本估算（支持 7 种模型定价）

### 🎉 分享卡片

- PNG（1:1 / 9:16）+ 动态 GIF
- 5 种模板自动匹配场景：日报、高光、翻车、深夜、账单
- 自带 QR 码，纯本地生成，数据不离开设备

### 🦞 成长系统

```
虾苗 (0) → 小龙虾 (1K) → 大龙虾 (10K) → 霸王龙虾 (50K) → 龙虾神 (200K)
```

6 个成就：一击必杀 🎯、闪电侠 ⚡、省钱小能手 🛡️、夜猫子 🌙、连续作战 🔥、零翻车周 💎

### 🎨 皮肤系统

| 皮肤 | 价格 |
|------|------|
| 经典红虾 🦞 | 免费 |
| 赛博龙虾 🤖 | $4.99 |
| 像素龙虾 👾 | $4.99 |
| 黄金龙虾 👑 | $4.99 |
| 太空龙虾 🚀 | $4.99 |
| 国潮龙虾 🐉 | $4.99 |
| **终身赞助者包** 🎁 | **$9.99** |

### 🌐 公开状态页

登录 GitHub/Google 后，获得 `lobster.pet/u/你的用户名`，实时展示你的龙虾工作状态。

### 📛 GitHub README Badge

```markdown
[![Lobster Pet](https://lobster.pet/badge/你的用户名.svg)](https://lobster.pet/u/你的用户名)
```

### 👥 团队看板

添加多个 Agent，一个页面统一监控所有龙虾状态。

## 技术架构

```
Browser (React 19 + Vite)
  └─ WebSocket → OpenClaw Gateway (operator.read)
  └─ Supabase Auth (可选 GitHub/Google 登录)
  └─ Supabase Realtime (公开状态页)
  └─ Stripe (皮肤购买，可选)

部署:
  └─ Cloudflare Pages (前端)
  └─ Supabase (Auth + DB + Realtime + Edge Functions)
```

## 环境变量

```bash
# 复制模板
cp .env.example .env.local

# 填入你的 Supabase 项目 key（可选，无则本地模式）
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx

# 填入 Stripe key（可选，无则演示模式）
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

## 部署

### Cloudflare Pages（推荐）

```bash
npm run build
# 将 dist/ 目录部署到 Cloudflare Pages
# Build command: npm run build
# Output directory: dist
# 添加 _redirects: /* /index.html 200
```

### Supabase 数据库初始化

在 Supabase SQL Editor 运行 `supabase/schema.sql`。

### Stripe Webhook（皮肤购买）

部署 Supabase Edge Function：
```bash
supabase functions deploy stripe-webhook
supabase functions deploy badge
```

## 本地开发

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # 构建生产版本
node cli/index.js    # 以 CLI 模式运行（自动检测 OpenClaw config）
```

## 隐私

- Gateway Token 仅保存在本地 localStorage，不上传到任何服务器
- 只读取 Gateway 状态事件（`operator.read` scope），不读取任何业务数据
- 分享卡片在本地生成，不经过任何服务器
- 上云的只有纯状态枚举值（idle/thinking...）和脱敏统计数字
- 完全开源，MIT License，可自行审计所有代码

## License

MIT © 2026 Lobster Pet Contributors

---

<div align="center">
  <p>🦞 The Lobster Way</p>
  <code>npx lobster-pet</code>
</div>
