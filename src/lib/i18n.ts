/**
 * Lightweight i18n system
 * @module i18n
 * @author ssrjkk
 */

import { STORAGE_KEYS } from './constants';

type NestedMessages = Record<string, string | Record<string, string | Record<string, string>>>;

export type Locale = 'en' | 'ru' | 'uk';

const messages: Record<Locale, NestedMessages> = {
  en: {
    app: {
      name: 'QA Copilot',
      subtitle: 'AI-Powered QA Assistant',
      footer: 'QA Copilot by ssrjkk | MIT License',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      retry: 'Retry',
      loading: 'Loading...',
      search: 'Search...',
      noResults: 'No results found',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      copy: 'Copy',
      copied: 'Copied!',
      export: 'Export',
      import: 'Import',
    },
    project: {
      create: 'Create Project',
      name: 'Project name...',
      delete: 'Delete project',
      deleteConfirm: 'Are you sure?',
      select: 'Select project',
      none: 'No projects yet',
    },
    task: {
      search: 'Search modules...',
      categories: {
        all: 'All',
        bug: 'Bug',
        feature: 'Feature',
        refactor: 'Refactor',
        test: 'Test',
        docs: 'Docs',
      },
    },
    chat: {
      placeholder: 'Describe what you want QA to analyze...',
      send: 'Send',
      execute: 'Execute',
      stop: 'Stop',
      undo: 'Undo',
      redo: 'Redo',
      clearHistory: 'Clear history',
      contextError: 'Context too large',
    },
    settings: {
      apiKey: 'API Key for {{provider}}',
      apiKeyPlaceholder: 'Enter API key...',
      apiKeySaved: '•••••••••',
      provider: 'AI provider: {{name}}',
      model: 'Model',
      save: 'Save',
    },
    memory: {
      addEntry: 'Add new entry:',
      category: 'Memory category',
      key: 'Key (optional)',
      value: 'Value',
      editValue: 'Edit value for {{key}}',
      empty: 'No memory entries yet',
    },
    export: {
      markdown: 'Markdown',
      json: 'JSON',
      pdf: 'PDF',
      csv: 'CSV',
      download: 'Download',
      copied: 'Copied to clipboard!',
    },
    sync: {
      title: 'Cloud Sync',
      generateLink: 'Generate Link',
      shareLink: 'Generated share link',
      importLink: 'Paste shared link to import',
      offline: 'Offline mode',
    },
    onboarding: {
      title: 'Welcome to QA Copilot',
      step1: { title: 'Projects', description: 'Create and manage QA projects' },
      step2: { title: 'AI Analysis', description: 'Let AI analyze your code' },
      step3: { title: 'Memory', description: 'Store and retrieve QA knowledge' },
      getStarted: 'Get Started',
      skip: 'Skip',
    },
    errors: {
      dbFailed: 'Database initialization failed',
      apiKeyRequired: '{{provider}} API key is required',
      networkError: 'Network error — check your connection',
    },
  },
  ru: {
    app: {
      name: 'QA Copilot',
      subtitle: 'AI-ассистент для QA',
      footer: 'QA Copilot by ssrjkk | MIT License',
    },
    common: {
      save: 'Сохранить',
      cancel: 'Отмена',
      delete: 'Удалить',
      edit: 'Редактировать',
      close: 'Закрыть',
      retry: 'Повторить',
      loading: 'Загрузка...',
      search: 'Поиск...',
      noResults: 'Ничего не найдено',
      confirm: 'Подтвердить',
      back: 'Назад',
      next: 'Далее',
      done: 'Готово',
      copy: 'Копировать',
      copied: 'Скопировано!',
      export: 'Экспорт',
      import: 'Импорт',
    },
    project: {
      create: 'Создать проект',
      name: 'Название проекта...',
      delete: 'Удалить проект',
      deleteConfirm: 'Вы уверены?',
      select: 'Выбрать проект',
      none: 'Проектов пока нет',
    },
    task: {
      search: 'Поиск модулей...',
      categories: {
        all: 'Все',
        bug: 'Баг',
        feature: 'Фича',
        refactor: 'Рефакторинг',
        test: 'Тест',
        docs: 'Документация',
      },
    },
    chat: {
      placeholder: 'Опишите, что хотите проанализировать...',
      send: 'Отправить',
      execute: 'Выполнить',
      stop: 'Остановить',
      undo: 'Отменить',
      redo: 'Повторить',
      clearHistory: 'Очистить историю',
      contextError: 'Контекст слишком большой',
    },
    settings: {
      apiKey: 'API ключ для {{provider}}',
      apiKeyPlaceholder: 'Введите API ключ...',
      apiKeySaved: '•••••••••',
      provider: 'AI провайдер: {{name}}',
      model: 'Модель',
      save: 'Сохранить',
    },
    memory: {
      addEntry: 'Добавить запись:',
      category: 'Категория памяти',
      key: 'Ключ (необязательно)',
      value: 'Значение',
      editValue: 'Редактировать значение для {{key}}',
      empty: 'Записей памяти пока нет',
    },
    export: {
      markdown: 'Markdown',
      json: 'JSON',
      pdf: 'PDF',
      csv: 'CSV',
      download: 'Скачать',
      copied: 'Скопировано!',
    },
    sync: {
      title: 'Облачная синхронизация',
      generateLink: 'Создать ссылку',
      shareLink: 'Сгенерированная ссылка',
      importLink: 'Вставьте ссылку для импорта',
      offline: 'Офлайн режим',
    },
    onboarding: {
      title: 'Добро пожаловать в QA Copilot',
      step1: { title: 'Проекты', description: 'Создавайте и управляйте QA проектами' },
      step2: { title: 'AI анализ', description: 'Дайте AI проанализировать ваш код' },
      step3: { title: 'Память', description: 'Храните и извлекайте QA знания' },
      getStarted: 'Начать',
      skip: 'Пропустить',
    },
    errors: {
      dbFailed: 'Ошибка инициализации базы данных',
      apiKeyRequired: 'Требуется API ключ {{provider}}',
      networkError: 'Ошибка сети — проверьте подключение',
    },
  },
  uk: {
    app: {
      name: 'QA Copilot',
      subtitle: 'AI-асистент для QA',
      footer: 'QA Copilot by ssrjkk | MIT License',
    },
    common: {
      save: 'Зберегти',
      cancel: 'Скасувати',
      delete: 'Видалити',
      edit: 'Редагувати',
      close: 'Закрити',
      retry: 'Повторити',
      loading: 'Завантаження...',
      search: 'Пошук...',
      noResults: 'Нічого не знайдено',
      confirm: 'Підтвердити',
      back: 'Назад',
      next: 'Далі',
      done: 'Готово',
      copy: 'Копіювати',
      copied: 'Скопійовано!',
      export: 'Експорт',
      import: 'Імпорт',
    },
    project: {
      create: 'Створити проект',
      name: 'Назва проекту...',
      delete: 'Видалити проект',
      deleteConfirm: 'Ви впевнені?',
      select: 'Обрати проект',
      none: 'Проектів поки немає',
    },
    task: {
      search: 'Пошук модулів...',
      categories: {
        all: 'Усі',
        bug: 'Баг',
        feature: 'Фіча',
        refactor: 'Рефакторинг',
        test: 'Тест',
        docs: 'Документація',
      },
    },
    chat: {
      placeholder: 'Опишіть, що хочете проаналізувати...',
      send: 'Надіслати',
      execute: 'Виконати',
      stop: 'Зупинити',
      undo: 'Скасувати',
      redo: 'Повторити',
      clearHistory: 'Очистити історію',
      contextError: 'Контекст занадто великий',
    },
    settings: {
      apiKey: 'API ключ для {{provider}}',
      apiKeyPlaceholder: 'Введіть API ключ...',
      apiKeySaved: '•••••••••',
      provider: 'AI провайдер: {{name}}',
      model: 'Модель',
      save: 'Зберегти',
    },
    memory: {
      addEntry: 'Додати запис:',
      category: 'Категорія пам\'яті',
      key: 'Ключ (необов\'язково)',
      value: 'Значення',
      editValue: 'Редагувати значення для {{key}}',
      empty: 'Записів пам\'яті поки немає',
    },
    export: {
      markdown: 'Markdown',
      json: 'JSON',
      pdf: 'PDF',
      csv: 'CSV',
      download: 'Завантажити',
      copied: 'Скопійовано!',
    },
    sync: {
      title: 'Хмарна синхронізація',
      generateLink: 'Створити посилання',
      shareLink: 'Згенероване посилання',
      importLink: 'Вставте посилання для імпорту',
      offline: 'Офлайн режим',
    },
    onboarding: {
      title: 'Ласкаво просимо до QA Copilot',
      step1: { title: 'Проекти', description: 'Створюйте та керуйте QA проектами' },
      step2: { title: 'AI аналіз', description: 'Дайте AI проаналізувати ваш код' },
      step3: { title: 'Пам\'ять', description: 'Зберігайте та отримуйте QA знання' },
      getStarted: 'Почати',
      skip: 'Пропустити',
    },
    errors: {
      dbFailed: 'Помилка ініціалізації бази даних',
      apiKeyRequired: 'Потрібен API ключ {{provider}}',
      networkError: 'Помилка мережі — перевірте з\'єднання',
    },
  },
};

