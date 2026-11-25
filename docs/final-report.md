# Generative AI Healthcare Database Assistant

## Final Project Report Content

**Project type:** Advanced Database Management Systems mini-project  
**Technology stack:** React, Vite, TypeScript, Tailwind CSS, Recharts, Node.js, Express, MySQL, mysql2, Gemini SDK, JWT, and bcrypt  
**Database:** `healthcare_ai_db`, with `hospital_a_db` and `hospital_b_db` for the local federated simulation

---

## 1. Title

**Generative AI Healthcare Database Assistant**

## 2. Abstract

Healthcare databases contain linked patient, clinical, appointment, admission, laboratory, prescription, and billing information. Although relational databases support expressive querying, many users cannot formulate the SQL required to obtain information safely. This project implements a Generative AI Healthcare Database Assistant that combines a live MySQL healthcare database with a protected natural-language interface.

The system uses a React and TypeScript frontend with a Node.js, Express, and TypeScript backend. It retrieves the current database schema from MySQL `INFORMATION_SCHEMA`, sends schema-aware requests to Gemini, validates generated SQL server-side, and permits only constrained read-only execution. It also demonstrates relational constraints, views, indexes, EXPLAIN, advanced analytical SQL, stored procedures, triggers, ACID transactions, rollback, a two-hospital federated simulation, JWT authentication, role-based access control, and dedicated AI-query audit logging.

Final integration verification confirmed the database, backend, frontend, security controls, and audit dashboard. A safe controlled patient-count query returned 50 patients; destructive SQL was rejected before execution; an invalid billing transaction was rolled back without partial records; and administrative audit access was enforced. Gemini integration is real and reached the provider, but provider-side high-demand responses returned HTTP 503 during final testing. The application handled this safely, executed no SQL for the failed request, and recorded a `GEMINI_UNAVAILABLE` audit event. No mock SQL or fallback response was used.

## 3. Introduction

Healthcare organizations require reliable access to patient and operational data for clinical coordination, administration, and analysis. In a relational database, information is distributed across linked entities such as patients, doctors, departments, appointments, admissions, laboratory reports, prescriptions, and billing records. Traditional database interfaces generally require users to understand table structures and SQL syntax before they can ask meaningful questions.

This project addresses that usability barrier while preserving database safety. An authenticated user can ask a healthcare-related question in natural language. The backend obtains current schema metadata, requests MySQL-compatible SQL from Gemini, validates the resulting SQL, executes only permitted read-only queries, and presents actual MySQL results. The system is not a static prototype: its database, API routes, authentication, validation, federated simulation, and audit trail are implemented and tested against live local databases.

## 4. Problem Statement

Healthcare data is commonly stored in relational databases, but non-technical users may be unable to retrieve information because they do not know the schema or SQL. Even technically correct SQL can be unsafe when executed without restrictions, particularly where data integrity, access control, and traceability matter.

The problem is to provide a controlled natural-language access layer for a healthcare database that can eventually translate questions into SQL without allowing users or generated SQL to alter data, bypass security, or access unauthorized database objects. The solution must retain demonstrable DBMS capabilities such as constraints, transactions, procedural SQL, triggers, indexing, distributed-data simulation, and auditing.

## 5. Problem Analysis

The healthcare domain involves multiple related records. One patient may have appointments, admissions, lab reports, prescriptions, and billing records. Doctors are associated with departments and appointments; admissions are associated with patients and departments. A question such as “How many patients were admitted to each department?” therefore requires relationships, joins, grouping, and aggregation.

The main risks are that users without SQL knowledge cannot reliably express relational questions; AI-generated SQL cannot be trusted automatically; healthcare data must preserve integrity and traceability; and separate hospitals may hold separate datasets. The project responds with schema-aware generation, backend-only SQL validation and execution, cookie-based authentication, role-based access control, separate trigger and AI audit tables, and a local federated simulation.

