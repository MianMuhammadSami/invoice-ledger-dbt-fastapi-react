# Invoice Ledger — Walking Skeleton

A self-contained vertical slice of an "Invoice Ledger" feature, built with a strict three-layer data pipeline, a read-only versioned API, and a type-safe React frontend. Every boundary is intentional; every side effect is either absent or explicit.

---

## Stack

| Layer      | Technology              | Role                                      |
|------------|-------------------------|-------------------------------------------|
| Data       | dbt + PostgreSQL 16     | Transformation pipeline (seed → mart)     |
| Backend    | FastAPI + Pydantic v2   | Read-only contract layer                  |
| Frontend   | React 18 + TypeScript   | Presentation only                         |
| Infra      | Docker Compose          | Service orchestration                     |
| Migrations | Alembic                 | Schema lifecycle management               |
| Cache      | Redis 7                 | Future-proofed; unused in v1              |

---

## How Data Flows

### Load Flow — `make dbt-run`

```
┌─────────────────────────────────────────────────────────────────────┐
│                        dbt/seeds/                                   │
│                     raw_invoices.csv                                │
│                  (55 mock invoices, flat CSV)                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  dbt seed
                           ▼
              ┌────────────────────────┐
              │  raw.raw_invoices      │  PostgreSQL table
              │  (seeded as-is)        │  created by dbt seed
              └────────────┬───────────┘
                           │  dbt run
                           ▼
              ┌────────────────────────┐
              │  staging.stg_invoices  │  VIEW — type casting only
              │                        │  ::date, lower(), trim()
              │  No business logic.    │  nullif() — nothing else
              └────────────┬───────────┘
                           │  dbt run
                           ▼
              ┌────────────────────────────────────────┐
              │  intermediate.int_invoices_enriched    │  VIEW — all logic here
              │                                        │
              │  is_overdue   → due_date < today       │
              │                  AND status = pending  │
              │  days_past_due → current_date - due    │
              │  days_until_due → due - current_date   │
              │  amount_category → small/medium/large  │
              └────────────┬───────────────────────────┘
                           │  dbt run
                           ▼
              ┌────────────────────────────────────────┐
              │  marts.mart_invoice_ledger             │  TABLE (materialized)
              │                                        │
              │  Stable, indexed, API-facing.          │  Indexes on:
              │  This is the only table FastAPI        │  · invoice_id (unique)
              │  is allowed to touch.                  │  · status
              └────────────────────────────────────────┘  · is_overdue
```

### Read Flow — Browser → API → Database

```
 ┌──────────────────────────────────────────────────────────┐
 │  React (port 5173)                                        │
 │                                                           │
 │  InvoiceLedger          manages state                     │
 │    └── useInvoices()    fetch logic lives here only       │
 │    └── useSummary()     no fetch logic inside components  │
 │                                                           │
 │  TypeScript interface Invoice { ... }                     │
 │  mirrors Pydantic exactly — type errors at compile time   │
 └──────────────────┬───────────────────────────────────────┘
                    │  HTTP GET /v1/invoices?status=overdue
                    │  (browser → localhost:8000)
                    ▼
 ┌──────────────────────────────────────────────────────────┐
 │  FastAPI (port 8000)                                      │
 │                                                           │
 │  GET /v1/invoices        paginate + filter               │
 │  GET /v1/invoices/summary  aggregate counts + amounts    │
 │  GET /v1/invoices/{id}   single record                   │
 │                                                           │
 │  Pydantic InvoiceResponse strips / rejects anything      │
 │  that doesn't match the contract before sending JSON.    │
 │                                                           │
 │  ⚠  Read-only. No INSERT / UPDATE / DELETE anywhere.     │
 └──────────────────┬───────────────────────────────────────┘
                    │  SELECT * FROM marts.mart_invoice_ledger
                    │  (FastAPI never touches raw/staging/intermediate)
                    ▼
 ┌──────────────────────────────────────────────────────────┐
 │  PostgreSQL (port 5432)                                   │
 │                                                           │
 │  marts.mart_invoice_ledger  ← only table API queries     │
 │  intermediate.int_invoices_enriched  (VIEW, dbt only)    │
 │  staging.stg_invoices               (VIEW, dbt only)     │
 │  raw.raw_invoices                   (TABLE, dbt only)    │
 └──────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# 1. Bring up all long-running services
make server-up

# 2. Create the PostgreSQL schemas (one-time migration)
make migrate

# 3. Seed mock data and run all dbt models
make dbt-run

# Frontend:  http://localhost:5173
# API docs:  http://localhost:8000/docs
# API:       http://localhost:8000/v1/invoices
```

