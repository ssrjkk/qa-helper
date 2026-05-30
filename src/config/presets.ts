export interface ContextPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  template: string;
  tags: string[];
}

export const CONTEXT_PRESETS: ContextPreset[] = [
  {
    id: 'playwright-ts',
    name: 'Playwright + TypeScript',
    description: 'E2E testing with Playwright',
    icon: '🎭',
    template: `Framework: Playwright
Language: TypeScript
Architecture: Page Object Model
Test Structure:
- Tests in *.spec.ts files
- Page Objects in *.page.ts
- Fixtures in *.fixture.ts
Assertion Library: expect from @playwright/test
Additional: test hooks (beforeEach, afterEach)`,
    tags: ['e2e', 'playwright', 'typescript']
  },
  {
    id: 'playwright-js',
    name: 'Playwright + JavaScript',
    description: 'E2E testing with Playwright JS',
    icon: '🎭',
    template: `Framework: Playwright
Language: JavaScript
Architecture: Page Object Model
Test Structure:
- Tests in *.spec.js files
- Page Objects in *.page.js
Assertion Library: expect from @playwright/test`,
    tags: ['e2e', 'playwright', 'javascript']
  },
  {
    id: 'cypress',
    name: 'Cypress',
    description: 'E2E testing with Cypress',
    icon: '🔄',
    template: `Framework: Cypress
Language: JavaScript/TypeScript
Architecture: Page Object Model
Test Structure:
- Tests in cypress/e2e/*.cy.js
- Page Objects in cypress/support/pages/
- Custom Commands in cypress/support/commands.js
Additional: cypress-plugin-api for API testing`,
    tags: ['e2e', 'cypress', 'javascript']
  },
  {
    id: 'jest',
    name: 'Jest',
    description: 'Unit and integration testing',
    icon: '🃏',
    template: `Framework: Jest
Language: JavaScript/TypeScript
Test Structure:
- Tests alongside source: *.test.ts
- Setup: beforeAll, beforeEach
- Mocks: jest.mock(), jest.fn()
Assertion: expect
Coverage: minimum 80%`,
    tags: ['unit', 'jest', 'javascript']
  },
  {
    id: 'pytest',
    name: 'Pytest',
    description: 'Python testing with Pytest',
    icon: '🐍',
    template: `Framework: pytest
Language: Python 3.x
Test Structure:
- Tests in tests/ directory
- Fixtures in conftest.py
- Page Objects in pages/
Assertion: assert statements
Additional: pytest-xdist for parallel, pytest-cov for coverage`,
    tags: ['unit', 'api', 'python']
  },
  {
    id: 'api-rest',
    name: 'REST API',
    description: 'API testing with REST',
    icon: '🔗',
    template: `API Type: REST
Format: JSON
Authentication: Bearer token / OAuth2
Test Cases:
- Status codes (200, 201, 400, 401, 403, 404, 500)
- Response body validation
- Headers validation
- Performance (response time < 500ms)
Tools: Postman/Newman or REST Assured`,
    tags: ['api', 'rest', 'backend']
  },
  {
    id: 'graphql',
    name: 'GraphQL API',
    description: 'GraphQL API testing',
    icon: '◈',
    template: `API Type: GraphQL
Endpoint: /graphql
Authentication: Bearer token
Test Cases:
- Query execution
- Mutations
- Variables and fragments
- Error responses
- Subscription (if applicable)`,
    tags: ['api', 'graphql', 'backend']
  },
  {
    id: 'mobile-android',
    name: 'Mobile Android',
    description: 'Android mobile testing',
    icon: '📱',
    template: `Platform: Android
Framework: Appium
Language: Java/Kotlin
Test Structure:
- Appium capabilities
- Page Objects
- Gestures (tap, swipe, scroll)
- Emulator: Android Studio`,
    tags: ['mobile', 'android', 'appium']
  },
  {
    id: 'mobile-ios',
    name: 'Mobile iOS',
    description: 'iOS mobile testing',
    icon: '📱',
    template: `Platform: iOS
Framework: Appium / XCUITest
Language: Swift / Java
Test Structure:
- Appium capabilities / XCUI Test
- Page Objects
- Gestures
- Simulator: Xcode`,
    tags: ['mobile', 'ios', 'appium']
  },
  {
    id: 'performance',
    name: 'Load/Performance',
    description: 'Performance testing',
    icon: '📊',
    template: `Type: Performance/Load Testing
Tools: k6 / JMeter / Gatling
Metrics:
- Response time (p50, p95, p99)
- Throughput (RPS)
- Error rate (< 1%)
- Resource utilization
Scenarios: baseline, load, stress, spike`,
    tags: ['performance', 'load', 'k6']
  },
  {
    id: 'security',
    name: 'Security Testing',
    description: 'OWASP security testing',
    icon: '🔒',
    template: `Type: Security Testing
Framework: OWASP Top 10
Tests:
- SQL Injection
- XSS (Cross-Site Scripting)
- CSRF
- Authentication bypass
- Sensitive data exposure
- API security (OAuth, JWT)
Tools: Burp Suite, OWASP ZAP`,
    tags: ['security', 'owasp', 'api']
  }
];

export function getPresetById(id: string): ContextPreset | undefined {
  return CONTEXT_PRESETS.find(preset => preset.id === id);
}

export function searchPresets(query: string): ContextPreset[] {
  const lowerQuery = query.toLowerCase();
  return CONTEXT_PRESETS.filter(preset => 
    preset.name.toLowerCase().includes(lowerQuery) ||
    preset.description.toLowerCase().includes(lowerQuery) ||
    preset.tags.some(tag => tag.includes(lowerQuery))
  );
}
