# CLAUDE.md — OpenPat AI 伴侣

## 项目是什么

一个有记忆的 AI 伴侣。能聊天、能帮忙、能记住用户。
产品名：拍拍 (OpenPat)

## 技术栈

- **LLM**: Gemini 3.1 Pro (function calling)
- **后端**: Cloudflare Pages Functions + D1 + R2 + KV
- **前端**: React (Vite)，核心页面 /chat
- **认证**: Supabase Auth (GitHub/Google)

## 核心架构

chat.js 是所有智力的入口：
```
用户消息 → 读记忆 → 拼 prompt → Gemini（可能调工具）→ 返回回复 → 后台提取记忆
```

## 记忆系统

- **user_profiles**: 核心画像，始终加载
- **memories**: 归档记忆，按相关性选 6 条注入
- **emotional_logs**: 情绪追踪
- **relationship_state**: 关系阶段 (stranger→confidant)
- 每 3 轮自动提取，>20 条记忆时自动整理

**当前够用，不要过度优化。等有真实用户反馈再迭代。**

## 工具

搜索、天气、记忆管理、提醒。通过 Gemini function calling 实现。

## 人格

温暖、真诚、偶尔俏皮。不谄媚、不敷衍。
关系阶段影响语气：陌生人礼貌，老朋友随意。

## 当前应该做的事

1. 确保聊天体验流畅，回复质量好
2. 确保记忆准确——说过的事下次能自然引用
3. 确定角色视觉风格
4. 有真实用户在用

## 不要做的事

- 不要在没有用户的时候优化记忆架构
- 不要加知识图谱、向量搜索等没有验证需求的功能
- 不要引入多 Agent 编排
- 不要每次对话都花 3 个 API 调用在记忆上（节省成本）

## 代码规范

- 注释英文，UI 中英双语
- 每个 API 调用 try/catch
- API keys 只用 Cloudflare secrets
- D1 prepared statements
