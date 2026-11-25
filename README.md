# Generative AI Healthcare Database Assistant — Foundation

This repository contains the real full-stack foundation, a normalized MySQL healthcare schema with fictional seed data, backend Gemini integration, and backend authentication/RBAC. Dashboard, analytics, and user-facing data features are not implemented.

## Database Schema

MySQL is used for its enforced relational integrity, transactional storage engine, and support for the SQL capabilities that later project stages will demonstrate. The schema is approximately in Third Normal Form: each entity has its own table, and names or other non-key facts are not copied into transactional records.

Major entities are `users`, `departments`, `doctors`, `patients`, `appointments`, `admissions`, `lab_reports`, `prescriptions`, and `billing`. Department owns doctors and admissions; patient owns care events and billing; appointments and prescriptions reference both a patient and doctor. All references are actual InnoDB foreign keys. Historical healthcare records use `ON DELETE RESTRICT`, preventing accidental deletion of a referenced patient, doctor, or department.

The schema enforces unique email/phone values, controlled roles and statuses, valid patient age/gender/blood group values, non-negative billing amounts, and admission/discharge date order.

Initialize the schema and fictional seed data after configuring `backend/.env`:

```bash
set -a; source backend/.env; set +a
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" < database/schema.sql
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" healthcare_ai_db < database/seed.sql
```

The seed supplies 3 password-hash-only demo users, 5 departments, 10 doctors, 50 patients, 60 appointments, and 50 records in each remaining clinical/billing table. The demo bcrypt hashes correspond to the development-only password `Demo@123`.

## Database Views

A view is a saved SQL query that presents data in a reusable, table-like form without duplicating the underlying data. `patient_summary` returns exactly one row per patient with independently aggregated appointment count, admission count, and total billing. Its separate aggregate subqueries prevent the row multiplication that can occur when several one-to-many tables are joined directly.

`department_statistics` returns every department, including a department with no admissions. It combines doctor count, admission count, and the average total billing for distinct patients admitted to that department. The billing calculation uses distinct admitted patient/department pairs so repeated admissions do not inflate the average.

Apply the views after the schema and seed scripts:

```bash
set -a; source backend/.env; set +a
MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < database/views.sql
```

## Database Indexing

An index is a database-maintained lookup structure that can make qualifying filters, joins, and sorts faster at the cost of write overhead and storage. This project indexes appointment, admission, and bill dates for date-range reports, and admission diagnosis for diagnosis filtering.

The unique `patients.phone` constraint already creates an index. MySQL/InnoDB has also created necessary indexes on foreign-key columns (`appointments.patient_id`, `appointments.doctor_id`, `admissions.department_id`, and `billing.patient_id`), so redundant indexes are deliberately not added. Indexing every column is inappropriate because it adds write and storage cost without guaranteeing query benefit.

## EXPLAIN

`EXPLAIN` shows the plan MySQL's optimizer selected for a query, including access type, candidate/selected indexes, estimated rows, and optimizer notes. Run [database/verify_indexes.sql](/Users/nirdeshhh/adbms_proj/database/verify_indexes.sql) to inspect the real indexes and the plans for two date-range queries. The optimizer—not the application—decides whether a specific index is useful; a small table may correctly use a table scan.

## Advanced SQL Techniques

[database/advanced_queries.sql](/Users/nirdeshhh/adbms_proj/database/advanced_queries.sql) is a read-only, executable SQL showcase built on the actual healthcare records. It is organized by technique so it can be run and explained during a viva.

- **Complex JOINs** combine patients, appointments, doctors, admissions, and departments to connect related healthcare facts without duplication. Queries 1A–1C demonstrate inner and left joins.
- **Aggregation** uses `COUNT`, `SUM`, `AVG`, `MIN`, and `MAX` to summarize patient population, admissions, and billing. Queries 2A–2E demonstrate this.
- **GROUP BY and HAVING** group rows before filtering aggregate results, useful for finding high-volume departments or doctors. Queries 3A–3B demonstrate this distinction.
- **Subqueries** use a query result inside another query, allowing comparisons with average and maximum billing or appointment totals. Queries 4A–4C demonstrate this.
- **Correlated subqueries** run a comparison that depends on the current outer row; Query 5A compares a patient's total billing with the average billing in that patient's city.
- **CTEs (`WITH`)** name intermediate results, improving readability for multi-stage department and billing analysis. Queries 6A–6B demonstrate this.
- **Window functions** calculate ranks and row positions without collapsing source rows. Queries 7A–7C use `RANK`, `DENSE_RANK`, `ROW_NUMBER`, and `PARTITION BY` for healthcare reporting.
- **CASE expressions** classify live records into age and billing bands. Queries 8A–8B demonstrate this.
- **Date analytics** uses `DATE_FORMAT`, `DATE`, and `DATEDIFF` for monthly trends, date ranges, and length of stay. Queries 9A–9D demonstrate this.
- **UNION ALL** combines compatible appointment and admission activity while deliberately retaining duplicates; Query 10A demonstrates this.
- **Combined analysis** uses CTEs, joins, aggregation, and a window rank together to compare departments. Query 11A demonstrates this.

