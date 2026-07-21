<div align="center">

# QA Copilot

### AI-Powered QA Assistant

**Генерация тест-планов, анализ кода, написание баг-репортов — на базе 9 AI-провайдеров.**

[![CI](https://github.com/ssrjkk/qa-helper/actions/workflows/ci.yml/badge.svg)](https://github.com/ssrjkk/qa-helper/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-160%20passed-22c55e)](#testing)
[![Bundle](https://img.shields.io/bundlejs/size/@minified?gzip=true&label=bundle&color=6366f1)](#tech-stack)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](#tech-stack)

[Быстрый старт](#быстрый-старт) | [Возможности](#возможности) | [Провайдеры](#ai-провайдеры) | [Деплой](#деплой) | [Контрибьюция](#контрибьюция)

**[English / Английский](README.md)**

</div>

---

## Что такое QA Copilot?

QA-ассистент в браузере, который превращает описания задач в структурированные артефакты: тест-планы, тест-кейсы, код автоматизации, баг-репорты, проверки безопасности и многое другое. Сервер не нужен. Работает целиком в браузере на SQLite (WebAssembly).

**Суть:** Опиши задачу, выбери тип, получи готовый QA-артефакт.

<div align="center">

```
+----------------------------------------------------------+
|                                                          |
|   "Страница логина с валидацией формы email               |
|    и пароля, поддержка OAuth через Google.                |
|    Напиши тест-кейсы."                                   |
|                                                          |
|   Задача: Test Cases                                     |
|                                                          |
|   -> Execute                                             |
|                                                          |
|   +------------------------------------------+           |
|   | Test Case: TC-LOGIN-001                  |           |
|   | Title: Валидный логин email + пароль      |           |
|   | Steps: 1. Перейти на /login              |           |
|   |   2. Ввести валидный email               |           |
|   |   3. Ввести валидный пароль              |           |
|   |   4. Нажать "Войти"                      |           |
|   | Expected: Редирект на дашборд            |           |
|   | Priority: P0  |  Type: Functional        |           |
|   +------------------------------------------+           |
|                                                          |
+----------------------------------------------------------+
```

</div>

---

## Быстрый старт

**3 шага до первого результата:**

```bash
git clone https://github.com/ssrjkk/qa-helper.git
cd qa-helper
npm install && npm run dev
```

Открой `http://localhost:5173`, введи API-ключ, выбери тип задачи, опиши контекст и нажми Execute.

> **Нет API-ключа?** Используй Groq или DeepSeek — оба бесплатные, кредитная карта не нужна.

<details>
<summary><b>Docker</b></summary>

```bash
docker compose up -d
# Открой http://localhost:3000
```
</details>

<details>
<summary><b>Production-сборка</b></summary>

```bash
npm run build     # папка dist/
npm run preview   # предпросмотр локально
```
</details>

---

## Возможности

<table>
<tr>
<td width="50%">

### 17 типов задач

**Generate** — Тест-планы, Тест-кейсы, Код автоматизации, API-тесты, Нагрузочные тесты, Мобильные тесты, AI-тесты

**Analyze** — Анализ требований, Observability, Метрики качества

**Review** — Баг-репорты, Ревью кода, Анализ скриншотов

**Setup** — Проверка безопасности, CI/CD, Чеклисты, Контрактные тесты

</td>
<td width="50%">

### Умные функции

- **Стриминг ответов** — вывод в реальном времени
- **Структурная память** — AI извлекает стек, паттерны багов, конвенции и переиспользует их
- **Пресеты контекста** — готовые шаблоны для E2E, Unit, API, Mobile тестирования
- **Режим агента** — многошаговое рассуждение для сложных задач
- **Экспорт** — Markdown, PDF, JSON, CSV, TXT
- **История сессий** — виртуализированный список, поиск, загрузка прошлых сессий

</td>
</tr>
<tr>
<td>

### Безопасность

- AES-256-GCM шифрование API-ключей (PBKDF2)
- XSS-санитизация всего ввода
- Параметризованные SQL-запросы
- Rate limiting (10 запросов/мин)
- Content Security Policy заголовки
- Защита мастер-паролем

</td>
<td>

### Developer Experience

- **160 тестов** (unit, integration, property-based)
- **16 E2E тестов** (Playwright)
- **Lighthouse CI** в GitHub Actions
- Pre-commit хуки (eslint, lint-staged)
- Commitlint с conventional commits
- Строгий TypeScript + ESLint ноль предупреждений

</td>
</tr>
</table>

---

## AI-провайдеры

QA Copilot поддерживает **9 провайдеров** с единым интерфейсом. Любой на выбор — опыт одинаковый.

| Провайдер | Бесплатный? | Модель по умолчанию | Получить ключ |
|-----------|-------------|---------------------|---------------|
| **Groq** | Да | `llama-3.3-70b-versatile` | [console.groq.com](https://console.groq.com) |
| **DeepSeek** | Да | `deepseek-chat` | [platform.deepseek.com](https://platform.deepseek.com) |
| **Gemini** | Да | `gemini-1.5-flash` | [ai.google.dev](https://ai.google.dev) |
| **OpenRouter** | Да | `deepseek/deepseek-chat` | [openrouter.ai](https://openrouter.ai/keys) |
| **Together AI** | Да | `meta-llama/Llama-3.3-70B-Instruct` | [api.together.ai](https://api.together.ai) |
| **Novita AI** | Да | `deepseek/deepseek-chat` | [novita.ai](https://novita.ai) |
| **Lepton AI** | Да | `llama-3.3-70b-instruct` | [lepton.ai](https://www.lepton.ai) |
| **Claude** | Платно | `claude-sonnet-4-20250514` | [console.anthropic.com](https://console.anthropic.com) |
| **OpenAI** | Платно | `gpt-4o-mini` | [platform.openai.com](https://platform.openai.com) |

---

## Архитектура

```
src/
  components/
    features/          # Панели приложения: ChatArea, Sidebar, TaskSelector и т.д.
    ui/                # GlassCard, RippleButton, Modal, Toast и т.д.
    layout/            # MainLayout
  config/              # Типы задач, промпты, пресеты, конфигурация безопасности
  data/
    api/               # 9 сервисов AI-провайдеров + UnifiedAiService
    codebase/          # Подключение GitHub и локального кода
    repositories/      # Репозитории SQLite (Project, Task, Memory)
  domain/
    entities/          # TypeScript-модели (Project, Task, Memory, Session)
    usecases/          # Бизнес-логика (ProjectUseCases, TaskUseCases и т.д.)
  hooks/               # Кастомные хуки (useDatabase, useExecution, useTheme и т.д.)
  lib/                 # Ядро (database, encryption, export, storage)
  presentation/        # Контекст-провайдеры (UseCasesContext)
  store/               # Состояние (Zustand)
  __tests__/           # Unit, integration, property-based тесты
```

**Поток данных:** UI -> Zustand Store -> UseCases -> Repositories -> sql.js (WASM SQLite) -> IndexedDB

---

## Горячие клавиши

| Комбинация | Действие |
|-----------|----------|
| `Ctrl/Cmd + Enter` | Выполнить задачу |
| `Ctrl/Cmd + Shift + C` | Копировать вывод |
| `Ctrl/Cmd + T` | Переключить тему |
| `Escape` | Закрыть модалку |

---

## Тестирование

```bash
npm run test          # 160 unit/integration тестов
npm run test:watch    # Watch mode
npm run test:e2e      # 16 Playwright E2E тестов
```

**Покрытие:** утилиты, база данных, безопасность, компоненты, задачи, QaAgent, circuit breaker, zip-парсер, property-based (10k итераций).

---

## Деплой

### Vercel / Netlify
Пуш в GitHub, подключаешь репо, автодеплой. Build command: `npm run build`, output: `dist/`.

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
# Обслуживай dist/ любым статическим сервером (nginx, Apache, Caddy)
```

---

## Технологический стек

| Слой | Технология |
|------|-----------|
| UI | React 18, TypeScript 5.7, TailwindCSS 3 |
| Состояние | Zustand 5 |
| Анимации | Framer Motion 11 |
| База данных | sql.js (SQLite WASM) + IndexedDB |
| PDF | jsPDF |
| Виртуализация | @tanstack/react-virtual |
| Тестирование | Vitest, Playwright, @testing-library |
| Сборка | Vite 5, esbuild |
| CI | GitHub Actions (typecheck, lint, test, build, E2E, Lighthouse) |
| Качество | ESLint 9, Commitlint, Husky, lint-staged |

**Бандл:** 53KB gzipped (основной чанк) | **CSS:** 6KB gzipped

---

## Лимиты

| Ресурс | Лимит |
|--------|-------|
| Длина контекста | 100,000 символов |
| Rate limit | 10 запросов/минуту |
| Загрузка скриншотов | 5MB максимум |
| История сессий | 50 записей |

---

## Переменные окружения

Все опциональные — настраиваются через модалку в приложении.

```env
# .env (опционально)
VITE_API_URL=https://api.anthropic.com/v1/messages
VITE_MODEL=claude-sonnet-4-20250514
VITE_MAX_TOKENS=8192
```

---

## Контрибьюция

1. Форкни репозиторий
2. Создай ветку: `git checkout -b feature/amazing-feature`
3. Вноси изменения (убедись что `npm run lint` и `npm run test` проходят)
4. Коммить по conventional format: `git commit -m 'feat: add amazing feature'`
5. Пушь и создай Pull Request

### Разработка

```bash
npm install
npm run dev          # Запуск dev-сервера
npm run lint         # Проверка линтинга
npm run typecheck    # Проверка типов
npm run test         # Запуск тестов
npm run test:e2e     # Запуск E2E тестов
```

---

## Лицензия

MIT License. Copyright (c) 2026 ssrjkk. Подробности в [LICENSE](LICENSE).

---

## Автор

**ssrjkk** — QA Engineer & Software Developer

- Telegram: [@ssrjkk](https://t.me/ssrjkk)
- GitHub: [ssrjkk](https://github.com/ssrjkk)
- Email: ray013lefe@gmail.com

---

<div align="center">

**Создано с заботой для QA-сообщества.**

</div>
