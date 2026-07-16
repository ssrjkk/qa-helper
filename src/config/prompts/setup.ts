import type { StructuredPrompt } from './index';

export const SETUP_PROMPTS: Record<string, StructuredPrompt> = {
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
};
