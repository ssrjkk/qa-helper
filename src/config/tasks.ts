export const TASK_CATEGORIES = ['all', 'generate', 'analyze', 'review', 'setup'] as const;
export type TaskCategory = typeof TASK_CATEGORIES[number];

export const TASK_TYPES = [
  { id: "test_plan", icon: "📋", label: "Test Plan", color: "#6366f1", category: "generate" },
  { id: "test_cases", icon: "✅", label: "Test Cases", color: "#22c55e", category: "generate" },
  { id: "automation_code", icon: "⚡", label: "Automation", color: "#f59e0b", category: "generate" },
  { id: "api_tests", icon: "🔗", label: "API Tests", color: "#06b6d4", category: "generate" },
  { id: "load_test", icon: "📊", label: "Load Test", color: "#ec4899", category: "generate" },
  { id: "mobile_tests", icon: "📱", label: "Mobile", color: "#10b981", category: "generate" },
  { id: "ai_model_tests", icon: "🤖", label: "AI Tests", color: "#64748b", category: "generate" },
  { id: "requirements", icon: "📝", label: "Requirements", color: "#a855f7", category: "analyze" },
  { id: "observability", icon: "📈", label: "Observability", color: "#0ea5e9", category: "analyze" },
  { id: "quality_metrics", icon: "🎯", label: "Metrics", color: "#f43f5e", category: "analyze" },
  { id: "bug_report", icon: "🐛", label: "Bug Report", color: "#ef4444", category: "review" },
  { id: "code_review", icon: "🔍", label: "Code Review", color: "#8b5cf6", category: "review" },
  { id: "screenshot_analysis", icon: "🖼️", label: "Screenshot", color: "#0d9488", category: "review" },
  { id: "security_check", icon: "🔒", label: "Security", color: "#14b8a6", category: "setup" },
  { id: "ci_pipeline", icon: "🚀", label: "CI/CD", color: "#f97316", category: "setup" },
  { id: "checklist", icon: "☑️", label: "Checklist", color: "#84cc16", category: "setup" },
  { id: "contract_tests", icon: "📜", label: "Contracts", color: "#d946ef", category: "setup" },
] as const;

export type TaskType = typeof TASK_TYPES[number];

export const TASK_PROMPTS: Record<string, (ctx: string) => string> = {
  test_plan: (ctx) => `Create comprehensive QA test plan: strategy, scope, environments, risks, schedule.\n\n${ctx}`,
  test_cases: (ctx) => `Generate detailed test cases with steps, expected results, severity.\n\n${ctx}`,
  automation_code: (ctx) => `Write production-ready automation code with POM, fixtures, assertions.\n\n${ctx}`,
  bug_report: (ctx) => `Create professional bug report with reproduction steps, severity, impact.\n\n${ctx}`,
  code_review: (ctx) => `Review code for test coverage, flakiness, best practices.\n\n${ctx}`,
  api_tests: (ctx) => `Generate complete API test suite with auth, validation, security tests.\n\n${ctx}`,
  load_test: (ctx) => `Design load & performance test strategy with scripts.\n\n${ctx}`,
  security_check: (ctx) => `Create OWASP-based security testing checklist and plan.\n\n${ctx}`,
  ci_pipeline: (ctx) => `Create production CI/CD pipeline with parallel execution, quality gates.\n\n${ctx}`,
  checklist: (ctx) => `Generate comprehensive pre-release QA checklist.\n\n${ctx}`,
  requirements: (ctx) => `Analyze requirements for gaps, risks, testability.\n\n${ctx}`,
  observability: (ctx) => `Design observability strategy with logs, metrics, traces.\n\n${ctx}`,
  contract_tests: (ctx) => `Create consumer-driven contract tests with Pact.\n\n${ctx}`,
  ai_model_tests: (ctx) => `Design AI/ML model testing suite with quality metrics.\n\n${ctx}`,
  mobile_tests: (ctx) => `Generate mobile test strategy and automation suite.\n\n${ctx}`,
  quality_metrics: (ctx) => `Define quality metrics framework with KPIs and dashboards.\n\n${ctx}`,
  screenshot_analysis: (ctx) => `Analyze screenshot for UI defects, accessibility, UX issues.\n\n${ctx}`,
};