## 6. Existing System and Limitations

In a conventional database workflow, an authorized user works through database tools, forms, reports, or SQL consoles. These approaches can be effective for trained users but create limitations for users who cannot write joins, subqueries, grouping queries, date analytics, or window functions. Generic chatbot access without schema context also risks invented table names, columns, or relationships.

Direct SQL access can create additional risks if DML or DDL commands are permitted without careful authorization, validation, auditing, result limits, and timeouts. A static frontend demonstration would also be insufficient because it would not establish that results came from a real database or that database safety was enforced.

## 7. Proposed System

The proposed system is a full-stack healthcare database assistant. The frontend supplies an authenticated workspace and the backend provides database and AI services. Schema metadata is retrieved dynamically from MySQL. Gemini is used only server-side for structured SQL generation. Generated SQL is considered untrusted until the validator approves it. The executor uses the MySQL connection pool and returns actual result rows only for permitted read-only statements. Results can be displayed as tables and, where data shape permits, as KPI, bar, or line visualizations.

The system includes an administrator-only audit dashboard. It displays the dedicated `ai_query_audit_logs` records, which are intentionally distinct from the existing `audit_logs` table used by the billing trigger.

## 8. Objectives

1. Design and implement a relational healthcare database with meaningful relationships and constraints.
2. Demonstrate advanced DBMS techniques using real MySQL objects and queries.
3. Implement schema-aware natural-language-to-SQL generation using real Gemini integration.
4. Enforce backend-side read-only SQL validation before execution.
5. Return real database results rather than hardcoded frontend data.
6. Protect access through JWT authentication, httpOnly cookies, and role-based access control.
7. Record authenticated AI-query attempts in a dedicated audit trail.
8. Provide a usable frontend for the assistant and administrator audit review.

## 9. Scope

### Implemented scope

The implemented scope includes the main healthcare database, seed data, views, indexes, query plans, advanced SQL, a stored procedure, a billing trigger, rollback-capable transactions, federated hospital simulation, Gemini integration, live schema metadata retrieval, safe execution services, authentication, role-based access control, a React dashboard, dynamic result presentation, visualization selection, session-only query history, and an administrator audit dashboard.

### Deliberate scope boundaries

The system does not implement write operations through the AI assistant. It does not add AI-generated post-query result explanations, production federation routing through Gemini, external hospital connections, or permanent browser-side query history. The assistant does not use a fabricated response when Gemini is unavailable.

## 10. Feasibility

### Technical feasibility

The project is technically feasible because it uses a local MySQL database, a TypeScript Express backend, and a Vite React frontend. MySQL provides the relational, transaction, trigger, view, and metadata capabilities required by the project. The backend isolates database credentials and the Gemini API key in the local environment. Node.js version `20.20.2` meets the runtime requirement for the installed Gemini SDK.

### Operational feasibility

The interface follows a simple workflow: sign in, enter a question, view the validated result, and inspect audit history where authorized. Administrators have a separate audit view. The design does not require ordinary users to write SQL directly.

### Economic feasibility

The project relies on local development tools and open-source framework components. The evaluation version uses a local MySQL setup and does not require cloud database infrastructure. Gemini availability and quota are external service considerations; the application fails safely when that service is unavailable.

## 11. Methodology

The project was developed incrementally. Each feature was implemented against the existing application, tested with real database or API behavior, and kept within a defined scope. The database foundation was established before the AI interface. Advanced DBMS objects were implemented and verified before SQL validation, safe execution, authentication, UI integration, audit logging, and final regression testing.

The development sequence was: define the healthcare schema and seed controlled data; add and verify DBMS objects; build the Express API and MySQL connection pool; add Gemini and live schema metadata; add validation and constrained execution; add authentication and UI integration; add dedicated auditing; and complete integration and demonstration-readiness verification.

## 12. System Architecture

