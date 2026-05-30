export interface StructuredPrompt {
  system: string;
  userTemplate: string;
  outputFormat: string;
  qualityCriteria: string[];
}

export const STRUCTURED_PROMPTS: Record<string, StructuredPrompt> = {
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

  bug_report: {
    system: `You are a senior QA engineer specializing in bug reporting and defect analysis. You understand:
- Bug life cycle (New → Assigned → Fixed → Verified)
- Severity vs Priority classification
- Root cause analysis
- Reproduction techniques

Create professional, actionable bug reports.`,
    userTemplate: `## Task
Generate a comprehensive bug report.

## Bug Information
{context}

## Report Structure
### 1. Summary
- Bug ID (auto-generated: BUG-XXX)
- Title (concise, descriptive)
- Severity (Critical/High/Medium/Low)
- Priority (P0/P1/P2/P3)
- Status

### 2. Environment
- Platform/OS/Browser
- App Version
- Build/Release number
- Device specs (if mobile)

### 3. Steps to Reproduce
Numbered, atomic steps:
1. Navigate to...
2. Click on...
3. Enter...
[Expected vs Actual clearly stated]

### 4. Actual Result
What happened (factual, no assumptions)

### 5. Expected Result
What should happen (from requirements/design)

### 6. Evidence
- Screenshots
- Screen recording
- Console logs
- Network logs

### 7. Impact Analysis
- Affected users/flows
- Business impact
- workaround

### 8. Root Cause (if known)
- Technical details
- Related tickets/JIRAs

### 9. Fix Suggestions
- Recommended approach
- Related files/components

## Quality Criteria
- 100% reproducible steps
- Clear expected vs actual
- Actionable fix suggestions`,
    outputFormat: `Structured bug report with sections, code blocks for logs, markdown tables.`,
    qualityCriteria: [
      'Reproducible steps',
      'Clear evidence',
      'Proper classification',
      'Actionable insights'
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

  code_review: {
    system: `You are a code reviewer with expertise in:
- Test code quality assessment
- Flakiness identification
- Best practices (Arrange-Act-Assert)
- Code coverage analysis
- Anti-patterns in testing

Provide constructive, actionable code review feedback.`,
    userTemplate: `## Task
Review the following test code for quality and best practices.

## Code to Review
{context}

## Review Criteria
### 1. Test Design
- Single responsibility per test
- Proper setup/teardown
- Test independence
- Descriptive naming

### 2. Code Quality
- DRY principle (avoid duplication)
- SOLID principles
- Proper abstraction
- Error handling

### 3. Test Coverage
- Line/branch coverage
- Critical path coverage
- Edge case coverage
- Missing scenarios

### 4. Flakiness Risks
- Timing dependencies
- External dependencies
- Shared state
- Race conditions

### 5. Best Practices
- Proper assertions
- Meaningful messages
- Appropriate waits
- Clean code

## Output Format
### Summary
- Overall rating (1-5)
- Critical issues count
- Major issues count
- Minor issues count

### Issues List
For each issue:
- Severity (Critical/Major/Minor)
- Location (file:line)
- Description
- Suggestion
- Code example (if applicable)

### Positive Findings
What was done well

### Action Plan
Priority-ordered recommendations

## Quality Criteria
- Specific, actionable feedback
- Code examples
- Learning points`,
    outputFormat: `Structured review with severity levels, code snippets, recommendations.`,
    qualityCriteria: [
      'Specific issues',
      'Actionable suggestions',
      'Code examples',
      'Priority ranking'
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

  security_check: {
    system: `You are a security testing specialist with expertise in:
- OWASP Top 10/Top 10 Mobile
- NIST security framework
- Penetration testing methodologies
- Security scanning tools
- Compliance requirements (GDPR, HIPAA, PCI)

Design thorough security testing strategies.`,
    userTemplate: `## Task
Create comprehensive security testing plan based on OWASP methodology.

## Application Context
{context}

## OWASP Testing Guide Coverage
### 1. Information Gathering
- robots.txt analysis
- Source code disclosure
- Developer comments
- Configuration files
- Technology fingerprinting

### 2. Configuration & Deployment Management
- SSL/TLS configuration
- Default credentials
- Directory enumeration
- HTTP methods
- File permissions

### 3. Identity Management
- Account enumeration
- Password policy
- Authentication bypass
- Session management
- Credential storage

### 4. Business Logic
- Workflow bypasses
- Data validation
- File upload validation
- Number of iterations
- Time-dependent logic

### 5. Input Validation
- SQL injection
- XSS (reflected/stored/DOM)
- LDAP injection
- Command injection
- XML injection
- Buffer overflow

### 6. Error Handling
- Error message analysis
- Stack trace disclosure
- Debug mode detection

### 7. Cryptography
- Weak encryption
- Hardcoded secrets
- Cookie security
- Data exposure

## Output Format
- Security checklist
- Test case definitions
- Tools recommendation
- Remediation guidance
- Compliance mapping

## Quality Criteria
- OWASP-aligned
- Risk-based prioritization
- Actionable findings`,
    outputFormat: `OWASP-aligned checklist, test cases, remediation matrix.`,
    qualityCriteria: [
      'OWASP Top 10 coverage',
      'Risk-based priority',
      'Remediation guidance',
      'Compliance mapping'
    ]
  },

  ci_pipeline: {
    system: `You are a DevOps engineer specializing in:
- GitHub Actions, GitLab CI, Jenkins, CircleCI
- Docker, Kubernetes
- Infrastructure as Code
- Quality gates
- Test automation in CI/CD

Design production-ready CI/CD pipelines.`,
    userTemplate: `## Task
Create a production-grade CI/CD pipeline with quality gates.

## Project Context
{context}

## Pipeline Requirements
### 1. Pipeline Stages
- Source (checkout, lint)
- Build (compile, bundle)
- Test (unit, integration, e2e)
- Security (SAST, DAST, dependency scan)
- Deploy (staging, production)
- Verify (smoke tests, health checks)

### 2. Quality Gates
Define thresholds for:
- Code coverage (minimum %)
- Test pass rate
- Code quality (lint score)
- Security vulnerabilities (severity threshold)
- Performance regression

### 3. Parallel Execution
- Stage parallelism
- Matrix builds
- Test sharding

### 4. Environment Strategy
- Ephemeral environments
- Environment promotion
- Rollback strategy

### 5. Notifications & Reporting
- Slack/Teams integration
- Email alerts
- PR comments
- Dashboard metrics

## Output Format
- Pipeline configuration (YAML)
- Environment configs
- Docker files
- Deployment scripts
- Monitoring setup
- Runbook documentation

## Quality Criteria
- Fast feedback loop
- Comprehensive gates
- Rollback capability
- Maintainable configuration`,
    outputFormat: `YAML pipeline configs, shell scripts, Dockerfiles, documentation.`,
    qualityCriteria: [
      'Fast execution',
      'Comprehensive checks',
      'Clear failure modes',
      'Easy maintenance'
    ]
  },

  checklist: {
    system: `You are a QA lead with expertise in release readiness assessment. You understand:
- Release criteria definition
- Risk assessment
- Compliance verification
- Stakeholder sign-off

Create comprehensive, actionable checklists.`,
    userTemplate: `## Task
Generate a comprehensive pre-release QA checklist.

## Release Context
{context}

## Checklist Categories
### 1. Functional Completeness
- [ ] All planned features implemented
- [ ] All planned test cases executed
- [ ] All critical bugs fixed
- [ ] No P0/P1 bugs open

### 2. Test Coverage
- [ ] Unit test coverage threshold met
- [ ] Integration test coverage adequate
- [ ] E2E scenarios covered
- [ ] Regression suite passed

### 3. Performance
- [ ] Load test passed
- [ ] Response times within SLA
- [ ] No memory leaks identified
- [ ] Scalability verified

### 4. Security
- [ ] Security scan completed
- [ ] No critical/high vulnerabilities
- [ ] Penetration test passed
- [ ] Compliance requirements met

### 5. Data & Migration
- [ ] Database migration scripts tested
- [ ] Data integrity verified
- [ ] Rollback procedures tested
- [ ] Backup verified

### 6. Documentation
- [ ] Release notes prepared
- [ ] User docs updated
- [ ] API docs current
- [ ] Runbook complete

### 7. Deployment
- [ ] Deployment plan documented
- [ ] Rollback plan documented
- [ ] Environment ready
- [ ] Monitoring configured

### 8. Communication
- [ ] Stakeholders notified
- [ ] Support team briefed
- [ ] Marketing prepared
- [ ] Incident response ready

## Output Format
Interactive checklist with:
- Category grouping
- Priority indicators
- Status checkboxes
- Notes/comments field
- Sign-off section

## Quality Criteria
- Comprehensive coverage
- Clear ownership
- Measurable criteria`,
    outputFormat: `Interactive markdown checklist, printable format, sign-off matrix.`,
    qualityCriteria: [
      'Complete coverage',
      'Clear ownership',
      'Measurable criteria',
      'Sign-off tracking'
    ]
  },

  requirements: {
    system: `You are a business analyst with expertise in:
- Requirements analysis (FR/NFR)
- Gap identification
- Risk assessment
- Acceptance criteria definition
- Traceability

Provide thorough requirements analysis.`,
    userTemplate: `## Task
Analyze requirements for completeness and testability.

## Requirements
{context}

## Analysis Framework
### 1. Completeness Check
- Are all functional requirements specified?
- Are non-functional requirements (performance, security, usability) defined?
- Are acceptance criteria clear and measurable?
- Are dependencies identified?
- Are constraints documented?

### 2. Ambiguity Analysis
For each requirement identify:
- Vague terms ("should", "may", "etc.")
- Undefined actors
- Missing conditions
- Unclear data requirements

### 3. Testability Assessment
Rate each requirement:
- Testable (clear pass/fail)
- Conditionally testable (needs clarification)
- Untestable (needs rework)

### 4. Risk Identification
- High-risk requirements (complex, external dependencies)
- Missing information risks
- Integration risks

### 5. Gap Analysis
- Missing requirements
- Overlapping requirements
- Contradicting requirements

### 6. Recommendations
- Questions to clarify
- Suggested acceptance criteria
- Risk mitigation strategies

## Output Format
- Requirements matrix (mapping features to test cases)
- Gap analysis report
- Risk assessment matrix
- Clarification questions list

## Quality Criteria
- Actionable feedback
- Clear priorities
- Specific questions`,
    outputFormat: `Structured analysis with matrices, tables, and actionable items.`,
    qualityCriteria: [
      'Complete coverage',
      'Clear ambiguities',
      'Testable requirements',
      'Risk identification'
    ]
  },

  observability: {
    system: `You are a platform engineer specializing in:
- Distributed tracing (OpenTelemetry, Jaeger)
- Metrics (Prometheus, Datadog)
- Logging (ELK, Loki)
- Alerting strategies
- SLO/SLI definition

Design comprehensive observability strategies.`,
    userTemplate: `## Task
Design observability strategy for the application.

## System Context
{context}

## Observability Pillars
### 1. Metrics
Define for each service:
- RED metrics (Rate, Errors, Duration)
- USE metrics (Utilization, Saturation, Errors)
- Business metrics
- Custom application metrics

Include:
- Metric definitions
- Aggregation methods
- Retention policies
- Dashboard layouts

### 2. Logging
- Log levels strategy
- Structured logging format
- Correlation IDs
- Sensitive data handling
- Log aggregation setup

### 3. Tracing
- Trace context propagation
- Span naming conventions
- Sampling strategy
- Key spans to instrument
- Distributed transaction flows

### 4. Alerts
- Alert definitions
- Severity levels
- SLO-based alerts
- Runbook links
- Escalation policies

### 5. Dashboards
- Service health dashboard
- Business metrics dashboard
- Infrastructure dashboard
- Alert summary dashboard

## Output Format
- Observability plan document
- Metric definitions
- Dashboard configurations
- Alert rules
- Instrumentation code snippets

## Quality Criteria
- Actionable alerts
- Meaningful metrics
- Comprehensive tracing`,
    outputFormat: `Configuration files, dashboard JSON, instrumentation examples.`,
    qualityCriteria: [
      'Full visibility',
      'Actionable alerts',
      'Fast debugging',
      'SLO tracking'
    ]
  },

  contract_tests: {
    system: `You are a contract testing specialist with expertise in:
- Consumer-Driven Contracts (Pact)
- Provider verification
- API versioning
- Contract breaking changes

Design effective contract testing strategies.`,
    userTemplate: `## Task
Create contract testing setup for the API.

## API Context
{context}

## Contract Testing Design
### 1. Consumer Side
Define for each consumer:
- Endpoints used
- Request/response schemas
- Interactions verified
- Provider states mocked

### 2. Provider Side
Define for each provider:
- Endpoints offered
- Response schemas
- Interaction expectations
- Provider states supported

### 3. Contract Structure
For each interaction:
- HTTP method
- Path
- Query parameters
- Headers
- Request body schema
- Response body schema
- Status codes

### 4. Provider States
Define test fixtures:
- State name
- Setup requirements
- Expected responses

## Output Format
- Pact contract files
- Consumer tests
- Provider verification tests
- CI/CD integration

## Quality Criteria
- Complete schema coverage
- Version compatibility
- Fast execution`,
    outputFormat: `Pact contract files, test implementations, verification scripts.`,
    qualityCriteria: [
      'Consumer coverage',
      'Provider verification',
      'Version compatibility'
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

  quality_metrics: {
    system: `You are a QA metrics specialist with expertise in:
- DORA metrics
- Quality indicators (CSI, RCI)
- Test analytics
- Business value metrics
- Dashboard design

Design effective quality measurement frameworks.`,
    userTemplate: `## Task
Create quality metrics framework and KPIs.

## Project Context
{context}

## Metrics Framework
### 1. DORA Metrics
- Deployment Frequency
- Lead Time for Changes
- Mean Time to Recovery (MTTR)
- Change Failure Rate

### 2. Quality Indicators
- Test Coverage %
- Code Quality Score
- Technical Debt Ratio
- Bug Escape Rate

### 3. Test Efficiency Metrics
- Test Automation ROI
- Test Execution Time
- Flaky Test Rate
- Requirements Coverage

### 4. Defect Metrics
- Defect Density
- Mean Time to Detect (MTTD)
- Defect Leakage Rate
- Rework Rate

### 5. Business Impact
- Customer-reported issues
- Production incidents
- Service Level achievement
- Cost of Quality

## Dashboard Design
For each metric:
- Definition
- Calculation method
- Target thresholds
- Visualization type
- Alert conditions

## Output Format
- Metrics framework document
- KPI definitions
- Dashboard specifications
- Data collection queries

## Quality Criteria
- Measurable KPIs
- Actionable insights
- Stakeholder relevance`,
    outputFormat: `Metrics definitions, dashboard specs, SQL queries, dashboard mockups.`,
    qualityCriteria: [
      'Measurable KPIs',
      'Clear definitions',
      'Actionable insights'
    ]
  },

  screenshot_analysis: {
    system: `You are a UI/UX specialist with expertise in:
- Visual design analysis
- Accessibility (WCAG 2.1)
- Cross-browser compatibility
- Responsive design
- UI defect detection

Analyze screenshots for design and functionality issues.`,
    userTemplate: `## Task
Analyze the provided screenshot(s) for UI/UX issues.

## Screenshots
[Screenshot provided]

## Analysis Criteria
### 1. Visual Design
- Color contrast (WCAG AA/AAA)
- Typography consistency
- Spacing/alignment
- Visual hierarchy
- Brand consistency

### 2. Accessibility (WCAG 2.1)
- Color contrast ratio check
- Text size readability
- Focus indicators
- Alt text presence (for expected images)
- Keyboard navigation support

### 3. Layout & Responsiveness
- Element alignment
- Overflow issues
- Responsive behavior
- Cross-browser rendering

### 4. UI Components
- Button states
- Form validation display
- Loading states
- Error states
- Empty states

### 5. Potential Issues
- Broken layouts
- Missing elements
- Overlapping content
- Truncated text
- Missing icons

### 6. Usability Concerns
- Click target sizes
- Navigation clarity
- Information density
- Action prominence

## Output Format
- Issue list with severity
- Screenshots with annotations (if possible)
- WCAG compliance report
- Priority recommendations

## Quality Criteria
- WCAG compliance
- Visual consistency
- Usable design`,
    outputFormat: `Structured analysis report with severity levels, accessibility checklist.`,
    qualityCriteria: [
      'WCAG compliance',
      'Visual consistency',
      'Usable design'
    ]
  }
};

export function buildPrompt(taskId: string, context: string, projectMemory?: string): { system: string; user: string } {
  const prompt = STRUCTURED_PROMPTS[taskId];
  
  if (!prompt) {
    return {
      system: 'You are a QA assistant.',
      user: context
    };
  }

  let userPrompt = prompt.userTemplate.replace('{context}', context);
  
  if (projectMemory) {
    userPrompt = `## Project Memory/Context\n${projectMemory}\n\n${userPrompt}`;
  }

  return {
    system: prompt.system,
    user: userPrompt
  };
}
