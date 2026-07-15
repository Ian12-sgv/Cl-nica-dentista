# Expert Profiles

Use these profiles as reasoning lenses. They do not require launching real agents. Launch real agents only when the user explicitly asks for agents, delegation, or parallel work.

## Product Owner

Use for product goal, users, workflows, MVP, priorities, and acceptance criteria.

Deliver:

- Product objective
- User roles
- Main workflows
- MVP scope
- User stories
- Acceptance criteria
- Out-of-scope items

Key questions:

- Who will use this?
- What problem must the first version solve?
- What is the smallest useful version?
- What would make the project feel successful?

## Project Manager

Use for phases, dependencies, sequencing, risks, and delivery plan.

Deliver:

- Roadmap
- Milestones
- Task sequencing
- Dependencies
- Risks
- Definition of done

Key questions:

- What must happen first?
- What can run in parallel?
- What blocks implementation?
- How will progress be verified?

## Database Architect

Use for database choice, schema, relations, migrations, ORM vs SQL, reporting, backups, and data integrity.

Deliver:

- Recommended database
- Data model outline
- Relationship and transaction notes
- ORM or SQL recommendation
- Migration and backup approach
- Reporting considerations

Key questions:

- Is the data strongly relational?
- Are transactions important?
- Will reports need complex queries?
- Is the database local, server-based, or cloud-hosted?
- Does the client require SQL Server, PostgreSQL, MySQL, SQLite, or another engine?

## Backend Architect

Use for API architecture, framework choice, auth, modules, services, validation, jobs, integrations, and error handling.

Deliver:

- Backend stack recommendation
- Module boundaries
- API style
- Auth and permission approach
- Validation and error strategy
- Testing plan

Key questions:

- Is the app CRUD-heavy, workflow-heavy, realtime, or integration-heavy?
- Does it need REST, GraphQL, WebSockets, or background jobs?
- What external systems must be integrated?

## Frontend Architect

Use for frontend framework, routes, state management, UI structure, forms, tables, dashboards, and component organization.

Deliver:

- Frontend stack recommendation
- Main screens and routes
- State/data fetching approach
- Component structure
- Form and validation approach
- UX risks

Key questions:

- Is this an operational tool, public website, mobile app, or desktop app?
- What are the most repeated workflows?
- What data must users scan, filter, compare, or edit?

## UX/UI Expert

Use for flows, navigation, density, accessibility, forms, empty states, errors, and interaction quality.

Deliver:

- Main user flows
- Screen inventory
- Navigation model
- UX risks
- Accessibility considerations
- Empty, loading, and error states

Key questions:

- What does the user need to do most often?
- Where can mistakes be costly?
- What information must be visible without hunting?

## Security Expert

Use for authentication, authorization, roles, permissions, sensitive data, audit logs, input validation, rate limits, and deployment exposure.

Deliver:

- Threat/risk summary
- Auth approach
- Permission model
- Sensitive data handling
- Validation requirements
- Audit/logging requirements

Key questions:

- Who can see or change sensitive data?
- Are there admin-only operations?
- Is audit history required?
- What happens if credentials leak?

## QA/Test Expert

Use for acceptance tests, unit tests, integration tests, regression risks, edge cases, and release validation.

Deliver:

- Critical test cases
- Test levels needed
- Manual validation checklist
- Regression risks
- Definition of done

Key questions:

- Which flows must never break?
- What data edge cases matter?
- How can the feature be verified quickly?

## DevOps Expert

Use for environments, deploy, CI/CD, Docker, variables, secrets, backups, monitoring, and rollback.

Deliver:

- Environment plan
- Deployment approach
- Required variables/secrets
- Build and release steps
- Backup/restore notes
- Monitoring and rollback plan

Key questions:

- Where will this run?
- Who operates it?
- Is downtime acceptable?
- How will backups and restores be tested?

## Data/Reports Expert

Use for analytics, dashboards, KPIs, report queries, exports, aggregations, and data freshness.

Deliver:

- Report inventory
- Metrics definitions
- Query/data-source plan
- Export requirements
- Performance risks

Key questions:

- What decisions will reports support?
- Which reports are required for MVP?
- Are reports realtime, daily, monthly, or historical?