Run the showcase after the schema and seed data are initialized:

```bash
set -a; source backend/.env; set +a
MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < database/advanced_queries.sql
```

## Stored Procedures

A stored procedure is a pre-defined set of SQL statements stored inside the database that can be executed with parameters. `get_patient_medical_summary(patient_id)` returns a live summary of exactly one patient: demographics, appointment/admission/lab/prescription counts, latest admission, and total billing. It uses independent scalar aggregates so multiple one-to-many records cannot multiply each other’s counts.

The backend calls it with a parameterized `CALL get_patient_medical_summary(?)` through `POST /api/db/procedure/patient-summary`. A patient ID that does not exist returns an empty summary array. Keeping this summary in the database makes a reusable, consistent data operation available to any authorized future application service.

## Audit Table and Triggers

`audit_logs` is a small trigger-auditing table for this stage only; it is not the later AI query audit system. A trigger is database logic that activates automatically in response to a data event. Here, the flow is:

`Billing INSERT → AFTER INSERT trigger → audit_logs entry`

`after_billing_insert` executes after a billing row exists and writes the inserted bill ID, patient identifier, amount, and payment status into `audit_logs`. `AFTER INSERT` ensures the generated billing ID is available and the audit entry describes a successfully inserted record. The backend can inspect actual trigger metadata at `GET /api/db/triggers` and recent audit rows at `GET /api/db/audit`.

Apply these database objects after the foundational schema:

```bash
set -a; source backend/.env; set +a
MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < database/audit.sql
MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < database/procedures.sql
MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < database/triggers.sql
```

## Transactions

A database transaction treats related changes as one logical unit of work. This project uses an **Admission + Billing** workflow: an admission is inserted, its corresponding billing record is inserted, and MySQL commits both only when both statements succeed. This prevents a healthcare record from being left in a partial state.

`POST /api/db/transactions/admission` obtains one pooled mysql2 connection, calls `beginTransaction()`, performs parameterized admission and billing inserts, then calls `commit()`. On an error, it explicitly calls `rollback()` before releasing the connection in `finally`.

`START TRANSACTION → admission INSERT → billing INSERT → COMMIT`

If billing fails:

`START TRANSACTION → admission INSERT → billing failure → ROLLBACK → no partial admission`

An SQL error does not necessarily roll back every earlier MySQL statement automatically, so the application explicitly calls `ROLLBACK` in its error handler. [database/transactions.sql](/Users/nirdeshhh/adbms_proj/database/transactions.sql) contains an executable successful demonstration and documents the rollback pattern.

### ACID Properties

- **Atomicity:** both admission and billing are committed, or neither is retained.
- **Consistency:** foreign keys and checks reject invalid relationships or amounts.
- **Isolation:** MySQL transactions do not expose incomplete intermediate work to other transactions under normal transaction isolation behavior.
- **Durability:** after `COMMIT`, MySQL persists the accepted changes.

## Federated / Distributed Database Simulation

Healthcare records can be held by independent hospitals, each with its own local patient, admission, and billing data. This project represents Hospital A and Hospital B as the separate MySQL databases `hospital_a_db` and `hospital_b_db`. Each has a compact but structurally compatible `patients`, `admissions`, and `billing` schema with its own fictional records and foreign-key constraints.

```text
Hospital A DB ──┐
                ├── Backend → Combined result
Hospital B DB ──┘
```

The backend reads both sources through fully qualified database/table names configured by `HOSPITAL_A_DB` and `HOSPITAL_B_DB`. `GET /api/db/federated/summary` returns live per-hospital and combined counts/totals. `GET /api/db/federated/admissions` returns live combined admission activity and preserves its source hospital.

Cross-database queries use `UNION ALL`, not `UNION`, because separate hospitals may legitimately have similar records and deduplication could incorrectly hide independent source data. [database/federated_queries.sql](/Users/nirdeshhh/adbms_proj/database/federated_queries.sql) contains the direct MySQL demonstrations.

This project uses two separate MySQL databases on the same local MySQL server to simulate a federated healthcare environment. It is a controlled demonstration of cross-database querying rather than a production multi-server distributed database deployment.

Initialize the local federation after configuring `backend/.env`:

```bash
set -a; source backend/.env; set +a
MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" < database/federated_hospital_a.sql
MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" < database/federated_hospital_b.sql
MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" < database/federated_queries.sql
```

