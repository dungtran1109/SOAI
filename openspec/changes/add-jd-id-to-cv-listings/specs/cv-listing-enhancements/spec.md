## ADDED Requirements

### Requirement: Upload uses `jd_id`
The `/cvs/upload` endpoint MUST accept a `jd_id` chosen by the client and persist it on `CVApplication`. The pipeline MUST use `jd_id` to fetch the selected `JobDescription` rather than requiring `position_applied_for`.

#### Scenario: Upload CV with `jd_id`
- Given a user selects a `JobDescription` and uploads a CV
- When the client posts `/cvs/upload` with `jd_id`
- Then the service persists `cv_applications.jd_id = jd_id` and sets matched fields from that `JobDescription`

### Requirement: Persist `jd_id` on CV creation
When a user applies/uploads a CV and a JD match is determined, the system MUST persist the matched `JobDescription.id` as `jd_id` on the `CVApplication` record.

#### Scenario: Persist `jd_id` during CV apply
- Given a CV is uploaded/applied and matched to a JD
- When the CV application is saved
- Then `cv_applications.jd_id` is set to the matching `job_descriptions.id`
- And subsequent reads return this `jd_id`

### Requirement: CV list responses include `jd_id`
All API endpoints that return lists of CV applications MUST include a field `jd_id` (nullable integer) identifying the matched `JobDescription` persisted on the CV.

#### Scenario: Pending CVs listing returns `jd_id`
- Given CVs with stored matched JD details
- When the client calls the pending CVs list endpoint
- Then each CV entry includes `jd_id` referencing `job_descriptions.id`, or `null` for legacy/unmatched entries

#### Scenario: Approved CVs listing returns `jd_id`
- Given CVs approved after pipeline processing
- When the client calls the approved CVs list endpoint
- Then each CV entry includes `jd_id` referencing `job_descriptions.id`, or `null` for legacy/unmatched entries

#### Scenario: All CV applications listing returns `jd_id`
- Given multiple CV applications across positions
- When the client lists all CV applications
- Then each CV entry includes `jd_id` referencing `job_descriptions.id`, or `null` for legacy/unmatched entries

#### Scenario: CVs by username listing returns `jd_id`
- Given CVs associated with a username
- When the client lists CV applications by username
- Then each CV entry includes `jd_id` referencing `job_descriptions.id`, or `null` for legacy/unmatched entries

### Requirement: Deterministic `jd_id` resolution (fallback)
The service MAY resolve `jd_id` deterministically for legacy rows lacking `jd_id` (e.g., during backfill). List endpoints SHOULD source `jd_id` directly from `CVApplication`.

#### Scenario: Resolver normalizes skill order
- Given `matched_jd_skills` where skills order differs from `JobDescription.skills_required`
- When resolving `jd_id`
- Then skills are normalized (sorted) and matched successfully

#### Scenario: Resolver tie-break on duplicates
- Given multiple `JobDescription` rows matching position/skills/experience
- When resolving `jd_id`
- Then the smallest `job_descriptions.id` is chosen

## MODIFIED Requirements

### Requirement: API schema for CV lists
CV list response schema includes `jd_id` (nullable integer) sourced from `CVApplication.jd_id`. Existing fields remain unchanged. The `position_applied_for` input is removed in favor of `jd_id`.
