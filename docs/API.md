# API reference

Same-origin JSON API under `/api`. All mutations require an `Origin` header matching the request origin. Browser clients use the HttpOnly `space_session` cookie. JSON requests use `Content-Type: application/json`; uploads use multipart `FormData`. Errors return `{ "message": "…" }` with 400/401/403/404/409/410/413/429 as appropriate. Unexpected errors return a request ID. Never put session credentials in URLs.

`C` means signed-in users accessing their own data. `S` means staff or admin. `A` means admin only. `P` means public.

## Account access

| Method | Endpoint                   | Access | Body / result                                                                 |
| ------ | -------------------------- | ------ | ----------------------------------------------------------------------------- |
| POST   | `/auth/signup`             | P      | `name,email,phone,password,timezone?`; returns one-time `recovery_key`        |
| POST   | `/auth/login`              | P      | `email,password`; sets session cookie                                         |
| POST   | `/auth/logout`             | C      | Clears current session                                                        |
| GET    | `/auth/invitation?token=…` | P      | Valid invitation email, role, expiry                                          |
| POST   | `/auth/accept-invite`      | P      | `token,name,email,phone,password,timezone?`; creates invited role and session |
| POST   | `/auth/forgot-password`    | P      | `email`; generic response regardless of account existence                     |
| POST   | `/auth/reset-password`     | P      | `token,password`; one-time reset and session revocation                       |
| POST   | `/auth/recover`            | P      | `email,recovery_key,password`; rotates backup key and revokes sessions        |
| POST   | `/auth/password`           | C      | `current_password,password`; signs out other sessions                         |
| POST   | `/auth/recovery-key`       | C      | `password`; rotates backup recovery key                                       |
| GET    | `/me`                      | C      | Current public user/profile fields                                            |
| PATCH  | `/me`                      | C      | `name,timezone`; optional `phone,headline,location,bio,skills` (string array) |

Passwords require 12–128 characters. Roles and account status cannot be changed through signup or profile updates. Public signup creates clients only. Invitation and reset secrets are stored as hashes.

## Jobs and applications

| Method     | Endpoint                 | Access      | Behavior                                                                                 |
| ---------- | ------------------------ | ----------- | ---------------------------------------------------------------------------------------- |
| GET        | `/jobs`                  | C           | Jobs visible to current user, own status, interview summary, aggregate application count |
| GET        | `/jobs/{id}`             | C           | Job, application, files, history, interviews, comments, tasks, resume library            |
| PATCH      | `/jobs/{id}/application` | C           | `version` required; optional `status,saved,follow_up,applied_at`                         |
| POST       | `/jobs/{id}/notes`       | C           | `body`; adds activity note                                                               |
| GET / POST | `/jobs/{id}/comments`    | C           | Read discussion / add `{body}`                                                           |
| DELETE     | `/comments/{id}`         | Author or S | Remove own comment; staff may moderate                                                   |
| POST       | `/jobs/{id}/files`       | C           | Multipart `file`, `kind=resume                                                           | proof` |
| POST       | `/jobs/{id}/resume`      | C           | `{file_id}` copies a profile PDF into immutable job resume history                       |
| POST       | `/jobs/{id}/interviews`  | C           | Interview payload below                                                                  |

Staff/admin can add `?candidate={clientId}` to a job, application, note, comment, upload, resume-copy, interview-create, task, or profile-library request. The server validates that the subject is a client and requires operator access. Clients cannot select another user. Operators may read/update candidate interview and file resources by ID; clients remain restricted to their own records.

Statuses: `to_apply`, `saved`, `applied`, `processing`, `interview`, `offer`, `rejected`, `withdrawn`. `saved` boolean is an independent bookmark. Version conflicts return 409; refresh before retrying. `follow_up` is an ISO calendar date or null; `applied_at` is a UTC ISO timestamp or null. Moving to an applied/processing/interview/offer/rejected state records an applied date if absent, unless explicitly supplied.

## Documents, interviews, tasks

| Method         | Endpoint                    | Access     | Behavior                                         |
| -------------- | --------------------------- | ---------- | ------------------------------------------------ |
| GET            | `/files`                    | C          | Own application document metadata                |
| GET / DELETE   | `/files/{id}`               | Owner or S | Private download / remove R2 object and metadata |
| GET / POST     | `/profile-files`            | C          | Resume library / multipart PDF upload            |
| GET / DELETE   | `/profile-files/{id}`       | Owner or S | Download / delete library PDF                    |
| GET            | `/interviews`               | C          | Own interview agenda with job context            |
| PATCH / DELETE | `/interviews/{id}`          | Owner or S | Update / remove interview                        |
| GET            | `/interviews/{id}/calendar` | Owner or S | Download `.ics` event with reminder              |
| GET / POST     | `/tasks`                    | C          | List tasks / create `{title,job_id?,due_date?}`  |
| PATCH / DELETE | `/tasks/{id}`               | C          | Update `{done?,title?,due_date?}` / remove       |

