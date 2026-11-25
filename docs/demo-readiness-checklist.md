# Demo Readiness Checklist

Use this internal checklist before the Advanced DBMS demonstration. It documents completed capabilities; it does not add application behavior.

## Startup and access

- [ ] Run `nvm use` from the repository root and confirm Node `20.20.2`.
- [ ] Start MySQL, then the backend and frontend.
- [ ] Sign in as an authorized user through `/login`.
- [ ] Confirm a protected route redirects to login after logout.

## Recommended evidence

- [ ] Show the live healthcare schema and row counts with `/api/db/schema-status`.
- [ ] Show views, indexes, and query plan evidence with `/api/db/views`, `/api/db/indexes`, and `/api/db/explain`.
- [ ] Show the patient medical-summary procedure and explain its live result.
- [ ] Demonstrate the transaction endpoint's rollback response using an invalid billing amount; explain that no partial records persist.
- [ ] Show the billing trigger and its separate `audit_logs` entries.
- [ ] Show federated Hospital A/B totals from `/api/db/federated/summary`.

## AI and safety evidence

- [ ] Explain: authenticated question → live schema metadata → Gemini → SQL validator → read-only executor → MySQL result → visualization → AI audit.
- [ ] Use only a real Gemini attempt. If its provider is unavailable, show the safe unavailable state and the matching `GEMINI_UNAVAILABLE` audit entry; do not invent SQL or results.
- [ ] Show a controlled safe read-only query through the existing SQL-execution endpoint and real MySQL result.
- [ ] Show that a destructive statement is rejected before execution.
- [ ] Explain the 500-row result limit, five-second timeout, one-statement/read-only policy, and secret handling.

## Role and UI evidence

- [ ] Show the dashboard's query UI, table/visualization behavior, and session-only recent-query behavior.
- [ ] As ADMIN, show `/admin/audit` with query, SQL when available, status, row count, and duration.
- [ ] Explain that `ai_query_audit_logs` is distinct from trigger-owned `audit_logs`.
- [ ] As DOCTOR or STAFF, show that the audit navigation is absent and the audit endpoint/route is denied.

## Closing checks

- [ ] Confirm `npm run build` succeeds before the demo.
- [ ] Confirm the three local databases remain distinct: `healthcare_ai_db`, `hospital_a_db`, and `hospital_b_db`.
- [ ] Do not reveal environment files, passwords, JWTs, or Gemini API keys during the demonstration.
