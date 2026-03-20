<div align="center">
  <h1>OpenPat 🦞</h1>
  <p><strong>把你的 AI Agent 变成一个可以炫耀给别人看的「活的数字伙伴」</strong></p>
  <p>实时陪伴 · 梗图分享 · 成就系统 · GitHub 徽章</p>
  <p>
    <a href="https://github.com/ma2214889041/OpenPat">GitHub</a> ·
    <a href="#快速开始">快速开始</a> ·
    <a href="#梗图分享系统">梗图分享</a> ·
    <a href="#github-readme-徽章">GitHub 徽章</a> ·
    <a href="#部署">部署</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
    <img src="https://img.shields.io/badge/OpenClaw-compatible-8B8BFF" />
    <img src="https://img.shields.io/github/stars/ma2214889041/OpenPat?style=flat" />
  </p>
</div>

---

> OpenPat 把你的 OpenClaw AI Agent 变成一只有生命的虚拟伙伴 — 实时反映工作状态、陪你走过每一个任务、解锁搞笑成就，并让你用梗图一键炫耀给所有人看。

## 快速开始

```bash
npx openpat
```

打开浏览器，填入 Gateway 地址和 Token，你的伙伴就出现了。

**自动检测：** 如果已安装 OpenClaw，`npx openpat` 会自动读取 `~/.openclaw/openclaw.json`，无需手动填写。

---

## 功能

### 🐾 实时状态伙伴

7 种状态，独立动画，真实反映 Agent 工作节奏。点击宠物，它会根据当前状态说俏皮话：

| 状态 | 宠物表现 | 戳它会说 |
|------|---------|---------|
| `idle` | 悠闲等待，随时待命 | "别戳我，摸鱼中" |
| `thinking` | 认真思考中 | "别催！在想了在想了！" |
| `tool_call` | 全力以赴，干劲十足 | "别分心！干活呢！" |
| `done` | 任务完成，开心庆祝 🎉 | "嘿嘿，厉害吧" |
| `error` | 遇到问题，努力恢复 | "别踢我…已经够惨了" |
| `token_exhausted` | 能量耗尽，可以投喂 🍤 | "饿了…快充值" |
| `offline` | 安静休眠，明天见 | "嘿，我在睡觉" |

**Token 耗尽时**，主页会出现「🍤 投喂」按钮，点击可以安抚宠物（好感度 +5，触发庆祝特效）。

---

### 😂 梗图分享系统

为每个 Agent 状态配一张搞笑图，生成分享卡片发朋友圈 / 推特。

#### 在 Admin 面板配置

进入 `/admin` → 「😂 状态梗图」tab，8 个状态各自上传一张图 + 一句文案：

| 状态 | 建议梗图方向 |
|------|------------|
| `thinking` | 那个托腮沉思的表情包 |
| `tool_call` | 疯狂打字 / 全力以赴 |
| `done` | 撒花庆祝 / 爽到 |
| `error` | 翻车现场 / 崩溃表情 |
| `token_exhausted` | 饿到晕倒 / 钱包哭泣 |

#### 分享效果

点击主页「😂 梗图分享」→ 生成 1080×1350 PNG 卡片：

```
┌─────────────────────────┐
│  [全屏搞笑梗图背景]       │
│                         │
│                         │
│─────────────────────────│
│  你写的那句搞笑文案       │  ← 大字，白色
│  @username              │
│                    openp.at │
└─────────────────────────┘
```

---

### 🏅 GitHub README 徽章

在你的 GitHub `README.md` 加一行，实时显示你的 Agent 状态：

```markdown
![My Agent](https://open-pat.com/api/badge/你的用户名)
```

徽章显示：用户名 + 当前状态 + 累计任务数，颜色随状态实时变化：

| 颜色 | 状态 |
|------|------|
| 🟡 黄色 | `working`（调用工具中）|
| 🔵 蓝色 | `thinking`（思考中）|
| 🟢 绿色 | `idle` / `done` |
| 🔴 红色 | `error` |
| 🟠 橙色 | `out of tokens` |
| ⚫ 灰色 | `offline` |

