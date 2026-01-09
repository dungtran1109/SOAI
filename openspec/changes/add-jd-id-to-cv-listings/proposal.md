# Proposal: Persist and expose `jd_id` for CV applications

## Summary
- Persist the matched `JobDescription.id` as `jd_id` on `CVApplication` when a user applies/uploads a CV.
- Expose `jd_id` in all API responses that list CV applications so clients can directly link a CV to its originating `JobDescription`.

## Scope
- Data model: add `cv_applications.jd_id` (nullable FK → `job_descriptions.id`).
- Write path: set `jd_id` on CV creation/update when a match exists.
- Read path: endpoints returning CV lists in the Recruitment service:
  - `get_pending_cvs`
  - `get_approved_cvs`
  - `list_all_cv_applications`
  - `get_cv_application_by_username`
- Response objects in these list endpoints gain a new nullable field: `jd_id` (integer).

## Problem
- Current list responses include `position`, `jd_skills`, and `experience_required` details but do not include the `JobDescription` primary key. Clients must perform an additional lookup (and possibly ambiguous) to resolve the JD.

## Goals
- Provide a stable identifier (`jd_id`) for the matched `JobDescription` in all CV list responses.
- Avoid breaking existing consumers; `jd_id` is additive and nullable during rollout.

## Non-Goals
- Changing the matching algorithm or JD deduplication rules.
- Modifying CV detail endpoints beyond optional inclusion of `jd_id` for parity.

## Approach
1) Persisted FK (primary):
   - Schema change: add nullable `jd_id` FK to `job_descriptions.id` with an index.
   - Client submits `jd_id` on `/cvs/upload` to choose the JD explicitly at apply time.
   - On CV creation, persist `jd_id` and set matched fields from the selected `JobDescription`.
   - Backfill existing rows using a deterministic resolver to ensure consistency.

2) Optional fallback (interim):
   - If legacy rows lack `jd_id`, attempt deterministic resolution; prefer running a backfill job to populate `jd_id`.

3) Migrations and Delivery:
   - Provide an ordered SQL migration runner to execute `.sql` files sequentially.

4) SQL File Migrations:
   - Place migration scripts under `backend/services/recruitment_agent/sql_migrations/` with filenames prefixed for ordering (e.g., `001_add_jd_id.sql`, `002_backfill_jd_id.sql`).
   - A Python-based SQL runner loads files in alphanumeric order and executes each file within a transaction (commit on success, rollback on failure).
   - SQL files MUST be idempotent (use `IF NOT EXISTS`, safe alterations, and backfill guarded by checks) to allow repeat runs.

## Backward Compatibility
- Additive change; existing clients remain unaffected.
- `jd_id` will be populated for new CVs; legacy CVs get `jd_id` via backfill or fallback resolver until backfill completes.

## Risks and Mitigations
- Ambiguity resolving JD without `level` in CV: mitigate by deterministic tie-break (e.g., smallest `id`). Phase 2 removes ambiguity by persisting FK.
- Data backfill complexity: encapsulate resolver in a one-off script and reuse in code path for consistent behavior.

## Alternatives Considered
- Only adding resolver at read time (no schema change): simplest but leaves ambiguity and repeated compute.
- Only adding schema column immediately: requires coordinated migration; Phase 1 offers a safer incremental path.

## Rollout Plan
- Introduce schema migration for `jd_id` (SQL runner on startup).
- Update `/cvs/upload` to accept `jd_id` and persist it (done).
- Expose `jd_id` in CV list endpoints sourced directly from `CVApplication.jd_id` (done).
- Backfill existing CVs using the resolver; retain fallback during backfill window (pending).