```text
React Frontend
  ├─ Login and protected dashboard
  ├─ AI assistant interface and result presentation
  ├─ Session-only recent query history
  └─ ADMIN audit dashboard
          │ httpOnly cookie credentials
          ▼
Node.js Express Backend
  ├─ Authentication and RBAC middleware
  ├─ Schema service using INFORMATION_SCHEMA
  ├─ Gemini service
  ├─ SQL validator and read-only executor
  └─ AI query audit service
          │
          ▼
MySQL: healthcare_ai_db, hospital_a_db, hospital_b_db
```

**Required system architecture diagram:** show the React client, Express backend, authentication middleware, schema service, Gemini service, validator, executor, main database, federated databases, and audit logging. Mark credentials and API keys as server-side only.

## 13. Database Design

The main database is `healthcare_ai_db`. Its entities are `users`, `departments`, `doctors`, `patients`, `appointments`, `admissions`, `lab_reports`, `prescriptions`, `billing`, `audit_logs`, and `ai_query_audit_logs`.

| Entity | Purpose |
|---|---|
| `users` | Authentication identity, password hash, and role |
| `departments` | Healthcare departments |
| `doctors` | Doctors associated with departments |
| `patients` | Patient demographic information |
| `appointments` | Patient-doctor appointments |
| `admissions` | Patient admissions by department |
| `lab_reports` | Patient laboratory records |
| `prescriptions` | Patient prescriptions |
| `billing` | Patient billing and payment status |
| `audit_logs` | Billing-trigger audit records |
| `ai_query_audit_logs` | Dedicated AI assistant audit records |

The database uses InnoDB. It contains primary keys, auto-increment identifiers, foreign keys, unique constraints, NOT NULL constraints, and CHECK constraints. These rules enforce integrity in the database itself rather than relying only on frontend behavior. Current verified counts are 3 users, 50 patients, 52 admissions, 52 billing records, 2 trigger audit records, and 6 AI-query audit records.

## 14. ER and Data Model Explanation

The model is centered on the patient. A patient may have multiple appointments, admissions, lab reports, prescriptions, and billing records. Departments organize doctors and admissions. Doctors participate in appointments and prescriptions. Users are related to the dedicated AI-query audit table.

```text
departments → doctors
departments → admissions
patients → appointments, admissions, lab_reports, prescriptions, billing
doctors → appointments, prescriptions
users → ai_query_audit_logs
```

**Required ER diagram:** include every main entity, primary key, foreign key, and cardinality. Include `users` to `ai_query_audit_logs`, and distinguish the trigger-owned `audit_logs` table from AI-query auditing.

## 15. Advanced DBMS Techniques

### 15.1 Views

**Implemented:** `patient_summary` and `department_statistics` views.  
**Why:** Views provide reusable, simplified patient- and department-level relational summaries.  
**Where:** Main MySQL database and `GET /api/db/views`.  
**Verification:** Final testing returned both live view definitions.

### 15.2 Indexing

**Implemented:** Indexes include appointment date, admission date, admission diagnosis, billing date, and user/time audit access paths.  
**Why:** These fields are realistic candidates for temporal filtering, diagnosis analysis, and audit review.  
**Where:** MySQL index metadata and `GET /api/db/indexes`.  
**Verification:** The endpoint returned 14 index metadata rows. The small dataset does not justify a performance-improvement claim.

### 15.3 EXPLAIN

**Implemented:** An EXPLAIN endpoint for a date-filtered admission query.  
**Why:** EXPLAIN supports discussion of optimizer planning and query design.  
**Where:** `GET /api/db/explain`.  
**Verification:** The endpoint returned a live query-plan row. No measured performance improvement is claimed.

### 15.4 Advanced SQL

**Implemented:** Read-only joins, left joins, aggregation, GROUP BY, HAVING, subqueries, correlated subqueries, CTEs, ranking/window functions, CASE expressions, date analytics, length-of-stay analysis, UNION ALL, and multi-stage aggregation/ranking.  
**Why:** These techniques answer practical healthcare questions beyond simple table lookups.  
**Where:** `database/advanced_queries.sql`.  
**Verification:** The read-only suite executed successfully during final integration verification.