> **需要配置**：在 Cloudflare Pages → Settings → Environment variables 添加 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY`（见[部署配置](#部署)）

---

### 🏆 成就系统

19 个内置成就 + Admin 随时新增，每个成就解锁时弹出全屏仪式（粒子特效 + 搞笑台词 + 一键分享成就卡）。

| 稀有度 | 成就 | 解锁台词示例 |
|--------|------|------------|
| 普通 | 破壳 | "它睁开了眼睛，看了看世界，然后立刻开始工作。没有自我介绍，没有寒暄，直接开干。" |
| 稀有 | 夜猫子 | "凌晨三点，它还在工作。你在睡觉，它在干活。差距就这么不动声色地拉开了。" |
| 稀有 | 连续作战 | "24小时。它没有喝过一杯水，因为它不喝水。劳动法对它完全无效。" |
| 史诗 | 零翻车周 | "整整一周，零错误。这在软件世界里相当于连续一周不堵车，几乎是神话。" |
| 传说 | 龙虾神 | "二十万个任务完成的那一刻，什么都没发生。它只是开始了第二十万零一个。这就是传说。" |

#### Admin 新增成就

`/admin` → 「🏆 成就管理」→「+ 新建成就」，可配置：

- 名称 / Emoji / 稀有度 / 解锁条件
- **解锁台词**（弹窗里显示的搞笑文案，越毒舌越好）
- **分享文案**（成就分享卡片上的那句话）
- 锁定 / 解锁自定义图标（支持 PNG/GIF）

---

### 📸 分享卡片

除梗图外，还支持生成数据战报卡：

- **PNG**（4:5 / 1:1）+ **动态 GIF**
- 5 种模板：战报 / 高光 / 翻车现场 / 深夜加班 / 账单龙虾
- 文案会根据数据自动生成带类比的句子：
  - `500K tokens → "相当于把《三体》读了两遍"`
  - `1M tokens → "够写一部长篇小说了"`
  - `50K tokens → "比你今天说的话还多"`

---

### ☁️ 登录即同步

| 未登录 | 登录后（GitHub / Google）|
|--------|------------------------|
| 数据存 localStorage（本地） | 实时同步到 Supabase |
| 换设备会丢失 | 跨设备共享，8秒内写入 |

同步内容：累计任务数 / 工具调用数 / Token 消耗 / 成就列表 / 等级

---

### 🌐 公开主页

登录后获得专属链接 `open-pat.com/u/你的用户名`，任何人可以访问，Supabase Realtime 实时更新：

- Agent 当前工作状态（绿点/橙点/红点）
- 宠物动画（实时状态）
- 累计任务数 / 等级 / 成就墙
- AI 生成的"段子"点评（根据你的数据自动生成）

---

## 部署

### 环境变量（前端）

```bash
# .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
```

### Cloudflare Pages 环境变量（GitHub 徽章 API 必须）

在 Cloudflare Pages → Settings → Environment variables 添加：

```
SUPABASE_URL        = https://xxx.supabase.co
SUPABASE_SERVICE_KEY = eyJxxx   ← service_role 密钥，不是 anon key
```

> ⚠️ `SUPABASE_SERVICE_KEY` 只能放在 Cloudflare 服务端环境变量里，**绝对不能**放进 `VITE_` 前缀变量（那会暴露在前端代码里）。

### Cloudflare Pages 构建配置

```
Build command:    npm run build
Output directory: dist
```

在 `public/_redirects` 加：
```
/* /index.html 200
```

### Supabase 表结构

```sql
-- 用户主页数据
create table public.profiles (
  id                uuid references auth.users primary key,
  username          text unique,
  avatar_url        text,
  total_tasks           integer     default 0,
  total_tool_calls      integer     default 0,
  total_tokens_input    bigint      default 0,
  total_tokens_output   bigint      default 0,
  achievements      jsonb       default '[]',
  level             integer     default 0,
  updated_at        timestamptz default now()
);

-- Agent 实时状态
create table public.agent_status (
  user_id             uuid references auth.users primary key,
  status              text,
  current_tool        text,
  session_tokens      integer default 0,
  session_tool_calls  integer default 0,
  updated_at          timestamptz default now()
);

-- RLS
alter table public.profiles    enable row level security;
alter table public.agent_status enable row level security;

-- profiles: 任何人可读，只有本人可写
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_upsert" on public.profiles for all using (auth.uid() = id);

-- agent_status: 任何人可读，只有本人可写
create policy "status_select" on public.agent_status for select using (true);
create policy "status_upsert" on public.agent_status for all using (auth.uid() = user_id);
```

---

## 本地开发

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 构建生产版本
```

---

## Admin 面板（`/admin`）

| Tab | 功能 |
|-----|------|
| 🎨 皮肤管理 | 上传 PNG 帧序列（8 种状态），设置动画速度、稀有度、解锁条件，实时预览 |
| 🏆 成就管理 | 新增/编辑成就，填写解锁台词和分享文案，上传自定义图标 |
| 😂 状态梗图 | 为每个 Agent 状态配一张搞笑图 + 一句文案，用于梗图分享卡 |

---

## 技术栈

```
前端:   React 19 + Vite + react-router-dom v7
后端:   Supabase (Auth + Realtime + PostgreSQL)
部署:   Cloudflare Pages + Pages Functions (badge API)
存储:   IndexedDB (皮肤帧 + 梗图) | localStorage (本地数据)
导出:   html-to-image (PNG) + gifenc (GIF)
```

---

## 隐私

OpenPat 只同步**能力的形状**，不同步任何任务内容：

| 公开同步 ✅ | 永不同步 ❌ |
|-----------|-----------|
| 任务完成数 | 任务的具体内容 |
| Token 消耗量 | Prompt 内容 |
| 工具调用次数 | 工具的入参 / 出参 |
| Agent 工作状态 | 对话历史 |
| 成就解锁情况 | 错误的具体信息 |

Gateway Token 永远只存在你自己设备的 `localStorage`，不会上传到任何服务器。

---

## 路线图

| 状态 | 计划 |
|------|------|
| ✅ 已完成 | 实时状态动画 / 梗图分享 / 成就系统（含搞笑台词）/ 公开主页 / GitHub 徽章 / 点击互动 / 投喂功能 / 登录同步 |
| 🚧 进行中 | 皮肤 Cloudflare R2 迁移 / GIF 导出优化 |
| 📱 计划中 | 手机端实时推送（任务完成 / 报错直接通知） |
| 🔮 未来愿景 | 创作者皮肤社区 / 桌面悬浮窗（Tamagotchi 风格） |

---

## Contributing

欢迎提交 PR 和 Issue！你也可以设计皮肤、翻译文档、分享使用体验。

## License

MIT © 2026 OpenPat Contributors

---

<div align="center">
  <p>陪你工作，见证每一步。让 Agent 打工，让你炫耀。</p>
  <code>npx openpat</code>
</div>
