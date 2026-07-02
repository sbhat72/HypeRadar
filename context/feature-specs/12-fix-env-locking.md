Read `AGENTS.md` before starting.

# Fix: Supabase Database Connection

## Problem

The backend is failing to authenticate with Supabase because the
transaction pooler connection format (port 6543) requires the username
in the format `postgres.{ref}` which conflicts with how Spring Boot's
JDBC driver passes credentials. The backend falls back to connecting
as plain `postgres` and authentication fails.

## Solution

Switch from the transaction pooler to Supabase's direct connection.
The direct connection uses standard PostgreSQL format on port 5432
with a simple `postgres` username — no project ref suffix required.

## What To Change

Open `backend/src/main/resources/application-local.properties` and
replace the three database lines with the following:

```properties
spring.datasource.url=jdbc:postgresql://db.jwipvcbbuxyrcgdqkvpe.supabase.co:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=K@runa2037
```

Note the differences from the previous config:
- Host changes from `aws-1-us-east-2.pooler.supabase.com` to `db.jwipvcbbuxyrcgdqkvpe.supabase.co`
- Port changes from `6543` to `5432`
- Username changes from `postgres.jwipvcbbuxyrcgdqkvpe` to `postgres`

Also remove the `spring.jpa.database-platform` line from
`application.properties` if it was added — Hibernate detects
PostgreSQL automatically and the line triggers a deprecation warning:

```properties
# Remove this line if present:
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

## How To Run

```cmd
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

## Check When Done

- [ ] Logs show `HikariPool-1 - Start completed` — database connected
- [ ] No `password authentication failed` error
- [ ] Application starts successfully and Tomcat is running on port 8080