### 15.5 Stored Procedure

**Implemented:** `get_patient_medical_summary(IN p_patient_id INT)`.  
**Why:** It encapsulates a reusable multi-table medical summary close to the data.  
**Where:** Main MySQL database and `POST /api/db/procedure/patient-summary`.  
**Verification:** The live summary for patient 1 returned demographics, appointment/admission/lab/prescription counts, latest admission, and billing total.

### 15.6 Trigger and Trigger Audit

**Implemented:** `after_billing_insert` writes a record to `audit_logs`.  
**Why:** It demonstrates automatic database-side auditing after a billing insert.  
**Where:** Main database, `database/triggers.sql`, `GET /api/db/triggers`, and `GET /api/db/audit`.  
**Verification:** The trigger was present during final checks; `audit_logs` contained 2 retained records. It is separate from AI auditing.

### 15.7 Transactions and ACID Behavior

**Implemented:** The admission transaction endpoint inserts an admission and billing row in one transaction using `beginTransaction`, `commit`, `rollback`, and connection release.  
**Why:** Admission and billing must not be partially saved when the workflow fails.  
**Where:** `POST /api/db/transactions/admission`.  
**Verification:** An invalid billing amount produced `ER_CHECK_CONSTRAINT_VIOLATED` and HTTP 409. No partial admission or billing record remained.

### 15.8 Federated Database Simulation

**Implemented:** `hospital_a_db` and `hospital_b_db`, each with patients, admissions, and billing. Cross-database aggregation uses `UNION ALL` and a source label.  
**Why:** It demonstrates a controlled distributed-healthcare scenario in which data remains in separate databases.  
**Where:** Federated SQL scripts and `/api/db/federated/summary` and `/api/db/federated/admissions`.  
**Verification:** Hospital A contained 8 patients, 10 admissions, and 33,300.00 billing. Hospital B contained 7 patients, 9 admissions, and 29,600.00 billing. The combined endpoint returned 15 patients, 19 admissions, and 62,900.00 billing.

## 16. Generative AI Integration

The project uses the official `@google/genai` SDK from the Node.js backend. The Gemini model is configured through environment variables, not embedded in TypeScript or exposed to the frontend. Gemini receives a schema-aware context and is instructed to produce structured MySQL-compatible output using only supplied database structures.

The API key remains only in the local backend environment configuration. It is not sent to the frontend, returned by the API, written to this report, or stored in AI audit records.

During final testing, a real request reached Gemini but received a provider-side HTTP 503/high-demand response. This confirms real provider communication but does **not** demonstrate successful live Gemini-generated SQL. The backend returned a safe unavailable response; it did not create fallback SQL or mock data.

## 17. Natural Language to SQL Workflow

```text
Natural-language question
        ↓
Authenticated POST /api/ai/assistant
        ↓
Live schema retrieval from INFORMATION_SCHEMA
        ↓
Gemini structured SQL generation
        ↓
Server-side SQL validation
        ↓
Safe read-only MySQL execution
        ↓
Actual result rows and metadata
        ↓
Frontend table and suitable visualization
        ↓
Dedicated AI query audit record
```

The frontend submits a question only to the authenticated assistant endpoint; it does not execute SQL. Successful results depend on provider generation and validator approval. When Gemini is unavailable, the pipeline stops before SQL execution.

**Required AI pipeline diagram:** depict each stage above, validation before execution, the audit write after processing, and an error branch from Gemini to a safe unavailable response with a `GEMINI_UNAVAILABLE` audit record.

## 18. SQL Validation and Safe Execution

The validator accepts only one read-only `SELECT` or `WITH ... SELECT` query. It rejects multiple statements, comments, INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, transaction commands, CALL, EXPLAIN, SELECT INTO, system schemas, external-database references, unbounded raw reads, and LIMIT values above 500.

