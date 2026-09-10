# Pages and navigation

## Public pages

| Route                                       | Purpose                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `/`                                         | Company landing page with original photography/video, services, career entry, and insights |
| `/about`                                    | Company approach                                                                           |
| `/company/team`                             | Team disciplines without unverified employee biographies                                   |
| `/services`                                 | Service directory                                                                          |
| `/services/technology-staffing`             | Staffing and hiring support                                                                |
| `/services/custom-software-app-development` | Software and application development                                                       |
| `/services/crm-erp-solutions`               | CRM/ERP implementation and integration                                                     |
| `/services/quality-assurance`               | Quality engineering                                                                        |
| `/services/workflow-automation`             | Workflow and process automation                                                            |
| `/services/data-analytics`                  | Data engineering, BI, and analytics                                                        |
| `/services/cloud-devops`                    | Cloud and delivery operations                                                              |
| `/services/ai-business-tools`               | Applied AI with evaluation and oversight                                                   |
| `/services/managed-it-support`              | Ongoing technology support                                                                 |
| `/projects` and `/projects/{slug}`          | Nine clearly labeled product concepts                                                      |
| `/insights` and `/insights/{slug}`          | Nine rewritten practical articles                                                          |
| `/careers`                                  | Candidate service and workspace entry                                                      |
| `/resources/candidate-roadmap`              | Ten-step preparation guide                                                                 |
| `/engagements`                              | Project, ongoing support, and talent engagement models                                     |
| `/contact`                                  | Working inquiry form, phone, address, and directions                                       |
| `/privacy`, `/terms`, `/image-credits`      | Information handling, usage expectations, and media provenance                             |
| `/sitemap.xml`, `/robots.txt`               | Public discovery and private-route exclusions                                              |

## Account access

`/client/login`, `/client/signup`, `/client/invite?token=…`, `/client/forgot-password`, `/client/reset-password?token=…`, and `/client/recover` (backup recovery key).

All successful logins go to `/dashboard`. On signup/invitation/reset, the one-time recovery-key screen appears before dashboard entry. `/login`, `/signup`, and `/recover` redirect to their `/client` equivalents. `/client` directs signed-in users to the dashboard. Legacy `/client/jobs`, `/client/jobs/{id}`, `/client/documents`, `/client/interviews`, `/client/settings`, and `/client/dashboard` redirect to the canonical workspace routes.

## Authenticated workspace

| Route                             | Client                                | Staff                                                  | Admin                                          |
| --------------------------------- | ------------------------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| `/dashboard`                      | Own progress and tasks                | Operational overview                                   | Operational overview                           |
| `/jobs`, `/jobs/{id}`             | Available jobs and own application    | All jobs; candidate selector                           | All jobs; candidate selector                   |
| `/interviews`                     | Own interviews                        | Own calendar; candidate interviews via candidate pages | Same                                           |
| `/documents`                      | Own application files                 | Own files; candidate files via candidate/job pages     | Same                                           |
| `/settings`                       | Own profile, resume library, security | Own profile and security                               | Own profile and security                       |
| `/candidates`, `/candidates/{id}` | No                                    | Candidate metrics and records                          | Same                                           |
| `/imports`                        | No                                    | Scraped JSON review and import                         | Same                                           |
| `/admin`                          | No                                    | Job editor, assignments, standardized job updates      | Same                                           |
| `/invitations`                    | No                                    | Invite/manage clients                                  | Invite/manage clients and staff                |
| `/inquiries`                      | No                                    | Public contact queue                                   | Same                                           |
| `/team`                           | No                                    | No                                                     | Roles, suspension, and administrative activity |

Staff open `/jobs/{id}?candidate={userId}` to support a specific candidate. The server validates the candidate and role for every request. File downloads are authorized separately; query parameters cannot bypass ownership.

## Original website route coverage

- `home`, `home-two` → `/`
- `about-us` → `/about`; `our-team`, `author-page` → `/company/team`
- `our-services` → `/services`; the existing custom software service slug remains supported
- `our-projects` and its nine published project slugs → the new project directory/detail pages
- `blog-page` → `/insights`; all nine original article slugs redirect to `/insights/{slug}`
- `contacts` → `/contact`; `prices-page` → `/engagements`
- `job-openings`, `elementor-58374` → `/careers`
- `data-analyst-onboarding-roadmap` → `/resources/candidate-roadmap`
- `spacecalander` → authenticated `/interviews`; `my-account` → `/dashboard`
- `shop`, `cart` → `/services`; `checkout` → `/contact` (no unrelated commerce carried over)
- Six template profile URLs → `/company/team`; no invented staff biographies
- `image-credits` remains a real page

Source content is rewritten rather than copied. Generic testimonials, partner logos, unverified success metrics, placeholder pricing, duplicate homepages, and template shop pages are not represented as real company evidence. Project concepts are explicitly identified as concepts.
