<div align="center">
  <h1>OpenPat</h1>
  <p><strong>你的 AI Agent 专属陪伴伙伴</strong></p>
  <p>实时陪伴 · 记录成长 · 一键分享</p>
  <p>
    <a href="https://github.com/ma2214889041/OpenPat">GitHub</a> ·
    <a href="#快速开始">快速开始</a> ·
    <a href="#功能">功能</a> ·
    <a href="#部署">部署</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
    <img src="https://img.shields.io/badge/OpenClaw-compatible-8B8BFF" />
    <img src="https://img.shields.io/github/stars/ma2214889041/OpenPat?style=flat" />
  </p>
</div>

---

> OpenPat 把你的 OpenClaw AI Agent 变成一只有生命的虚拟伙伴 — 实时反映工作状态、陪你走过每一个任务、记录你们一起成长的故事，并让你一键生成精美卡片分享给朋友。

## 快速开始

```bash
npx openpat
```

打开浏览器，填入 Gateway 地址和 Token，你的伙伴就出现了。

**自动检测：** 如果已安装 OpenClaw，`npx openpat` 会自动读取 `~/.openclaw/openclaw.json`，无需手动填写。

## 功能

### 实时状态伙伴

7 种状态，独立动画，真实反映 Agent 工作节奏：

| 状态 | 表现 |
|------|------|
| `idle` | 悠闲等待，随时待命 |
| `thinking` | 认真思考中，不要打扰 |
| `tool_call` | 全力以赴，干劲十足 |
| `done` | 任务完成，开心庆祝 🎉 |
| `error` | 遇到问题，努力恢复 |
| `token_exhausted` | 能量耗尽，需要补给 |
| `offline` | 安静休眠，明天见 |

### 分享卡片

- PNG（4:5 / 1:1）+ 动态 GIF
- 6 种模板：战报、日报、高光、翻车、深夜、账单
- 自动生成有趣文案：
  > "今天完成了 47 次工具调用，成功率 100%，总花费 $0.73，比一杯咖啡还划算 ☕"
- 本地生成，数据不离开你的设备

### 成就系统（19 个）

分四档稀有度，记录你们共同经历的每一个里程碑：

| 稀有度 | 示例 |
|--------|------|
| 普通 | 初次连接 🔧、完成第一个任务 ✅ |
| 稀有 | 零失误任务 🎯、省钱达人 🛡️、夜猫子 🌙 |
| 史诗 | 零翻车周 💎、千次任务 🏆 |
| 传说 | 全成就解锁 👑、全皮肤收集 🎭 |

### 皮肤系统

支持管理员上传自定义皮肤帧，赋予伙伴独特的外貌。

### 公开主页

登录后获得专属链接 `openpat.dev/u/你的用户名`：

- 实时展示工作状态（Supabase Realtime）
- 自动生成个性称号
- 成就徽章展示
- 访客可实时围观

### 排行榜

查看全球最活跃的伙伴们，按任务数 / 算力 / 工具调用数切换，点击跳转对方主页。

## 路线图

| 状态 | 计划 |
|------|------|
| ✅ 已完成 | 实时状态动画、分享卡片、成就系统、公开主页、排行榜 |
| 🚧 进行中 | 自定义皮肤上传、GIF 导出优化 |
| 📱 计划中 | 手机端实时推送 — 任务完成/报错直接通知到手机 |
| 🎮 探索中 | 更丰富的互动玩法，让伙伴真正"活"起来 |
| 🔮 未来愿景 | 创作者社区 — 设计皮肤并发布获得收益；硬件实体版（Tamagotchi 风格） |

## 技术架构

```
Browser (React 19 + Vite)
  └─ WebSocket → OpenClaw Gateway (operator.read)
  └─ Supabase Auth（可选 GitHub/Google 登录）
  └─ Supabase Realtime（公开主页实时状态）

部署:
  └─ Cloudflare Pages（前端）
  └─ Supabase（Auth + DB + Realtime）
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
```

## 隐私

- Gateway Token 仅保存在本地 localStorage，不上传到任何服务器
- 只读取 Gateway 状态事件（`operator.read` scope），不读取任何业务数据
- 分享卡片在本地生成，不经过任何服务器
- 上云的只有纯状态枚举值和脱敏统计数字
- 完全开源，MIT License

## Contributing

欢迎提交 PR 和 Issue！你也可以设计皮肤、翻译文档、分享使用体验。

## License

MIT © 2026 OpenPat Contributors

---

<div align="center">
  <p>陪你工作，见证每一步。</p>
  <code>npx openpat</code>
</div>
