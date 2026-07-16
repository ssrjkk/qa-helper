import type { StructuredPrompt } from './index';

export const ANALYZE_PROMPTS: Record<string, StructuredPrompt> = {
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
};
