<div align="center">

# QA Copilot

### AI-Powered QA Assistant

**Generate test plans, analyze code, write bug reports — powered by 9 AI providers.**

[![CI](https://github.com/ssrjkk/qa-helper/actions/workflows/ci.yml/badge.svg)](https://github.com/ssrjkk/qa-helper/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-160%20passed-22c55e)](#testing)
[![Bundle](https://img.shields.io/bundlejs/size/@minified?gzip=true&label=bundle&color=6366f1)](#tech-stack)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](#tech-stack)

[Quick Start](#quick-start) | [Features](#features) | [Providers](#ai-providers) | [Deploy](#deploy) | [Contributing](#contributing)

**[Russian / Русский](README.ru.md)**

</div>

---

## What is QA Copilot?

A browser-based QA assistant that turns your task descriptions into structured outputs — test plans, test cases, automation code, bug reports, security checks, and more. No server required. Runs entirely in your browser with SQLite (WebAssembly).

**Core idea:** Describe what you need, pick a task type, get a professional QA artifact.

<div align="center">

```
+----------------------------------------------------------+
|                                                          |
|   "Login page has form validation for email              |
|    and password fields, supports OAuth via               |
|    Google. Write test cases."                            |
|                                                          |
|   Task: Test Cases                                       |
|                                                          |
|   -> Execute                                             |
|                                                          |
|   +------------------------------------------+           |
|   | Test Case: TC-LOGIN-001                  |           |
|   | Title: Valid email + password login       |           |
|   | Steps: 1. Navigate to /login             |           |
|   |   2. Enter valid email                   |           |
|   |   3. Enter valid password                |           |
|   |   4. Click "Sign In"                     |           |
|   | Expected: Redirect to dashboard          |           |
|   | Priority: P0  |  Type: Functional        |           |
|   +------------------------------------------+           |
|                                                          |
+----------------------------------------------------------+
```

</div>

---

## Quick Start

**3 steps to your first QA output:**

```bash
git clone https://github.com/ssrjkk/qa-helper.git
cd qa-helper
npm install && npm run dev
```

Open `http://localhost:5173`, enter your API key, pick a task type, describe your context, and hit Execute.

> **No API key?** Use Groq or DeepSeek — both are free and don't require a credit card.

<details>
<summary><b>Docker</b></summary>

```bash
docker compose up -d
# Open http://localhost:3000
```
</details>

<details>
<summary><b>Production build</b></summary>

```bash
npm run build     # dist/ folder
npm run preview   # preview locally
```
</details>

---

## Features

<table>
<tr>
<td width="50%">

### 17 Task Types

**Generate** — Test Plans, Test Cases, Automation Code, API Tests, Load Tests, Mobile Tests, AI Model Tests

**Analyze** — Requirements Analysis, Observability, Quality Metrics

**Review** — Bug Reports, Code Review, Screenshot Analysis

**Setup** — Security Checks, CI/CD Pipelines, Checklists, Contract Tests

</td>
<td width="50%">

### Smart Features

- **Streaming responses** — output appears in real-time
- **Structured Memory** — AI extracts tech stack, bug patterns, conventions, and reuses them across tasks
- **Context Presets** — pre-built templates for E2E, Unit, API, Mobile testing
- **Agent Mode** — multi-step reasoning for complex QA tasks
- **Export** — Markdown, PDF, JSON, CSV, TXT
- **Session History** — virtualized list, search, load previous sessions

</td>
</tr>
<tr>
<td>

### Security

- AES-256-GCM encryption for API keys (PBKDF2)
- XSS sanitization on all inputs
- Parameterized SQL queries
- Rate limiting (10 req/min)
- Content Security Policy headers
- Master password protection

</td>
<td>

### Developer Experience

- **160 tests** (unit, integration, property-based)
- **16 E2E tests** (Playwright)
- **Lighthouse CI** in GitHub Actions
- Pre-commit hooks (eslint, lint-staged)
- Commitlint with conventional commits
- Strict TypeScript + ESLint zero warnings

</td>
</tr>
</table>

---

## AI Providers

QA Copilot supports **9 providers** with a unified interface. Pick any — the experience is identical.

| Provider | Free? | Default Model | Get Key |
|----------|-------|---------------|---------|
| **Groq** | Yes | `llama-3.3-70b-versatile` | [console.groq.com](https://console.groq.com) |
| **DeepSeek** | Yes | `deepseek-chat` | [platform.deepseek.com](https://platform.deepseek.com) |
| **Gemini** | Yes | `gemini-1.5-flash` | [ai.google.dev](https://ai.google.dev) |
| **OpenRouter** | Yes | `deepseek/deepseek-chat` | [openrouter.ai](https://openrouter.ai/keys) |
| **Together AI** | Yes | `meta-llama/Llama-3.3-70B-Instruct` | [api.together.ai](https://api.together.ai) |
| **Novita AI** | Yes | `deepseek/deepseek-chat` | [novita.ai](https://novita.ai) |
| **Lepton AI** | Yes | `llama-3.3-70b-instruct` | [lepton.ai](https://www.lepton.ai) |
| **Claude** | Paid | `claude-sonnet-4-20250514` | [console.anthropic.com](https://console.anthropic.com) |
| **OpenAI** | Paid | `gpt-4o-mini` | [platform.openai.com](https://platform.openai.com) |

---

## Architecture

```
src/
  components/
    features/          # App panels: ChatArea, Sidebar, TaskSelector, etc.
    ui/                # GlassCard, RippleButton, Modal, Toast, etc.
    layout/            # MainLayout
  config/              # Task types, prompts, presets, security config
  data/
    api/               # 9 AI provider services + UnifiedAiService
    codebase/          # GitHub & Local codebase connectors
    repositories/      # SQLite repositories (Project, Task, Memory)
  domain/
    entities/          # TypeScript models (Project, Task, Memory, Session)
    usecases/          # Business logic (ProjectUseCases, TaskUseCases, etc.)
  hooks/               # Custom hooks (useDatabase, useExecution, useTheme, etc.)
  lib/                 # Core services (database, encryption, export, storage)
  presentation/        # Context providers (UseCasesContext)
  store/               # Zustand state management
  __tests__/           # Unit, integration, property-based tests
```

**Data flow:** UI -> Zustand Store -> UseCases -> Repositories -> sql.js (WASM SQLite) -> IndexedDB persistence

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Execute task |
| `Ctrl/Cmd + Shift + C` | Copy output |
| `Ctrl/Cmd + T` | Toggle theme |
| `Escape` | Close modal |

---

## Testing

```bash
npm run test          # 160 unit/integration tests
npm run test:watch    # Watch mode
npm run test:e2e      # 16 Playwright E2E tests
```

**Test coverage:** utils, database, security, components, tasks, QaAgent, circuit breaker, zip parser, property-based (10k iterations).

---

## Deploy

### Vercel / Netlify
Push to GitHub, connect repo, auto-deploy. Build command: `npm run build`, output: `dist/`.

### Docker
```yaml
services:
  qa-copilot:
    build: .
    ports:
      - "3000:80"
    restart: unless-stopped
```

### Self-hosted
```bash
npm run build
# Serve dist/ with any static file server (nginx, Apache, Caddy)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18, TypeScript 5.7, TailwindCSS 3 |
| State | Zustand 5 |
| Animations | Framer Motion 11 |
| Database | sql.js (SQLite WASM) + IndexedDB |
| PDF | jsPDF |
| Virtualization | @tanstack/react-virtual |
| Testing | Vitest, Playwright, @testing-library |
| Build | Vite 5, esbuild |
| CI | GitHub Actions (typecheck, lint, test, build, E2E, Lighthouse) |
| Quality | ESLint 9, Commitlint, Husky, lint-staged |

**Bundle:** 53KB gzipped (main chunk) | **CSS:** 6KB gzipped

---

## Limits

| Resource | Limit |
|----------|-------|
| Context length | 100,000 characters |
| Rate limit | 10 requests/minute |
| Screenshot upload | 5MB max |
| Session history | 50 entries |

---

## Environment Variables

All optional — can be configured in-app via the settings modal.

```env
# .env (optional)
VITE_API_URL=https://api.anthropic.com/v1/messages
VITE_MODEL=claude-sonnet-4-20250514
VITE_MAX_TOKENS=8192
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes (ensure `npm run lint` and `npm run test` pass)
4. Commit with conventional format: `git commit -m 'feat: add amazing feature'`
5. Push and create a Pull Request

### Development

```bash
npm install
npm run dev          # Start dev server
npm run lint         # Check linting
npm run typecheck    # Check types
npm run test         # Run tests
npm run test:e2e     # Run E2E tests
```

---

## License

MIT License. Copyright (c) 2026 ssrjkk. See [LICENSE](LICENSE) for details.

---

## Author

**ssrjkk** — QA Engineer & Software Developer

- Telegram: [@ssrjkk](https://t.me/ssrjkk)
- GitHub: [ssrjkk](https://github.com/ssrjkk)
- Email: ray013lefe@gmail.com

---

<div align="center">

**Built with care for the QA community.**

</div>
