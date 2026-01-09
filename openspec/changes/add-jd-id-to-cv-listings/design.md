# Design: `jd_id` in CV listings

## Context
`CVApplication` currently stores `matched_position`, `matched_jd_skills` (JSON string), and `matched_jd_experience_required` but not a `JobDescription` FK. `JobDescription` dedup relies on (`position`, `skills_required`, `experience_required`, `level`), while `level` is not retained on `CVApplication`.

## Approach
Persisted FK is the primary design. A resolver is optional as a temporary fallback until backfill finishes.

1) Persisted FK (Primary)
- Schema: add `jd_id` (nullable FK) to `cv_applications`; create an index on `jd_id`.
- Write path: client provides `jd_id` on `/cvs/upload`. Persist `jd_id` and set matched fields from the selected `JobDescription`.
- Backfill: run a job/script to set `jd_id` for existing rows using deterministic matching.

## Data Model Changes (Phase 2)
- `cv_applications.jd_id INTEGER NULL REFERENCES job_descriptions(id)`
- Index on `jd_id` for join performance.

## API Changes
- Upload endpoint `/cvs/upload` accepts `jd_id` (int) instead of `position_applied_for`.
- List endpoints include a field `jd_id` in each CV entry sourced directly from `CVApplication.jd_id`.

## Validation
- Unit tests for the write path persisting `jd_id` and for resolver determinism as a fallback.
- API tests ensuring `jd_id` appears and is non-null for newly created CVs.
- Migration test executing backfill on a sample dataset with duplicates across `level`.

## Migration Strategy
- SQL migration runner executes ordered `.sql` files under `sql_migrations/` with transactional safety and idempotency.
- Service startup runs the SQL migration runner, followed by `create_all()` as a safety net.
- Idempotent custom Python migration helpers remain available for emergency remediation.

### SQL Migration Runner (Optional)
- Directory: `backend/services/recruitment_agent/sql_migrations/`.
- Ordering: filenames sorted alphanumerically (e.g., `001_*.sql`, `002_*.sql`).
- Execution: a Python runner iterates files in order, begins a transaction, executes file contents, and commits; on error, rolls back and stops.
- Idempotency: each SQL script must be safe to re-run (use guards like `IF NOT EXISTS`, check constraints, conditional backfills).
- Observability: log applied filenames and duration; optionally record an applied log table (e.g., `schema_migrations`) to avoid re-applying.

### Backfill and Observability
- Implement a backfill job to populate `jd_id` for legacy rows using the deterministic resolver.
- Log resolver vs persisted FK usage and measure unresolved cases for monitoring.