> **Order matters.** `migrate` creates the schemas that dbt writes into. `dbt-run` must follow before the frontend has anything to display.

---

## Folder Structure

```
.
├── dbt/                        # Data transformation pipeline
│   ├── seeds/raw_invoices.csv  # Source-of-truth mock data
│   └── models/
│       ├── staging/            # Type casting + normalization only
│       ├── intermediate/       # Business logic (derived fields)
│       └── marts/              # Materialized table — API reads this
├── backend/                    # FastAPI application
│   ├── alembic/                # Schema migrations
│   └── app/
│       ├── schemas/invoice.py  # Pydantic contract models
│       └── routers/v1/         # Versioned route handlers
└── frontend/                   # React + TypeScript application
    └── src/
        ├── types/invoice.ts    # TypeScript mirror of Pydantic models
        ├── hooks/              # Data fetching (useInvoices, useSummary)
        └── components/         # Presentation only — no fetch logic
```

---

## Architectural Decisions

### 1. Why Three-Layer dbt (Staging → Intermediate → Marts)?

Each layer has a single, non-negotiable responsibility:

**Staging** (`stg_invoices`) does exactly one thing: convert raw CSV strings into typed, normalized columns. There is no business logic here — only `::date`, `lower()`, `trim()`, `nullif()`. This makes the raw data contract explicit and testable independently of any business rule.

**Intermediate** (`int_invoices_enriched`) is where all business logic lives. `is_overdue` is computed here (`status = 'pending' AND due_date < current_date`), as are `days_past_due`, `days_until_due`, and `amount_category`. This layer is a view — cheap to recompute, easy to iterate on without touching the API contract.

**Mart** (`mart_invoice_ledger`) is a materialized `TABLE` with explicit indexes on `status`, `vendor_id`, and `is_overdue`. It is the stable, versioned surface that FastAPI reads from. Its schema is the contract. Changing it requires a deliberate decision, not a side effect.

This layering means **the mart is stable even when business rules change** — you update the intermediate model, re-run dbt, and the mart reflects the new logic with zero API or frontend changes (unless the schema itself changes).

### 2. Why PostgreSQL Instead of DuckDB/SQLite?

The task permitted DuckDB or SQLite for local use. I chose PostgreSQL because:

- It supports multiple concurrent connections (FastAPI + dbt running simultaneously without file-lock issues).
- The `FILTER (WHERE ...)` aggregate syntax used in the summary query is a PostgreSQL feature that makes intent explicit.
- Index creation on the mart table is meaningful — PostgreSQL actually uses them.
- It reflects production reality. A skeleton that requires a database swap before shipping has a hidden seam.

### 3. Why Alembic for Schema Creation?

dbt manages tables and views within schemas, but **who creates the schemas themselves?** If dbt runs first and the `raw` schema doesn't exist, it fails silently or errors. Alembic owns the schema lifecycle:

- Migration `001_create_schemas.py` creates `raw`, `staging`, `intermediate`, `marts`, and the `uuid-ossp` extension.
- `alembic upgrade head` is idempotent — `CREATE SCHEMA IF NOT EXISTS` never fails on re-run.
- This separates infrastructure setup (Alembic's job) from data transformation (dbt's job).

### 4. Why is FastAPI Strictly Read-Only?

FastAPI has no write path to any table. It reads only from `marts.mart_invoice_ledger` using parameterized `text()` queries. This design choice ensures:

- **No hidden side effects.** The API cannot accidentally mutate the mart or any upstream table.
- **Clear ownership.** Data shape is dbt's responsibility; serving it is FastAPI's.
- **Auditability.** Every SQL statement in the API layer is a `SELECT`. No INSERT, UPDATE, or DELETE can sneak in.

The CORS policy (`allow_methods=["GET"]`) enforces this at the HTTP level as well.

### 5. Why Pydantic Models as a "Rigid Contract"?