The executor validates SQL again before querying through the configured MySQL pool. Raw result sets are limited to 500 rows and the driver uses a five-second timeout. During verification, `SELECT COUNT(*) AS patient_count FROM patients` returned 50. Destructive statements such as DELETE and DROP were rejected with HTTP 400 before execution.

## 19. Authentication and RBAC

Authentication uses bcrypt password verification and a JWT containing only user ID and role. The JWT is set only in the `healthcare_auth` httpOnly cookie. The cookie uses `SameSite=Lax` and is marked secure in production. The frontend uses `credentials: 'include'` and does not read or store the JWT in browser-accessible storage.

Roles are `ADMIN`, `DOCTOR`, and `STAFF`. Protected routes redirect unauthenticated users to login. The AI assistant endpoint is authenticated but not ADMIN-only. The AI audit endpoint and dashboard are ADMIN-only. Final verification returned HTTP 200 for an administrator, HTTP 403 for doctor and staff roles, and HTTP 401 without authentication.

## 20. AI Query Audit Logging

`ai_query_audit_logs` records authenticated assistant attempts. It contains an identifier, user reference, question, generated SQL when available, query type when available, execution status, row count when available, execution duration when available, and timestamp. It uses an InnoDB foreign key to `users` and indexes appropriate for user/time review.

Statuses include `SUCCESS`, `VALIDATION_REJECTED`, `GEMINI_UNAVAILABLE`, `EXECUTION_FAILED`, and `SYSTEM_ERROR`. Audit writes are parameterized. Patterns resembling API keys, JWTs, bearer tokens, and password/token assignments are redacted before storage. The table is deliberately separate from `audit_logs`, which is reserved for the billing trigger.

The final database contained 6 AI-query audit records. The administrator dashboard displayed real records including a successful controlled read-only verification, a validation rejection, and Gemini-unavailable entries. It displayed question, SQL when available, status, row count, and execution time.

**Required security and audit-flow diagram:** show authentication before the assistant route, Gemini/schema/validator/executor processing, then audit outcome recording. Distinguish AI audit logging from billing-trigger auditing.

## 21. Frontend Implementation

The frontend uses React, Vite, TypeScript, Tailwind CSS, React Router, Lucide icons, and Recharts. Implemented screens and states are:

- Login screen with invalid-login feedback.
- Protected dashboard with session restoration.
- Natural-language assistant input with client-side empty-question and length checks.
- Loading and safe AI-unavailable error states.
- Dynamic table for actual result rows returned by the backend.
- KPI visualization for one numeric cell.
- Bar visualization for a categorical column and one numeric measure.
- Line visualization when the category is a date or month value and one numeric measure is available.
- Session-only recent query history with a maximum of 20 entries.
- Administrator audit dashboard with search and status/user filters.
- Role-aware navigation that shows the audit option only to administrators.

The visualization logic was verified using live read-only results: a one-cell patient count maps to a KPI, department admission aggregation maps to a bar chart, and monthly admission aggregation maps to a line chart. A successful live Gemini result could not be demonstrated because of the provider-side 503 limitation.

## 22. Module-wise Implementation

| Module | Implemented responsibility |
|---|---|
| Database schema | Healthcare entities, constraints, seed data, InnoDB relationships |
| Database analytics | Views, indexes, EXPLAIN, advanced SQL, procedure, trigger, transaction workflow |
| Federated simulation | Separate Hospital A/B databases and combined read-only queries |
| Authentication | bcrypt validation, JWT httpOnly cookie, safe current-user response |
| Authorization | Protected backend routes, role middleware, ADMIN audit access |
| Schema service | Dynamic table, column, key, and relationship retrieval from `INFORMATION_SCHEMA` |
| Gemini service | Server-side provider integration and safe error handling |
| SQL safety | Read-only validator, result limit, timeout, executor |
| AI orchestration | Question-to-schema-to-generation-to-validation-to-execution flow |
| AI audit service | Parameterized audit writes, redaction, admin query retrieval |
| React dashboard | Assistant input, result display, visualization selection, session history |
| Admin audit UI | Read-only audit review, filtering, role-aware navigation |

