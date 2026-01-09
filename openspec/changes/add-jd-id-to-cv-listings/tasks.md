 - [x] Implement read-time JD resolver (fallback only)
   - Normalize skills from `CVApplication.matched_jd_skills` and query `JobDescription` by `position`, normalized `skills_required`, and `experience_required`.
   - Deterministic tie-break (smallest `id`) when multiple matches exist.
   - (Pending) Unit-test resolver with varied ordering and duplicates.

 - [x] Update list endpoints to include `jd_id`
   - `get_pending_cvs`, `get_approved_cvs`, `list_all_cv_applications`, `get_cv_application_by_username` include `jd_id` per entry.
   - Source `jd_id` directly from `CVApplication.jd_id` (no resolver in responses).
   - (Pending) Add API tests covering presence/absence and correctness of `jd_id`.

 - [x] Add `jd_id` FK to `CVApplication` and persist on apply
  - [x] SQL migration runner: `app/sql_migrate_runner.py` executes ordered `.sql` files under `sql_migrations/`.
  - [x] Startup auto-migration: run SQL migration runner in `app/main.py`.
  - Migration: add nullable `jd_id` with FK and index.
  - [x] Write path: on CV creation/update, use client-provided `jd_id` to set matched fields and persist.
   - [x] Change upload endpoint to accept `jd_id`
     - Update `/cvs/upload` to accept `jd_id` (int) instead of `position_applied_for`.
     - Frontend sends `jd_id` from selected JD; backend Celery task and service use it to persist.
     - [x] Update tests to send `jd_id` in multipart form for `/cvs/upload`.
   - [ ] Backfill: script/job to set `jd_id` for existing rows; validation on sample data.

 - [ ] Documentation & API schema
   - Update recruitment API docs/spec to include `jd_id` in CV list schemas and write-path behavior.
   - Add changelog entry.

 - [ ] Observability
   - Add logs around resolver path vs stored FK usage; metric for unresolved mappings.

 - [x] SQL migration runner
   - [x] Create `backend/services/recruitment_agent/sql_migrations/` and add ordered `.sql` files (seeded `001_add_jd_id.sql`).
   - [x] Implement Python runner `app/sql_migrate_runner.py` to execute `.sql` files alphabetically with transactional safety and idempotent error handling.
   - [x] Wire runner into startup in `app/main.py`.
   - [ ] Add usage docs in service README.

 - [ ] Backfill job & validation
   - Implement backfill script/job to set `jd_id` for legacy rows using deterministic resolver.
   - Validate on sample data; add metrics/logging.
