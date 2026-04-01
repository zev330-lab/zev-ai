---
name: ANTHROPIC_API_KEY Vercel deployment status
description: Chat widget /api/chat status on live deployment — confirmed working with real Claude responses as of 2026-03-21
type: project
---

ANTHROPIC_API_KEY is confirmed active in the Vercel deployment (https://zev-ai-swart.vercel.app) as of 2026-03-21. The /api/chat route returns real Claude-generated responses (HTTP 200, JSON with AI-authored response text). Both the public chat widget and admin chat routes are operational.

**Why:** The key was previously missing (documented in prior test run). It has since been added. Verified live via `POST /api/chat` returning a full services breakdown response from claude-haiku-4-5-20251001.

**How to apply:** Chat is live and working. No fallback expected under normal conditions. If testing chat again and fallback re-appears, the key may have expired or been removed from Vercel env vars.