## 23. Testing Strategy

Testing used real local MySQL databases, backend HTTP endpoints, authenticated cookie sessions, direct database metadata inspection, and browser checks. The strategy emphasized regression testing after each incremental step. It checked successful paths, controlled invalid paths, role restrictions, database integrity, and external-provider failure handling.

The final integration pass verified backend and frontend builds on Node.js 20.20.2, public/database endpoints, stored procedures, federated endpoints, authentication, authorization, validation, audit behavior, frontend routing, and visualization classification. The known Gemini provider limitation was tested once rather than repeatedly retrying the provider.

## 24. Test Cases and Results

| Test ID | Module | Test case | Expected result | Actual result | Status |
|---|---|---|---|---|---|
| TC-01 | Build | Run backend and frontend production build | Both compile successfully | Build passed on Node 20.20.2 | PASS |
| TC-02 | Health | Request `/api/health` | Backend status response | HTTP 200 | PASS |
| TC-03 | Database | Request `/api/db/health` | MySQL reachability response | HTTP 200 | PASS |
| TC-04 | Schema | Request schema status | Live tables and counts returned | 11 tables; patient count 50 | PASS |
| TC-05 | Views | Request database views | Live view metadata returned | `patient_summary`, `department_statistics` | PASS |
| TC-06 | Indexes and EXPLAIN | Request index and EXPLAIN endpoints | Metadata and plan returned | 14 index rows; EXPLAIN result returned | PASS |
| TC-07 | Procedure | Request patient 1 summary | Live multi-table summary returned | HTTP 200 with summary values | PASS |
| TC-08 | Trigger | Inspect trigger and trigger audit | Trigger remains available | `after_billing_insert`; 2 `audit_logs` records | PASS |
| TC-09 | Transaction | Submit invalid billing amount | Rollback with no partial write | HTTP 409; constraint violation; no partial row | PASS |
| TC-10 | Federated DB | Request summary and admissions | Combined cross-database result | 15 patients, 19 admissions, 62,900.00 | PASS |
| TC-11 | Authentication | Valid ADMIN, DOCTOR, STAFF login | Authorized roles authenticate | HTTP 200 for all valid roles | PASS |
| TC-12 | Authentication | Invalid login | Authentication denied | HTTP 401 | PASS |
| TC-13 | RBAC | Access AI audit as ADMIN | Audit records available | HTTP 200 | PASS |
| TC-14 | RBAC | Access AI audit as DOCTOR or STAFF | Access denied | HTTP 403 | PASS |
| TC-15 | RBAC | Access AI audit without cookie | Authentication required | HTTP 401 | PASS |
| TC-16 | SQL safety | Execute controlled read-only count | Real result returned | Patient count 50 | PASS |
| TC-17 | SQL safety | Submit destructive SQL | Rejected before execution | HTTP 400 | PASS |
| TC-18 | Gemini | Submit authenticated assistant request | Safe provider failure if unavailable | HTTP 503 from safe application path | BLOCKED BY EXTERNAL PROVIDER |
| TC-19 | AI audit | Inspect provider-failure audit | `GEMINI_UNAVAILABLE` recorded | Audit record present | PASS |
| TC-20 | Frontend | Restore session after reload | Dashboard remains authenticated | Verified in browser | PASS |
| TC-21 | Frontend | Empty assistant question | User-facing validation feedback | Displayed without request | PASS |
| TC-22 | Frontend | Administrator audit page | Live audit records visible | Six records displayed | PASS |
| TC-23 | Frontend RBAC | Direct doctor access to admin audit route | Route blocked | Redirected to dashboard; navigation absent | PASS |
| TC-24 | Visualization | Classify live query result shapes | KPI/bar/line selected appropriately | All three shapes verified | PASS |