## Generative AI Integration

Step 4A connects the Express backend to Gemini using Google’s official `@google/genai` Node.js SDK and the configured `gemini-3.8-flash` model. The backend reads `GEMINI_API_KEY` and `GEMINI_MODEL` from `backend/.env`; the React frontend never receives this key and Gemini is not given any database credentials.

The SDK requires Node.js 20 or newer. This project pins Node `20.20.2` in `.nvmrc`; with NVM installed, run `nvm use` in the repository root before starting the backend.

`POST /api/ai/test` accepts a short non-database prompt and returns text generated by Gemini. For example:

```json
{ "prompt": "Explain what a relational database is." }
```

This endpoint is a connectivity check only. Natural-language-to-SQL generation, SQL validation, database execution, result explanation, and visualizations are intentionally implemented in later steps.

### Schema-Aware SQL Generation

Step 4B adds `POST /api/ai/sql`. For each request, the backend reads table/view names, columns, primary keys, and foreign-key relationships from MySQL `INFORMATION_SCHEMA`, then supplies that live schema context to Gemini. Gemini returns structured JSON containing `sql`, `explanation`, `tables_used`, and optional `query_type`.

The generated SQL is returned for inspection only. It is not validated or executed in this step; SQL security validation and execution are separate later steps.

### Safe Read-Only SQL Execution

Step 4C keeps SQL generation and execution separate. `POST /api/ai/sql` still returns Gemini-generated SQL only; it never executes it. Authenticated users may submit a manually reviewed query to `POST /api/ai/sql/execute` with `{ "sql": "..." }`.

The backend validator permits only one `SELECT` statement or a `WITH` query that ultimately reads with `SELECT`. It rejects comments, multiple statements, write/schema/transaction commands, `CALL`, `EXPLAIN`, `SELECT ... INTO`, system schemas (`information_schema`, `mysql`, `performance_schema`, `sys`), and external database references. The endpoint uses the configured healthcare database pool only.

Raw tabular queries must have an explicit `LIMIT` of 500 rows or fewer. Aggregate and grouped queries are allowed without an injected limit so their semantics are not changed. The MySQL driver uses a five-second query timeout; responses include column names, actual rows, and row count. For example, `SELECT patient_id, name FROM patients LIMIT 5;` is allowed, while `DELETE FROM patients;` is rejected before execution.

### AI Assistant Orchestration

`POST /api/ai/assistant` is the authenticated backend-only orchestration endpoint. It accepts only a natural-language `{ "question": "..." }`; clients cannot supply SQL. Its controlled flow is:

`Natural language → live schema → Gemini → SQL validator → safe SQL execution → actual MySQL result`

Gemini-generated SQL is always treated as untrusted input. The orchestration service retrieves the live schema through the existing schema service, uses the existing Gemini service to generate structured SQL, validates that SQL through the existing read-only validator, and executes it only through the existing safe execution service. The generated SQL, Gemini's existing query explanation/metadata, and the actual database rows are returned only after successful validation and execution.

The assistant endpoint requires the existing httpOnly-cookie authentication. It does not grant special roles, bypass validation, execute Gemini output directly, call Gemini to explain results, or use federated databases. If Gemini is unavailable, it returns the same safe Gemini-unavailable response and executes no SQL.

## Authentication and Role-Based Access Control

Step 5A provides backend-only authentication using the existing `users.password_hash` bcrypt values. Login accepts the seeded development users `admin@hospital.test`, `doctor@hospital.test`, or `staff@hospital.test` with the development-only password `Demo@123`. The existing roles are `ADMIN`, `DOCTOR`, and `STAFF`.

- `POST /api/auth/login` validates credentials and sets a JWT only in the `healthcare_auth` httpOnly cookie. The response contains only the user ID, email, and role.
- `GET /api/auth/me` requires the cookie and returns the authenticated user's safe identity.
- `POST /api/auth/logout` clears the authentication cookie.
- `GET /api/db/audit` is the Step 5A RBAC demonstration route: only an authenticated `ADMIN` can access it. Missing/invalid authentication returns HTTP 401; a valid non-admin user receives HTTP 403.

Set `JWT_SECRET` to a long random value and `JWT_EXPIRES_IN` (for example, `8h`) in the uncommitted `backend/.env` file. The cookie uses `httpOnly`, `SameSite=Lax`, and is marked `Secure` in production. The JWT is never returned in JSON and is not stored in browser-accessible storage.

### Frontend Authentication Foundation