let currentLocale: Locale = 'en';

function getNestedValue(obj: NestedMessages, path: string): string | undefined {
  let current: Record<string, unknown> = obj as Record<string, unknown>;
  for (const key of path.split('.')) {
    if (typeof current !== 'object' || current === null) return undefined;
    const next = current[key];
    if (next === undefined || next === null) return undefined;
    if (typeof next === 'string') return next;
    if (typeof next === 'object') {
      current = next as Record<string, unknown>;
      continue;
    }
    return undefined;
  }
  return undefined;
}

export function t(key: string, params?: Record<string, string>): string {
  const value = getNestedValue(messages[currentLocale], key)
    ?? getNestedValue(messages.en, key)
    ?? key;
  if (!params) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_, name) => params[name] || `{{${name}}}`);
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
}

export function getLocale(): Locale {
  return currentLocale;
}

export function initI18n(): Locale {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem(STORAGE_KEYS.locale);
  if (saved && isValidLocale(saved)) {
    setLocale(saved);
    return saved;
  }
  const browserLang = (navigator.language ?? '').slice(0, 2);
  if (isValidLocale(browserLang)) {
    setLocale(browserLang);
    return browserLang;
  }
  return 'en';
}

export function saveLocale(locale: Locale): void {
  setLocale(locale);
  localStorage.setItem(STORAGE_KEYS.locale, locale);
}

function isValidLocale(value: string): value is Locale {
  return value in messages;
}

export type { Locale as SupportedLocale };
export const AVAILABLE_LOCALES: Locale[] = ['en', 'ru', 'uk'];