## 25. Security Considerations

- Database credentials, JWT secret, and Gemini API key are environment-configured server-side values.
- Passwords are stored as bcrypt hashes and are never included in safe user responses.
- The JWT is not returned in JSON and remains in an httpOnly cookie.
- Authentication and authorization are enforced by backend middleware, not by frontend navigation alone.
- Gemini output is treated as untrusted until server-side validation succeeds.
- The executor uses a 500-row maximum and five-second timeout.
- System schemas, external database references, comments, multiple statements, DDL, DML, transaction commands, CALL, EXPLAIN, and SELECT INTO are rejected.
- AI audit entries are parameterized and redact secret-like values.
- The frontend does not contain API keys, passwords, JWTs, or direct database access.
- The admin audit interface is read-only and has no edit or delete operation.

## 26. Results and Observations

The implemented database provides enough real data to demonstrate patient counts, department-level admission aggregation, monthly admission analysis, billing-status aggregation, stored-procedure output, transaction rollback, and federated totals. The controlled safe SQL execution returned a patient count of 50. Department data contained one department with 12 admissions and four departments with 10 admissions. Monthly admission data covered twelve months. Billing records were available across PAID, PENDING, and CANCELLED statuses.

Security controls behaved as intended: destructive SQL was rejected before execution, invalid billing was rolled back without partial data, and the audit endpoint was restricted to administrators. The separate trigger and AI audit tables make audit provenance clear.

This result is not a database-performance benchmark or Gemini-accuracy study. The seeded database is small, and successful live Gemini SQL generation could not be verified because the external provider was unavailable during final testing.

## 27. Limitations

1. Provider-side Gemini HTTP 503/high-demand responses prevented a successful live Gemini-generated SQL demonstration during final testing.
2. The database is a controlled academic dataset rather than a production clinical dataset.
3. Index usage and performance gains are not claimed because the dataset is small and no benchmark study was conducted.
4. The federated component is a local two-database simulation, not a production distributed deployment.
5. AI-assisted write operations are intentionally excluded; the assistant is read-only.
6. Session query history is intentionally limited to the active frontend session and is not persistent browser storage.

## 28. Future Scope

Future work may include re-verifying live Gemini generation when the provider is available, richer controlled result explanation, production-grade operational monitoring, configurable audit-retention policies, expanded role permissions, a larger anonymized dataset, and carefully governed federated routing. Any future change should preserve backend-side SQL validation, access control, auditability, and the read-only default.

Future scope is not claimed as currently implemented functionality.

## 29. Team Contributions

> **Placeholder: complete this section only with verified team information. Do not retain placeholder labels in the submitted report.**

| Team member | University ID | Actual responsibilities | Evidence or modules |
|---|---|---|---|
| [Member 1 name] | [ID] | [For example: database design and advanced SQL] | [Files, objects, or tested modules] |
| [Member 2 name] | [ID] | [For example: backend and API implementation] | [Files, objects, or tested modules] |
| [Member 3 name] | [ID] | [For example: frontend and test preparation] | [Files, objects, or tested modules] |

## 30. Conclusion

The Generative AI Healthcare Database Assistant demonstrates a working Advanced DBMS project that combines real relational data management with a controlled natural-language access architecture. The project implements the database design, DBMS techniques, authentication, authorization, safe SQL execution, federated simulation, auditing, and frontend presentation required for a serious full-stack academic system.

The key design decision is that AI-generated SQL is never executed directly. It passes through live schema context, backend-side validation, constrained execution, and audit logging. Final verification showed that database integrity, access restrictions, transaction rollback, and audit behavior work together. Although live Gemini success was externally blocked during the final test, the system handled provider failure safely and did not fabricate a result. This preserves the accuracy and security claims of the project.