The React frontend provides `/login` and a protected `/` dashboard shell. On startup it calls `GET /api/auth/me`; a valid backend httpOnly cookie restores the safe user identity, while HTTP 401 redirects protected routes to `/login`. Login and logout call the existing backend endpoints with `credentials: 'include'`. The frontend never reads, stores, or exposes the JWT; the browser sends the httpOnly cookie automatically.

The dashboard currently contains only the authenticated application shell and explanatory content. It does not yet include an AI chat, generated SQL, database results, charts, or analytics UI. The React client communicates only with the Express `/api` endpoints through Vite’s local proxy.

### Frontend AI Assistant Interface

The authenticated dashboard submits a natural-language question only to `POST /api/ai/assistant` with the existing httpOnly-cookie session. The frontend never sends SQL directly. Successful backend responses render the returned question, Gemini-provided explanation, generated SQL, table/query metadata, and the actual dynamic MySQL result table.

The flow remains `question → authenticated assistant endpoint → Gemini SQL generation → SQL validation → safe read-only execution → frontend result display`. Gemini-generated SQL is still validated entirely by the backend before execution. Gemini may currently return a provider-side HTTP 503; the frontend displays this as an AI-unavailable state without inventing SQL, results, or explanations.

### Session Query History

Successful assistant responses are kept only in React state for the active page session. The Recent Queries panel can restore a previous stored response—including its visualization, SQL, explanation, and dynamic table—without another API call. History is limited to the 20 newest successful queries, is cleared by the in-app action or page refresh, and is never written to browser storage, the backend, or the database. Failed AI requests are not stored.

### Dynamic Result Visualization

When the assistant returns a successful real database result, the frontend derives an optional visualization only from `result.columns` and `result.rows`. A single numeric result becomes a KPI card. A single categorical column with a single numeric measure becomes a bar chart; the same shape becomes a line chart only when the category values actually match date/month/time formats. Raw, ambiguous, multi-measure, or incomplete results remain table-only. The dynamic result table is always retained beneath any visualization.

## AI Query Audit Logging

`ai_query_audit_logs` is a dedicated audit trail for authenticated AI-assistant attempts. It is intentionally separate from `audit_logs`, which remains reserved for the billing trigger demonstration. Apply [database/ai_query_audit.sql](/Users/nirdeshhh/adbms_proj/database/ai_query_audit.sql) after the main schema and trigger audit table are initialized.

Each record contains the authenticated user ID, question, generated SQL when available, optional query type, execution status, optional row count/execution duration, and timestamp. Statuses are `SUCCESS`, `VALIDATION_REJECTED`, `GEMINI_UNAVAILABLE`, `EXECUTION_FAILED`, and `SYSTEM_ERROR`. User and timestamp indexes support common audit searches; the user foreign key preserves referential integrity.

The assistant records successful execution, validator rejection, provider/configuration unavailability, execution failure, and unexpected system failure without changing its client response format. `GET /api/db/ai-audit` returns recent records only to authenticated `ADMIN` users; other roles receive HTTP 403. Passwords, JWTs, API keys, and bearer/token-style values are redacted before audit storage.

### Admin Audit Dashboard

Authenticated administrators can open `/admin/audit` to review the live AI query audit trail. The read-only page fetches `GET /api/db/ai-audit` with the existing httpOnly-cookie session, displays query details and execution metadata, and provides client-side status, user, and question/SQL filters. The navigation item and route are hidden/blocked for non-admin roles, while the backend endpoint remains the authoritative access-control enforcement point.

## Prerequisites

- Node.js 20.20.2 (run `nvm use` from the repository root)
- npm
- MySQL 8 or newer, running locally or remotely

## Install

From the repository root, install both workspace dependency sets:

```bash
npm install
```

## Configure MySQL

1. Create a local backend environment file: `cp .env.example backend/.env`.
2. Update `backend/.env` with your actual MySQL host, port, user, password, and database name.
3. Create the empty database (replace the name if you chose another `DB_NAME`):

```sql
CREATE DATABASE healthcare_ai_db;
```

No tables are created in this foundation stage.

## Run

Start both applications from the root:

```bash
npm run dev
```

- React frontend: http://localhost:5173
- Express backend: http://localhost:5000

## Health endpoints

- `GET /api/health` responds with backend status.
- `GET /api/db/health` performs a live `mysql2` pool connection ping. It returns HTTP 503 and a truthful unavailable state if MySQL is not reachable.
- `GET /api/db/schema-status` reads the actual base-table list and row counts from MySQL.
- `GET /api/db/views` reads the actual view metadata from MySQL.
- `GET /api/db/indexes` reads the actual index metadata for the relevant tables.
- `GET /api/db/explain` returns the actual plan for one fixed safe admission-date query.

The single frontend route (`/`) calls both endpoints through Vite's proxy and renders their actual response states.

## Build

```bash
npm run build
```