`InvoiceResponse` is not just validation — it is the published interface. Every field is typed, and any field returned by the database but absent from the model is silently dropped. Any field in the model absent from the database raises a validation error at startup (or first request), not silently at the client.

The `model_config = {"from_attributes": True}` setting means SQLAlchemy row mappings serialize without an intermediate dict — the Pydantic model is the single translation layer between PostgreSQL and JSON.

### 6. Why TypeScript Interfaces Mirror Pydantic Models Exactly?

`src/types/invoice.ts` is not auto-generated — it is a deliberate, hand-maintained mirror of `app/schemas/invoice.py`. This means:

- Any backend contract change surfaces as a TypeScript type error at compile time.
- The frontend never does duck-typing on API responses.
- `getDisplayStatus()` lives in the type file because it is a pure function of the `Invoice` type — it is not business logic (which belongs in dbt) and not API logic (which belongs in FastAPI). It is presentation logic derived from the contract.

### 7. How is Idempotency Guaranteed?

| Operation | Idempotency mechanism |
|---|---|
| `make migrate` | `CREATE SCHEMA IF NOT EXISTS` + Alembic's revision tracking |
| `make dbt-run` (seed) | dbt seeds drop-and-recreate by default; adding `--full-refresh` is explicit |
| `make dbt-run` (run) | Mart is `materialized='table'` — dbt drops and recreates atomically |
| `make server-up` | `docker compose up -d` is idempotent; existing containers are reused |

Running `make dbt-run` twice produces the same mart state both times. No row duplication, no schema drift.

### 8. Why Redis in v1 if It's Unused?

Redis is included at the infrastructure level but not wired into FastAPI yet. This is intentional future-proofing: caching the summary endpoint (which aggregates all rows) and rate-limiting the list endpoint are natural next steps. Adding Redis after the fact would require a docker-compose change, a `requirements.txt` update, and a service restart. Including it now means the next engineer touches only application code.

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/invoices` | Paginated invoice list; filter by `status`, search by `search` |
| GET | `/v1/invoices/summary` | Aggregate counts and amounts by status |
| GET | `/v1/invoices/{id}` | Single invoice by ID |
| GET | `/health` | Liveness check |

### Query Parameters (`/v1/invoices`)

| Param | Values | Default |
|-------|--------|---------|
| `status` | `paid` \| `pending` \| `overdue` | (all) |
| `search` | vendor name substring | (none) |
| `page` | integer ≥ 1 | `1` |
| `page_size` | 1–100 | `20` |

> `overdue` is a **derived** status: it matches rows where `is_overdue = true` (pending invoices whose `due_date < current_date`). It is not a raw field in the source data — this distinction is the whole point of the intermediate dbt layer.

---

## Makefile Commands

```bash
make server-up    # Start db, redis, app (FastAPI), frontend
make server-down  # Stop all containers
make migrate      # Run Alembic migrations (creates schemas)
make dbt-run      # dbt seed + dbt run (loads and transforms data)
make logs         # Tail app + frontend logs
make clean        # Tear down containers and volumes (destructive)
```

---

## dbt Data Flow

```
seeds/raw_invoices.csv
        │
        ▼
raw.raw_invoices          ← dbt seed (25 mock invoices)
        │
        ▼
staging.stg_invoices      ← VIEW: type casting only
        │
        ▼
intermediate.int_invoices_enriched  ← VIEW: is_overdue, days_past_due, amount_category
        │
        ▼
marts.mart_invoice_ledger ← TABLE: indexed, stable, API-facing
        │
        ▼
FastAPI /v1/invoices       ← read-only SELECT only
        │
        ▼
React frontend             ← TypeScript interfaces, no business logic
```

---

## Mock Data

25 invoices across 8 vendors (Acme Corp, Globex Inc, Initech LLC, Umbrella Corp, Stark Industries, Wayne Enterprises, Pied Piper Inc, Hooli Corp). Amounts range from \$1,890 to \$98,000. Dates span January–May 2026, producing a realistic mix:

- **9 paid** invoices
- **9 genuinely pending** (due date in the future)
- **7 overdue** (pending status, but `due_date < current_date`)

The overdue classification is entirely computed by dbt — the source CSV has only `paid` and `pending` statuses.
