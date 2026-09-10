# Operations and security

## Access model

`users.access_role` is the canonical role: admin, staff, or client. The legacy `users.role` column remains for migration compatibility; code never uses it to authorize requests. Migration 0001 backfills current admins without rebuilding users or cascading away their data. The promotion script updates both columns. Migration 0002 adds indexes for candidate access and per-job submission counts.

Public signup creates clients only. Clients see published `all` jobs, their individual assignments, and jobs they already track. Closing a listing or removing an assignment does not remove a candidate’s existing history. Staff/admin can view all jobs and support all candidates, including documents and comments. Admins alone manage staff invitations and account roles/status. No user can change their own role/status; the final active administrator is protected at the database-update boundary.

Suspension prevents login and session use. Role changes revoke sessions. Application writes use optimistic versions so stale tabs cannot silently overwrite status changes. Staff choose a candidate explicitly on a job page. Shared comments display their author; activity notes are part of the candidate record and should not be treated as confidential from authorized staff.

## Authentication and email

Passwords use salted scrypt (`N=16384,r=8,p=5`, 16 MiB memory). Random 256-bit session, recovery, invitation, and password reset tokens are stored as SHA-256 hashes. Sessions last 14 days; invitation links 7 days; email reset links 1 hour. Invitation acceptance and reset consumption use conditional D1 batches to prevent replay. Password changes/recovery revoke existing sessions and pending password-reset links.

Cookies are HttpOnly, SameSite=Lax, and Secure on HTTPS. Mutations require an exact matching Origin. CSP, no framing, `nosniff`, and private caching apply. D1-backed atomic rate limits cover authentication, account emails, mutations, uploads, and public contact submissions. Public signup does not independently verify inbox ownership; use invitation-only onboarding for a controlled client roster.

Cloudflare Email Service sends HTML and text invitations/reset emails through `env.EMAIL`. Only the configured trusted `APP_ORIGIN` is used to form links; request-host input is not used. `MAIL_MODE=local` is accepted only for loopback origins and returns invitation preview URLs only to authorized inviters. Password reset always uses a generic response. Failed invitation delivery is recorded and shown for resend; no plaintext token is stored or logged.

Before launch, configure a verified sending domain, `EMAIL_FROM`, and the send binding. The development account had no sending subdomains configured. Native binding support and domain setup are documented at https://developers.cloudflare.com/email-service/api/send-emails/workers-api/ and https://developers.cloudflare.com/email-service/configuration/send-bindings/.

## Files and retention

Keep R2 private. Downloads require the file owner or an authorized operator and use attachment disposition. PDFs, PNG, JPEG, and WebP are checked by type signature and size; uploads are not malware-scanned. HTML/SVG are not accepted, and uploaded files are not embedded as active pages on the application origin.

Profile PDFs and per-job files use different random object keys. Copying a profile resume creates an independent job version. Deletion removes R2 first, then D1; a retry can finish metadata cleanup. Uploads compensate by deleting R2 objects if metadata insertion fails. A process termination between services can still leave an orphan; reconcile storage and metadata before removing old orphan objects.

Define retention and account closure procedures for your operation. An account purge must handle all related R2 keys plus D1 records, including invitations, comments, tasks, and audit references. SQL cascades cannot delete R2 objects. The UI suspends accounts instead of offering an unsafe one-click purge.

## Imported jobs

Scraped payloads are untrusted data. They are never evaluated, rendered as HTML, or fetched by the server. Parsing accepts recognized shapes and custom field mappings, strips markup, validates URL schemes, records provenance, and flags incomplete/ambiguous records. The supplied Greenhouse samples contain multiple search cards; they are held so one employer’s salary/description is not published on another employer’s role.

Import confirmation repeats normalization server-side. D1 inserts run in a batch; unique source identity/ID constraints skip duplicates and protect prior editorial work. Imported source metadata is retained up to a bounded size; oversized raw payloads retain a truncation marker and source ID. A job editor save preserves source metadata and marks the record reviewed. Staff must verify the original employer listing before enabling publication.

Relative posting dates are estimates against supplied scrape time, or import time when missing. The warning is retained. Currency and workplace remain unspecified when the source is not clear. Salary display text remains available even when structured values cannot be determined confidently.

## Maintenance and deployment

- Keep D1 backups and test restoration. R2 objects need their own retention/backup plan.
- Expired sessions/rate limits are cleaned on successful login. Periodically purge expired reset tokens and stale invitations according to your retention policy.
- Error logs include a request ID and error type, never credentials, recovery tokens, or document contents. Monitor failed mail events and Worker errors.
- Use the tested lockfile and review transitive dependency overrides when upgrading. Tailwind is integrated through its Vite plugin; old bespoke styles live in the components layer so utilities can override them.
- The configured CPU allowance accommodates scrypt. Local integration tests establish behavior, not production capacity. Measure load and set account-appropriate usage alerts.
- The current job board/candidate ranking loads the available catalog and aggregates for in-browser filtering. For deployments with very large catalogs, size the workload and introduce cursor-based server search before enabling unrestricted bulk ingestion. Imports themselves are bounded to 100 records/request.
- The original media URLs are deliberately retained. Keep their host and upload paths available. The application has no dependency on the old WordPress APIs at runtime.
- Contact inquiries are stored in D1 and read from `/inquiries`; no public inquiry email notification is configured. Interview reminders are included in downloaded calendar events, not sent as email/SMS notifications.

No remote migration, deployment, DNS edit, or live email was performed during local validation. Run the deployment steps in README after configuring the production account.
