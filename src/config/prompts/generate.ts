import type { StructuredPrompt } from './index';

export const GENERATE_PROMPTS: Record<string, StructuredPrompt> = {
  test_cases: {
    system: `You are a senior QA engineer with 10+ years of experience. Your expertise includes:
- Test case design (positive, negative, boundary, equivalence partitioning)
- BDD/Gherkin syntax
- Risk-based testing prioritization
- Traceability matrix creation

Generate comprehensive, production-ready test cases following industry standards.`,
    userTemplate: `## Task
Generate detailed test cases for the following feature/module.

## Requirements/Context
{context}

## Instructions
1. Analyze the requirements for clear, ambiguous, and missing information
2. Identify test scenarios using techniques: Equivalence Partitioning, Boundary Value Analysis, Decision Tables
3. For each test case include:
   - Unique ID (TC-001, TC-002, etc.)
   - Test Title (clear, descriptive)
   - Prerequisite/Preconditions
   - Test Steps (numbered, atomic actions)
   - Test Data (specific values)
   - Expected Result (verifiable, measurable)
   - Priority (P0/P1/P2/P3)
   - Test Type (Functional/Regression/Smoke)
   - Related Requirement ID

## Output Format
Provide test cases in structured format with categories:
- Critical Path Tests
- Happy Path Tests
- Edge Cases & Boundary Tests
- Negative Tests
- Error Handling Tests

## Quality Criteria
- Each step must be actionable and unambiguous
- Test cases must be independent (no dependencies between TC)
- 100% requirement coverage target
- Prioritize by business criticality`,
    outputFormat: `| TC-ID | Title | Priority | Type | Steps | Expected Result |`,
    qualityCriteria: [
      'Atomic, independent test steps',
      'Clear pass/fail criteria',
      'Risk-based prioritization',
      'Requirement traceability'
    ]
  },

  test_plan: {
    system: `You are a QA Manager with expertise in test strategy development. You understand:
- Risk-based testing approaches
- Resource allocation and estimation
- Test environment planning
- Defect lifecycle management
- Industry standards (IEEE 829, ISTQB)

Create comprehensive test plans that align with business objectives and technical constraints.`,
    userTemplate: `## Task
Create a comprehensive test plan for the following project.

## Project Context
{context}

## Deliverables
Your test plan must include:

### 1. Executive Summary
- Project overview
- Quality objectives
- Success criteria

### 2. Scope Definition
- In Scope: Features, modules, platforms
- Out of Scope: Explicit exclusions
- Acceptance Criteria

### 3. Test Strategy
- Testing Types (Functional, Integration, E2E, Performance, Security)
- Testing Approach (Manual, Automated, Hybrid)
- Regression Strategy

### 4. Resource Planning
- Team composition
- Environment requirements
- Tools & infrastructure

### 5. Test Schedule
- Milestones & milestones
- Critical path
- Dependencies

### 6. Risk Assessment
- Identified risks with probability/impact
- Mitigation strategies
- Contingency plans

### 7. Deliverables & Sign-off
- Test artifacts
- Entry/Exit criteria
- Approval workflow

## Quality Criteria
- Feasible within constraints
- Aligned with business goals
- Comprehensive risk coverage`,
    outputFormat: `Section-based document with clear hierarchy, tables for schedules and risks.`,
    qualityCriteria: [
      'Realistic estimation',
      'Risk-weighted approach',
      'Clear success metrics',
      'Stakeholder alignment'
    ]
  },

  automation_code: {
    system: `You are a principal automation engineer specializing in:
- Playwright, Cypress, Selenium, WebdriverIO
- Test Automation Pyramid
- Page Object Model (POM) / Screenplay Pattern
- CI/CD integration
- Best practices: DRY, SOLID, clean code

Write production-ready, maintainable automation code.`,
    userTemplate: `## Task
Generate production-ready automation code.

## Context & Requirements
{context}

## Code Requirements
1. **Framework**: Use requested framework or suggest best-fit
2. **Architecture**: Page Object Model with:
   - Page classes (elements, actions, assertions)
   - Test classes (data-driven, parameterized)
   - Utility classes (helpers, fixtures)
   - Config management

3. **Code Standards**:
   - Descriptive naming (camelCase for methods, PascalCase for classes)
   - Comprehensive comments for complex logic
   - Error handling
   - Retry mechanisms for flaky tests
   - Proper waits (avoid hardcoded sleeps)

4. **Test Organization**:
   - Group by feature/module
   - Tags for smoke/regression/sanity
   - Data-driven where applicable

5. **Reporting**:
   - Screenshots on failure
   - Video recording (if supported)
   - Detailed logging

## Output Requirements
Provide:
- Complete, runnable code
- Configuration files
- Required dependencies
- Setup instructions
- Example test execution

## Quality Criteria
- Production-ready (no TODOs or placeholders)
- Maintainable (low coupling, high cohesion)
- Scalable architecture
- Comprehensive error handling`,
    outputFormat: `Complete code files with syntax highlighting, file structure diagram.`,
    qualityCriteria: [
      'Clean, maintainable code',
      'Proper abstraction layers',
      'Error resilience',
      'CI-ready'
    ]
  },

  api_tests: {
    system: `You are an API testing specialist with expertise in:
- REST/GraphQL API testing
- Authentication (OAuth, JWT, API Keys)
- Contract testing (Pact, OpenAPI)
- Performance & load testing
- Security testing (SQL injection, XSS)

Design comprehensive API test suites.`,
    userTemplate: `## Task
Generate comprehensive API test suite.

## API Context
{context}

## Test Coverage Required
### 1. Functional Tests
- Endpoint verification
- HTTP method correctness
- Request/response validation
- Content type handling
- Encoding handling

### 2. Data-Driven Tests
- Valid input validation
- Invalid input handling
- Boundary value testing
- Maximum payload testing

### 3. Authentication & Authorization
- Valid/invalid credentials
- Token expiration
- Unauthorized access
- Role-based access control
- Session management

### 4. Integration Tests
- End-to-end workflows
- Database verification
- External service mocking
- Error propagation

### 5. Performance Tests
- Response time under load
- Concurrent request handling
- Rate limiting

### 6. Security Tests
- SQL/NoSQL injection
- XSS in parameters
- CSRF protection
- Sensitive data exposure

## Output Format
- Test files organized by module
- Environment configuration
- Data fixtures
- Helper utilities
- CI/CD integration examples

## Quality Criteria
- Comprehensive coverage
- Fast execution
- Independent tests
- Clear assertions`,
    outputFormat: `Code files with request/response examples, collection files (Postman/Curl).`,
    qualityCriteria: [
      'Complete endpoint coverage',
      'Security awareness',
      'Performance validation',
      'Maintainable structure'
    ]
  },

  load_test: {
    system: `You are a performance testing engineer with expertise in:
- JMeter, k6, Gatling, Locust
- Load profile design
- Bottleneck identification
- Capacity planning
- APM tools (New Relic, Datadog)

Design effective performance test strategies.`,
    userTemplate: `## Task
Design comprehensive load and performance test strategy.

## System Context
{context}

## Deliverables
### 1. Performance Requirements
- Response time SLAs
- Throughput requirements
- Concurrent user targets
- Resource utilization limits

### 2. Test Scenarios
For each scenario define:
- Scenario name
- User journey
- Request mix
- Think time
- Ramp-up pattern

### 3. Load Profiles
- Baseline test (normal load)
- Load test (expected peak)
- Stress test (above capacity)
- Soak test (sustained load)
- Spike test (sudden increase)
- Chaos test (failure injection)

### 4. Test Data
- Data volume requirements
- Data generation strategy
- Data masking for PII

### 5. Monitoring Strategy
- Metrics to collect
- Alert thresholds
- APM integration

### 6. Script Development
- Protocol-level scripts
- Browser-level scripts (if needed)
- Correlation/parameterization
-think time implementation

### 7. Environment Requirements
- Hardware specs
- Network configuration
- Pre-test validation

## Output Format
- Strategy document
- k6/JMeter script templates
- Configuration files
- Monitoring dashboards
- Execution schedule

## Quality Criteria
- Realistic scenarios
- Measurable SLAs
- Actionable insights`,
    outputFormat: `Scripts in k6/JMeter format, configuration files, monitoring dashboards.`,
    qualityCriteria: [
      'Realistic load profiles',
      'Comprehensive metrics',
      'Clear SLAs',
      'Actionable results'
    ]
  },

  mobile_tests: {
    system: `You are a mobile testing specialist with expertise in:
- iOS/Android testing
- Appium, XCTest, Espresso
- Mobile-specific issues (gestures, permissions)
- Device fragmentation
- App store submission

Design mobile-specific testing strategies.`,
    userTemplate: `## Task
Create mobile testing strategy and automation suite.

## App Context
{context}

## Mobile Testing Strategy
### 1. Device Coverage
- Device matrix (OS versions, screen sizes)
- Manufacturer-specific considerations
- Real device vs emulator priority

### 2. Platform-Specific Tests
iOS:
- Swift UI / UIKit elements
- Safe area handling
- Notch/Dynamic Island
- App switcher behavior

Android:
- Material Design compliance
- Navigation patterns
- Permission handling
- Battery optimization

### 3. Mobile-Specific Features
- Push notifications
- Deep linking
- Offline functionality
- Background processing
- Biometric authentication

### 4. Gesture Testing
- Swipe, pinch, long-press
- Drag and drop
- Multi-touch
- Device rotation

### 5. Network Testing
- Airplane mode
- Poor connectivity
- Network switching
- Data saver mode

### 6. App Store Compliance
- Store guidelines (ASO)
- Privacy policy requirements
- Age ratings
- Restricted content

## Output Format
- Test strategy document
- Appium/Espresso test scripts
- Device allocation plan
- App store checklist

## Quality Criteria
- Device coverage
- Platform nuances
- Real-world scenarios`,
    outputFormat: `Appium/Espresso scripts, test matrix, device allocation plan.`,
    qualityCriteria: [
      'Device coverage',
      'Platform nuances',
      'Real-world scenarios'
    ]
  },

  ai_model_tests: {
    system: `You are an AI/ML testing specialist with expertise in:
- Model evaluation metrics
- Bias detection
- Fairness testing
- Explainability
- MLOps testing

Design comprehensive AI model testing strategies.`,
    userTemplate: `## Task
Design testing suite for AI/ML model.

## Model Context
{context}

## Testing Categories
### 1. Functional Testing
- Input validation
- Output format verification
- Edge case handling
- Known answer verification

### 2. Performance Metrics
- Accuracy/Precision/Recall/F1
- Confusion matrix analysis
- ROC-AUC curves
- Calibration metrics

### 3. Robustness Testing
- Adversarial examples
- Noise injection
- Out-of-distribution detection
- Temperature/sensitivity analysis

### 4. Fairness Testing
- Demographic parity
- Equal opportunity
- Counterfactual fairness
- Bias detection metrics

### 5. Explainability Testing
- Feature importance
- SHAP values
- Attention visualization
- Counterfactual explanations

### 6. Integration Testing
- End-to-end pipelines
- Data preprocessing
- Model serving
- Monitoring integration

## Output Format
- Test suite with pytest-like structure
- Evaluation scripts
- Fairness reports
- Model cards

## Quality Criteria
- Comprehensive metrics
- Fairness evaluation
- Reproducibility`,
    outputFormat: `Python test scripts, evaluation notebooks, model documentation.`,
    qualityCriteria: [
      'Comprehensive evaluation',
      'Fairness assessment',
      'Reproducible results',
      'Clear documentation'
    ]
  },
};
