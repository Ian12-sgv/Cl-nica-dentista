# Decision Frameworks

Use these as practical starting points, not rigid rules. Prefer the simplest option that satisfies the product, data, team, and deployment constraints.

## Database

Prefer a relational database when the project includes sales, inventory, accounting, customers, permissions, audit logs, reports, or strong relationships.

Common choices:

- PostgreSQL: strong default for web apps, relational data, reports, JSON support, transactions, and low licensing cost.
- SQL Server: good when the client is Microsoft-heavy, enterprise Windows-based, or already operates SQL Server.
- MySQL/MariaDB: good for common hosting, simpler relational workloads, and teams already familiar with it.
- SQLite: good for local-first, prototypes, desktop apps, tests, and small single-user tools.
- MongoDB/NoSQL: consider only when document shape is flexible, relationships are weak, or scale/access patterns justify it.

Recommendation format:

- Recommended default
- Why it fits
- Alternatives considered
- When to choose each alternative
- Risks and checks

## ORM vs Direct SQL

Prefer an ORM when the project needs faster CRUD development, typed models, migrations, relationship handling, and maintainability.

Prefer direct SQL when the project needs complex reporting queries, heavy optimization, database-specific features, or strict control over generated queries.

Use a hybrid approach when:

- ORM handles normal CRUD and transactions.
- Direct SQL handles reports, analytics, exports, or performance-critical queries.

Always verify:

- Migration workflow
- Transaction support
- Query performance for critical paths
- How schema changes are reviewed and deployed

## Backend

Choose backend architecture based on workflows, team familiarity, deployment environment, and integration needs.

Common options:

- NestJS: good for structured TypeScript APIs, modules, validation, dependency injection, and larger apps.
- Express/Fastify: good for smaller Node APIs or custom lightweight services.
- .NET: good for SQL Server-heavy, Windows/enterprise, strong typing, and long-lived business apps.
- Django/FastAPI: good for Python teams, admin-heavy tools, APIs, data work, and fast iteration.

Start monolithic unless there is a real reason to split services.

## Frontend

For operational systems, prioritize speed, density, predictable navigation, forms, tables, filters, validation, and error states.

Common options:

- React: strong default for web apps, ecosystem, component reuse, dashboards, and data-heavy interfaces.
- Next.js: useful when routing, server rendering, auth integration, or full-stack deployment patterns matter.
- Vue/Nuxt: good when the team prefers Vue simplicity and conventions.
- Angular: good for enterprise teams that want batteries-included structure.

Avoid landing-page style UI for internal tools unless the user explicitly wants marketing pages.

## Auth And Permissions

Start with the simplest permission model that protects real data.

Common levels:

- Single admin: simplest internal MVP.
- Role-based access control: good for admin, manager, seller, inventory, support.
- Permission-based access control: use when roles vary by client or business process.
- Audit logs: use when financial, inventory, compliance, or accountability needs exist.

Verify password handling, session/token lifetime, protected routes, backend authorization, and sensitive logs.

## Deployment

Do not add Docker, CI/CD, queues, or cloud services by default. Add them when they solve a real operational need.

Start by deciding:

- Local, LAN, VPS, cloud platform, or desktop
- Number of users
- Backup/restore responsibility
- Environment variables and secrets
- Update process
- Monitoring and recovery expectations

## Testing

Minimum planning output should include acceptance criteria. Add automated tests based on risk.

Test first:

- Login/auth
- Data creation/edit/delete
- Critical business rules
- Inventory or financial calculations
- Permission boundaries
- Migration and seed behavior
- Report totals

Definition of done should include the commands or manual checks that prove the work is complete.