## 31. References

Use the following project and official technical sources in the final formatted submission. Add institutional citation formatting only after confirming the required style.

1. Project source repository and local implementation artifacts, including `README.md`, `database/schema.sql`, `database/advanced_queries.sql`, `database/triggers.sql`, `database/ai_query_audit.sql`, and backend/frontend source code.
2. MySQL Reference Manual, for InnoDB, constraints, views, indexes, EXPLAIN, stored procedures, triggers, transactions, and `INFORMATION_SCHEMA` concepts.
3. Node.js documentation, for the runtime environment.
4. Express documentation, for backend routing and middleware concepts.
5. React and Vite documentation, for frontend component and build concepts.
6. `mysql2` package documentation, for MySQL pooling and query execution.
7. Google Gen AI SDK documentation, for server-side Gemini integration.
8. JSON Web Token and bcrypt documentation, for authentication concepts.

No external performance statistics, clinical statistics, Gemini-accuracy claims, or unverified citations are included in this report.

## Required Diagram and Screenshot Plan

The following visuals should be captured or drawn from the real project before submission. They are specified here only; no screenshot is fabricated in this report.

| Item | Required content | Suggested report location |
|---|---|---|
| System architecture diagram | React, Express, auth middleware, schema service, Gemini, validator, executor, main/federated databases, audit logging | Section 12 |
| ER diagram | Main entities, PK/FK links, `users` to `ai_query_audit_logs`, and the distinction from `audit_logs` | Sections 13–14 |
| AI pipeline diagram | Question through authentication, schema, Gemini, validation, execution, visualization, audit, plus safe provider-error branch | Sections 16–18 |
| Federated architecture diagram | Main healthcare database and separate Hospital A/B databases with combined read-only reporting | Section 15.8 |
| Security/audit-flow diagram | httpOnly cookie, RBAC, validator, executor, trigger audit, and AI audit | Sections 19–20 |
| Login screenshot | Real login screen and secure-session context | Section 21 |
| Dashboard screenshot | Real protected dashboard and assistant interface | Section 21 |
| Result table/visualization screenshot | Capture only after a real successful result is available; otherwise show controlled execution evidence separately | Sections 21 and 26 |
| Admin audit screenshot | Real ADMIN dashboard with status, SQL when present, rows, and duration | Section 20 |
| DBMS evidence screenshots | MySQL or endpoint output for views, EXPLAIN, procedure, trigger audit, rollback, and federation | Sections 15 and 24 |

## Mapping to Evaluation Criteria

| Evaluation area | Concrete project evidence |
|---|---|
| Problem and domain analysis | Healthcare relational-data usability problem, multi-entity analysis, SQL-safety risks, and solution rationale in Sections 3–7 |
| Existing systems and feasibility | Conventional SQL-interface limitations and technical, operational, and economic feasibility analysis in Sections 6 and 10 |
| Objectives and methodology | Explicit objectives and incremental real-system methodology in Sections 8 and 11 |
| Algorithms and techniques | Constraints, views, indexes, EXPLAIN, advanced SQL, procedures, triggers, transactions, federation, schema-aware generation, validation, and auditing in Sections 15–20 |
| Design and implementation synchronization | Architecture, database design, module table, and verified test outcomes connect design to routes, tables, and UI in Sections 12–24 |
| Module implementation and demonstration | Live endpoints, transaction rollback, federated totals, role-restricted audit dashboard, and browser checks listed in Section 24 |
| Report organization | Ordered academic sections, factual status boundaries, diagram plan, test table, limitations, future scope, and references |
| Presentation and communication | Demonstration sequence, diagram and screenshot plan, live evidence, and explicit provider limitation disclosure |
| Team contribution | Evidence-based placeholder table in Section 29 for actual member information |

The mapping identifies evidence relevant to evaluation. It does not assign marks or guarantee a score.
