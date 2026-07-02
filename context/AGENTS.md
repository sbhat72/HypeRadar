<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:spring-agent-rules -->

# This is Spring Boot 3 with Java 21

Spring Boot 3 uses Jakarta EE namespaces — all imports are `jakarta.*` not `javax.*`. Java 21 features and Spring Security 6 patterns may differ from your training data. Read `pom.xml` for exact dependency versions before writing any backend code. Heed deprecation notices.

<!-- END:spring-agent-rules -->

## Application Building Context

Read the following files in order before implementing or making any architectural decision:

1. `project-overview.md` — product definition, goals, features, and scope
2. `CLAUDE.md` — system structure, tech stack, git workflow, and naming conventions
3. `ui-context.md` — theme, colors, typography, and component conventions
4. `code-standards.md` — implementation rules and conventions
5. `workflow.md` — development workflow, scoping rules, and delivery approach
6. `progress-tracker.md` — current phase, completed work, known issues, and next steps

Update `progress-tracker.md` after each meaningful implementation change.

If implementation changes the architecture, scope, or standards documented in the context files, update the relevant file before continuing.
