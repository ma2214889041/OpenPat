<div align="center">
  <h1>🦞 OpenPat</h1>
  <p><strong>给你的 OpenClaw Agent 一张脸</strong></p>
  <p>看龙虾 · 养龙虾 · 晒龙虾</p>
  <p>
    <a href="https://openpat.dev">openpat.dev</a> ·
    <a href="#快速开始">快速开始</a> ·
    <a href="#功能">功能</a> ·
    <a href="#部署">部署</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
    <img src="https://img.shields.io/badge/OpenClaw-compatible-red" />
  </p>
</div>

---

> **OpenClaw** 是增长最快的开源 AI Agent 框架（316K+ ⭐）。OpenPat 是它的社交文化产品：给你的 Agent 一只可爱龙虾的形象，看它实时工作、成长、拿成就，一键生成炫耀卡片晒给朋友。

## 快速开始

```bash
npx openpat
```

打开浏览器，填入 Gateway 地址和 Token，你的龙虾就活了。

**自动检测：** 如果已安装 OpenClaw，`npx openpat` 会自动读取 `~/.openclaw/openclaw.json`，无需手动填写。

## 功能

### 🦞 龙虾状态动画

7 种状态，每种独立 CSS 动画：

| 状态 | 龙虾表现 |
|------|---------|
| `idle` | 慵懒摆动触角，悠闲泡澡 |
| `thinking` | 挠头、眼睛转动、冒泡泡 |
| `tool_call` | 举起大钳子忙碌，钳子闪电 |
| `done` | 开心蹦跳，弹出 ✔，撒花 🎉 |
| `error` | 趴倒冒问号 |
| `token_exhausted` | 眼皮下垂、💸 图标 |
| `offline` | 盖着小被子打呼 zzZ |

### 📸 炫耀卡片

- PNG（4:5 / 1:1）+ 动态 GIF
- 6 种模板：**龙虾战报**（拟人叙述）、日报、高光、翻车、深夜、账单
- 战报自动生成有趣文案，例如：
  > "你的龙虾今天调用了 47 次工具，成功率 100%，零翻车。花了 $0.73，比一颗糖还便宜 🎉"
- 本地生成，数据不离开设备

### 🏆 成就系统（19 个）

分四档稀有度，从破壳到龙虾神：

| 稀有度 | 成就 |
|--------|------|
| 普通 | 破壳 🐣、第一次调用 🔧、初出茅庐 ✅、数据小白 📊 |
| 稀有 | 一击必杀 🎯、省钱小能手 🛡️、夜猫子 🌙、换装达人 🎨、社交龙虾 📸 … |
| 史诗 | 零翻车周 💎、千里之行 🏆、常驻居民 🌍、全知全能 🔮 |
| 传说 | 龙虾神 👑、万人迷 🌟、全皮肤收集者 🎭 |

### 🎨 皮肤系统

6 款皮肤，**全部免费**：

| 皮肤 | 风格 |
|------|------|
| 经典红虾 🦞 | 原汁原味 |
| 赛博龙虾 🤖 | 霓虹蓝紫 |
| 像素龙虾 👾 | 8-bit 复古 |
| 黄金龙虾 👑 | 传说金色 |
| 太空龙虾 🚀 | 深空蓝 |
| 国潮龙虾 🐉 | 朱砂红+金 |

### 🌐 龙虾名片页

登录后获得专属链接 `openpat.dev/u/你的用户名`：

- 实时展示龙虾工作状态（Supabase Realtime 推送）
- 自动生成个性称号（零翻车之王 / 深夜代码龙虾 / Token节俭大师…）
- 成就徽章按稀有度配色展示
- 访客可实时看到你的龙虾在干什么

### 🌐 龙虾广场

全球最活跃的龙虾们排行榜，可按任务数 / 算力 / 工具调用数切换，点击跳转对方名片页。

## 技术架构

```
Browser (React 19 + Vite)
  └─ WebSocket → OpenClaw Gateway (operator.read)
  └─ Supabase Auth (可选 GitHub/Google 登录)
  └─ Supabase Realtime (名片页实时状态)

部署:
  └─ Cloudflare Pages (前端)
  └─ Supabase (Auth + DB + Realtime)
```

## 环境变量

```bash
cp .env.example .env.local

# 填入 Supabase key（可选，无则本地模式）
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
```

## 部署

### Cloudflare Pages（推荐）

```bash
npm run build
# Build command: npm run build
# Output directory: dist
# 添加 _redirects: /* /index.html 200
```

### Supabase 数据库初始化

在 Supabase SQL Editor 运行 `supabase/schema.sql`。

## 本地开发

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # 构建生产版本
node cli/index.js    # CLI 模式（自动检测 OpenClaw config）
```

## 隐私

- Gateway Token 仅保存在本地 localStorage，不上传到任何服务器
- 只读取 Gateway 状态事件（`operator.read` scope），不读取任何业务数据
- 分享卡片在本地生成，不经过任何服务器
- 上云的只有纯状态枚举值和脱敏统计数字
- 完全开源，MIT License

## License

MIT © 2026 OpenPat Contributors

---

<div align="center">
  <p>🦞 The Lobster Way</p>
  <code>npx openpat</code>
</div>