Interview payload: `title,starts_at,ends_at,timezone,state,location,notes`. Dates are UTC ISO timestamps; end must be after start. State is `scheduled`, `completed`, or `cancelled`. Multiple rounds are supported.

Files: PDFs for resumes; PNG/JPEG/WebP for proof. Up to 10 MB/file, 50 files/application, 30 profile PDFs/user. Downloads return attachment disposition and `private, no-store`; storage keys are never public URLs. A `/api/files/{id}` or `/api/profile-files/{id}` link is the authenticated PDF URL for later reference.

## Operations

| Method     | Endpoint             | Access | Behavior                                                                                              |
| ---------- | -------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| GET        | `/dashboard`         | C      | Role-appropriate overview                                                                             |
| GET        | `/candidates`        | S      | Candidate profiles and aggregate operational metrics                                                  |
| GET        | `/candidates/{id}`   | S      | Profile, applications, assigned jobs, interviews, tasks, resume library                               |
| GET / POST | `/invitations`       | S      | History / invite `{email,role:"client"}`; admin can choose `staff`                                    |
| POST       | `/invitations/{id}`  | S      | Resend with a rotated token and new expiry                                                            |
| DELETE     | `/invitations/{id}`  | S      | Revoke unaccepted invitation; staff cannot manage staff invitations                                   |
| GET        | `/team`              | A      | Users plus recent administrative activity                                                             |
| PATCH      | `/team/{id}`         | A      | `{role,account_status}`; cannot edit self or remove last active admin; revokes sessions               |
| GET        | `/admin/overview`    | S      | Jobs, client identities, assignments, application progress                                            |
| POST       | `/admin/jobs`        | S      | Create/update standardized job by stable ID                                                           |
| POST       | `/admin/assignments` | S      | `{job_id,user_ids}` replaces that job’s assignment list                                               |
| POST       | `/admin/import`      | S      | `{jobs:[standardized jobs]}`; strict validation, atomic updates, preserves application records        |
| GET        | `/imports`           | S      | Recent import batches                                                                                 |
| POST       | `/imports/preview`   | S      | `{text,mapping?}` normalizes without writing                                                          |
| POST       | `/imports/commit`    | S      | `{text,name?,mapping?}` re-normalizes on server and inserts atomically; skips existing IDs/identities |
| GET        | `/inquiries`         | S      | Public inquiry queue                                                                                  |
| PATCH      | `/inquiries/{id}`    | S      | `{status:"new"                                                                                        | "in_progress" | "closed"}` |
| POST       | `/contact`           | P      | `name,email,company?,interest,message,website?`; rate-limited, honeypot field                         |

Standard job fields: optional `id`, required `title,company,location,description,application_url`, optional `workplace,employment_type,salary,requirements,tags,visibility,active,deadline`. Tags are an array. Workplace: Remote/Hybrid/On-site/Not specified. Employment: Full-time/Part-time/Contract/Internship/Not specified. Visibility: all/assigned. Job editing retains scraper metadata and marks the edited record reviewed. Check publication only after verifying the content.

Scraped import input: JSON array, `{jobs:[…]}`, common `results/items/data` wrappers, JSONL, or complete objects recovered from a pasted array fragment. Map custom paths with, for example, `mapping:{title:"position.name",application_url:"links.apply"}`. Maximum 100 jobs and 2 MB request body. HTML is reduced to text; unsafe schemes/credentials are rejected; source identifiers and canonical application URLs establish identity. Unknown fields remain in bounded source metadata. Mixed search grids and missing required information are held, not published.

The import confirmation never trusts client-supplied normalized records: it processes the original input again. Duplicate imports do not overwrite editorial corrections. Use the job editor or standardized update API for intentional changes. JSON normalizers cannot infer every future scraper layout reliably; unmapped or ambiguous records require staff review.

The current board fetches the visible catalog and paginates rendered rows. API consumers can sort/filter the returned normalized fields. Candidate rankings similarly operate over returned aggregate records. Import history, invitations, inquiry queues, and audit feeds return bounded recent records (100/500/1000/100 respectively); these are operational views, not archival exports.
