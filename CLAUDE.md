# CLAUDE.md — OpenPat AI 伴侣

## 项目是什么

一个有记忆的 AI 宠物伴侣。能聊天、能帮忙、能记住用户、能主动关心。
产品名：拍拍 (OpenPat)

## 技术栈

- **LLM**: Gemini 3.1 Flash Lite (function calling + streaming)
- **后端**: Cloudflare Pages Functions + D1 + R2 + KV
- **前端**: React (Vite)，核心页面 /chat
- **认证**: Supabase Auth (GitHub/Google)

## 核心架构

chat.js 是所有智力的入口：
```
用户消息 → 加载画像+记忆(分数排序,零LLM) → 拼 prompt → Gemini(可能调工具/保存记忆) → 流式返回
                                                                                    ↓
                                                            后台: 关系更新 + 每5轮批量提取 + 对话摘要
```

## 3层记忆系统

**Tier 1 — Core Profile** (始终加载)
- `user_profiles`: core_summary, personality, preferences, emotional_baseline
- 更新时机: auto-dream 每24h重建

**Tier 2 — Active Memories** (分数排序 top 8, 零LLM调用)
- `memories` 表 → scoreMemory() 纯函数
- 分数 = importance(40%) + recency(25%) + recall(5%) + keyword(30%)

**Tier 3 — Archive** (auto-dream 整理)
- 全部 memories → 每24h 合并/删除/精简
- batchExtractMemories 每5轮补充提取

**记忆写入方式:**
1. LLM 回复时自己调 save_memory/update_memory (零额外成本)
2. 每5轮批量提取 (1次LLM调用/5轮)
3. 用户显式说"记住这个"

## 工具

搜索、天气、save_memory、update_memory、delete_memory。通过 Gemini function calling 实现。

## 人格

温暖、真诚、偶尔俏皮。不谄媚、不敷衍。像一个关心你的小宠物。
- 新用户: 好奇提问,主动了解
- 老朋友: 自然引用记忆,预判需求
- 关系阶段影响语气: stranger→acquaintance→friend→close_friend→confidant

## 当前应该做的事

1. 确保聊天体验流畅，回复质量好
2. 确保记忆准确——说过的事下次能自然引用
3. 获取真实用户
4. Web Push 通知（让 follow-up 真正推到用户手机）

## 不要做的事

- 不要加知识图谱、向量搜索等没有验证需求的功能
- 不要引入多 Agent 编排
- 不要每条消息都调额外 LLM（当前 ~0.15 calls/msg，保持低成本）
- 不要为了技术而技术——先有用户再迭代

## 代码规范

- 注释英文，UI 中英双语
- 每个 API 调用 try/catch
- API keys 只用 Cloudflare secrets
- D1 prepared statements
- 记忆内容必须经过 sanitizeMemoryContent 安全过滤
