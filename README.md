# QA Copilot BY ssrjkk

AI-Powered QA Assistant — интеллектуальная платформа для автоматизации QA-процессов с использованием Claude API и других LLM провайдеров.

## Автор

**ssrjkk** — QA Engineer & Software Developer

- **Telegram**: [@ssrjkk](https://t.me/ssrjkk)
- **Email**: ray013lefe@gmail.com
- **GitHub**: [https://github.com/ssrjkk](https://github.com/ssrjkk)

## Возможности

- **18 типов задач**: Test Plans, Test Cases, Automation, Bug Reports, API Tests, Load Tests, Security Checks, CI/CD и другие
- **Анализ скриншотов**: Загрузка изображений для AI-анализа UI/UX, accessibility
- **Structured Memory**: Извлечение и категоризация данных из ответов AI (tech_stack, bug_patterns, edge_cases, conventions, api_endpoints, user_flows)
- **Multi-Provider AI**: Claude, Groq, OpenAI, Gemini, OpenRouter, DeepSeek, Together AI, Novita AI, Lepton AI — единый интерфейс
- **Streaming responses**: Мгновенный вывод ответа от AI
- **SQLite в браузере**: sql.js + WebAssembly с IndexedDB персистентностью
- **Cloud Sync**: Синхронизация с Firebase/Supabase, backup в localStorage
- **Export**: Markdown, PDF, JSON, CSV, TXT — гибкий экспорт
- **Keyboard Shortcuts**: Ctrl+Enter для выполнения, Ctrl+T для темы
- **Responsive**: Адаптивный дизайн для desktop и mobile
- **Dark/Light Theme**: Переключение тем с сохранением в localStorage

## Tech Stack

- **React 18** + TypeScript
- **Vite** — сборка
- **TailwindCSS** — стилизация
- **Framer Motion** — анимации
- **Zustand** — state management
- **sql.js** — SQLite в WebAssembly
- **jsPDF** — PDF генерация
- **Claude API** — AI (Sonnet 4)
- **Vitest** — тестирование

## Безопасность

- Валидация API ключа (префикс `sk-ant-`)
- Rate limiting (10 запросов/минута)
- XSS санитизация ввода
- Параметризованные SQL запросы (защита от injection)
- AES-GCM шифрование API ключа при хранении (PBKDF2)
- Debounce сохранения данных
- Error Boundary для обработки ошибок
- Offline-first архитектура

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Production сборка
npm run build

# Preview production сборки
npm run preview
```

## Тестирование

```bash
npm run test               # Запуск тестов (54 теста)
npm run test:watch         # Watch mode
```

## Архитектура проекта

```
src/
├── App.tsx                 # Главный компонент
├── main.tsx                # Entry point
├── config/                 # Конфигурация
│   ├── api.ts              # Claude API настройки
│   ├── security.ts         # Лимиты и валидация
│   ├── tasks.ts            # Типы задач и промпты
│   ├── prompts.ts          # System prompts
│   └── presets.ts          # Пресеты контекста
├── lib/                    # Утилиты и сервисы
│   ├── database.ts         # SQLite DatabaseService
│   ├── useDatabase.ts      # Hook для работы с БД
│   ├── rateLimiter.ts      # Rate limiting
│   ├── useApi.ts           # AI API hook
│   ├── memory.ts           # Memory utilities
│   ├── export.ts           # Export engine
│   ├── cloudSync.ts        # Cloud sync сервис
│   ├── storage.ts          # IndexedDB/LocalStorage
│   ├── utils.ts            # Утилиты
│   └── logger.ts           # Логирование
├── components/
│   ├── ui/                 # Базовые UI компоненты
│   ├── features/           # Feature компоненты
│   └── layout/             # Layout компоненты
├── domain/                 # Domain layer
│   ├── entities/           # Сущности (Project, Task, Memory)
│   └── usecases/           # Business logic
├── data/                   # Data layer
│   ├── api/                # AI провайдеры
│   └── repositories/       # Репозитории
├── hooks/                  # Custom React hooks
├── store/                  # Zustand store
├── presentation/           # Presentation layer
├── types/                  # TypeScript типы
└── __tests__/              # Тесты
```

## Конфигурация

### API Провайдеры

Приложение поддерживает **9 AI провайдеров** с единым интерфейсом:

| Провайдер | Статус | Модель по умолчанию | Ссылка для получения ключа |
|-----------|--------|---------------------|----------------------------|
| **Claude** (Anthropic) | 💰 Платно | claude-sonnet-4-20250514 | [console.anthropic.com](https://console.anthropic.com) |
| **Groq** | ✅ Бесплатно | llama-3.3-70b-versatile | [console.groq.com](https://console.groq.com) |
| **OpenAI** | 💰 Платно | gpt-4o-mini | [platform.openai.com](https://platform.openai.com) |
| **Gemini** | ✅ Бесплатно | gemini-1.5-flash | [ai.google.dev](https://ai.google.dev/gemini-api/docs) |
| **OpenRouter** | ✅ Бесплатно | deepseek/deepseek-chat | [openrouter.ai](https://openrouter.ai/keys) |
| **DeepSeek** | ✅ Бесплатно | deepseek-chat | [platform.deepseek.com](https://platform.deepseek.com) |
| **Together AI** | ✅ Бесплатно | meta-llama/Llama-3.3-70B-Instruct | [api.together.ai](https://api.together.ai) |
| **Novita AI** | ✅ Бесплатно | deepseek/deepseek-chat | [novita.ai](https://novita.ai) |
| **Lepton AI** | ✅ Бесплатно | llama-3.3-70b-instruct | [lepton.ai](https://www.lepton.ai) |

> ℹ️ **Бесплатные провайдеры** (отмечены ✅) не требуют кредитной карты и предоставляют бесплатные лимиты.

### Лимиты

- Rate limit: 10 запросов/минуту
- Context: 100,000 символов
- Screenshot: 5MB максимум

## Типы задач

### Generate
- Test Plan
- Test Cases
- Automation Code
- API Tests
- Load Test
- Mobile Tests
- AI Model Tests

### Analyze
- Requirements
- Observability
- Quality Metrics

### Review
- Bug Report
- Code Review
- Screenshot Analysis

### Setup
- Security Check
- CI Pipeline
- Checklist
- Contract Tests

## Структура БД

```sql
-- Projects
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name TEXT,
  description TEXT,
  memory TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Tasks
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  project_id INTEGER,
  task_type TEXT,
  context TEXT,
  output TEXT,
  created_at TEXT
);

-- Screenshots
CREATE TABLE screenshots (
  id INTEGER PRIMARY KEY,
  task_id INTEGER,
  image_data TEXT,
  analysis_result TEXT,
  created_at TEXT
);

-- Conversation History
CREATE TABLE conversation_history (
  id INTEGER PRIMARY KEY,
  project_id INTEGER,
  role TEXT,
  content TEXT,
  task_type TEXT,
  created_at TEXT
);

-- Memory Entries
CREATE TABLE memory_entries (
  id INTEGER PRIMARY KEY,
  project_id INTEGER,
  category TEXT,
  key TEXT,
  value TEXT,
  confidence REAL,
  source_task_id INTEGER,
  created_at TEXT,
  updated_at TEXT
);
```

## Вклад в проект

1. Fork репозитория
2. Создайте ветку (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Создайте Pull Request

## Обратная связь

- Bug reports: GitHub Issues
- Questions: Telegram @ssrjkk
- Email: ray013lefe@gmail.com



---

Made with ❤️ by [ssrjkk](https://github.com/ssrjkk)
