# Space One Technology — website & client operations

A complete public website and authenticated candidate workspace, built with **SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS 4, Drizzle ORM, Cloudflare D1, and private R2 storage**. One Cloudflare Worker serves the pages and JSON APIs. There is no separate application server.

The default production origin is **https://clients.spaceonetechnology.com**. Its `/` route is the public landing page, `/client/*` contains account access, and every successful login opens `/dashboard`. Change `APP_ORIGIN` if you choose another hostname. Original Space One photos and video retain their original URLs.

## What is included

- Admin, staff, and client roles enforced on the server. Clients see their own applications and available jobs; staff support candidates and manage jobs; administrators also manage staff and account access.
- Signup, login, logout, email password reset, single-use recovery keys, password changes, and expiring sessions. Invitation onboarding collects name, email, password, and phone.
- Client and staff invitations by email, resend, revocation, expiry, delivery status, and local development preview links. Only administrators can invite staff.
- Role-aware dashboard, candidate search and rankings, candidate detail pages, submission/interview/offer counts, overdue tasks, recent application activity, and CSV export.
- Job search and status/workplace/interview filters; sorting by added or posted date, application count, application status, interview date/state, follow-up, deadline, and company.
- Full job pages with employer links, requirements, source information, application status, dates, shared comments, activity notes, next-step tasks, interview rounds, and calendar export.
- PDF resume library, per-job resume copies/version history, application proof screenshots, private downloads, and deletion. A job copy survives removal of its source resume.
- Manual job editor, publication controls, individual assignments, standardized JSON updates, and a separate scraped-job import/review workflow.
- JSON, JSONL, common wrappers, aliases, dot-path mapping, and recovery of complete records from pasted fragments. HTML sanitization, safe links, stable identity, duplicate skipping, source metadata, quality warnings, and held listings.
- Functional public contact form with a staff inquiry queue, status tracking, and spam throttling.
- Rewritten public home, company, nine services, careers, candidate preparation guide, engagement models, nine product concepts, nine articles, privacy, terms, and image credits. Legacy URLs redirect to their replacements.
- Shared design tokens, Tailwind utilities, responsive layouts, local fonts, keyboard-accessible dialogs, loading/error/empty states, CSP, origin checks, and private file authorization.

See [pages and routes](docs/PAGES.md), [API reference](docs/API.md), and [operations](docs/OPERATIONS.md).

## Local development

Use Node **22.12+** and npm. The committed npm lockfile is the tested installation path.

```sh
npm ci
cp .dev.vars.example .dev.vars
npm run types
npm run db:local
npm run dev
```

Vite prints its development URL. Set `APP_ORIGIN` in `.dev.vars` to that exact origin if testing invitation links. For the production Worker runtime:

```sh
npm run check
npm run build
npm run preview
```

Wrangler defaults to `http://localhost:8787`. `.dev.vars.example` uses that origin and `MAIL_MODE=local`; **no real email is sent in that mode**. An authorized inviter receives a preview link. Password-reset responses remain generic and do not reveal reset tokens; the integration tests seed hashed reset fixtures directly into local D1.

Create your account through `/client/signup`, then promote it locally:

```sh
npm run admin -- you@example.com --local
```

The next request picks up the administrator role. Do not use demo credentials in production. `npm run seed:local` is optional fictional job data for local development only.

## Before going live

1. **Cloudflare resources:** `wrangler.jsonc` retains your existing D1 database ID and R2 bucket name. Confirm both resources belong to the deployment account. Keep the R2 bucket private; do not enable public access for candidate documents.
2. **Hostname:** set `APP_ORIGIN` to the exact public HTTPS origin, without a path. Add your chosen custom domain to this Worker in Cloudflare, or add a `routes` entry with `pattern`, `custom_domain: true`, and the appropriate hostname. No route has been activated automatically.
3. **Email sending:** onboard and verify a sending domain in Cloudflare Email Service. Set `EMAIL_FROM` to an address on that verified domain. The Worker uses the native `EMAIL` send binding; no email API key is required. Keep `MAIL_MODE=cloudflare` in production. The account inspected during development had **no sending subdomains configured**, so live invitations and email recovery require this setup.
4. **Registration policy:** `ALLOW_PUBLIC_SIGNUP=true` allows new client accounts. Set it to `false` for invitation-only onboarding. Administrators are never created through public signup.
5. **Migrate D1:** back up an existing production database, then run `npm run db:remote`. Migration 0001 is additive and copies existing `role` values into `access_role`; it does not rebuild or delete the users table. Do not apply schema push against live data.
6. **Deploy:** run `npm run deploy`. Review the resulting Worker URL and attach the custom domain if not already configured. Use a Workers plan that supports the configured CPU limit; password hashing is intentionally expensive.
7. **Bootstrap the first admin:** create your account, then run `npm run admin -- you@example.com --remote`. If registration is invitation-only, temporarily enable signup for this bootstrap and then disable it. Invite staff and clients from `/invitations`.
8. **Verify delivery:** send an invitation to an address you control, accept it, and test email recovery after DNS verification. Local tests do not prove real-world mail delivery.
9. **Publish jobs:** upload source data at `/imports`. Complete held records in `/admin` and enable publication. The two supplied scraper examples are included as test fixtures; they are not automatically published as live vacancies.

### Environment and bindings

| Name                  | Kind                             | Production value                                             |
| --------------------- | -------------------------------- | ------------------------------------------------------------ |
| `DB`                  | D1 binding                       | Existing `space-one-clients` database                        |
| `FILES`               | R2 binding                       | Existing `space-one-tech-client-files` private bucket        |
| `EMAIL`               | Cloudflare Email Service binding | `send_email` binding in Wrangler                             |
| `ASSETS`              | Worker assets binding            | Generated SvelteKit assets                                   |
| `APP_ORIGIN`          | Variable                         | `https://clients.spaceonetechnology.com` or your chosen host |
| `EMAIL_FROM`          | Variable                         | Address on your verified sending domain                      |
| `MAIL_MODE`           | Variable                         | `cloudflare`; `local` is restricted to loopback origins      |
| `ALLOW_PUBLIC_SIGNUP` | Variable                         | `true` or `false`                                            |

No database password, R2 access key, JWT secret, or third-party authentication credential is needed. Never commit `.dev.vars` or Cloudflare account credentials.

### Original media URLs

Photos/video are referenced in `src/lib/public/assets.ts`. Keep the original `spaceonetechnology.com/wp-content/uploads/...` URLs available. Deploying on `clients.spaceonetechnology.com` leaves that media host intact. If you replace the original root website, preserve its `/wp-content/uploads/*` hosting or route those requests to the existing media origin. Do not point those URLs at this Worker without an asset-origin plan.

## Verification

```sh
npm run check
npm test
npm run build
# In a separate terminal:
npm run preview
# Against that local preview:
npm run test:integration
npx wrangler deploy --dry-run
```

For a different local port, use `TEST_BASE_URL=http://localhost:8788 npm run test:integration`. Tests refuse remote hosts. They use isolated test accounts/jobs in local D1/R2 and remove their fixtures. Stop competing build processes while running a built preview; rebuilding temporarily replaces SvelteKit output.

The suite covers schema constraints and upgrade preservation, the supplied scraper fragments, unsafe input and duplicates, client isolation, staff/admin boundaries, invitation lifecycle, private file access, candidate analytics, password reset, contact inquiries, all public sitemap pages, and legacy redirects.

No production migration, remote deployment, live invitation, or DNS change is performed by these local checks. Real email delivery and production load should be validated in your deployment environment.
