-- Optional LOCAL ONLY sample listings. These are fictional, not live vacancies.
INSERT INTO jobs(id,title,company,location,workplace,employment_type,salary,description,requirements,application_url,tags) VALUES
('demo-product-engineer','Product Engineer','Forma Studio','United States','Remote','Full-time','$130,000–$165,000 / year','DEMO LISTING — not an actual vacancy.

Help a small product team build thoughtful tools for everyday work. You will own features from early conversation through delivery, partnering closely with design and engineering.

Build accessible interfaces, develop reliable APIs, and make the product faster and easier to use.','Strong TypeScript and React experience.
A thoughtful approach to accessible product design.
Experience shipping and maintaining production software.','https://example.com/careers/product-engineer','["TypeScript","React","Product"]'),
('demo-data-analyst','Data Analyst','Northstar Labs','Denver, CO','Hybrid','Full-time','$85,000–$110,000 / year','DEMO LISTING — not an actual vacancy.

Turn complex data into clear decisions. Work with our operations and product teams to define metrics, build dependable reporting, and investigate opportunities for improvement.','Comfortable with SQL and Python.
Clear written communication.
Experience with business intelligence tools.','https://example.com/careers/data-analyst','["SQL","Python","Analytics"]'),
('demo-frontend','Senior Frontend Developer','Meridian','United States','Remote','Full-time','$140,000–$175,000 / year','DEMO LISTING — not an actual vacancy.

Build the next version of our customer experience. Bring clarity to complex workflows, improve performance, and help our team maintain a coherent design system.','Five or more years building web applications.
Experience with React or Svelte.
Understanding of browser performance and accessibility.','https://example.com/careers/frontend','["Svelte","Accessibility","Design systems"]'),
('demo-platform','Platform Engineer','Common Ground','Austin, TX','Hybrid','Full-time','$125,000–$160,000 / year','DEMO LISTING — not an actual vacancy.

Help engineers move confidently from idea to production. Own infrastructure tooling, strengthen observability, and make deployment a dependable part of the day.','Experience with cloud infrastructure and CI/CD.
Knowledge of containers and distributed systems.
A pragmatic approach to reliability.','https://example.com/careers/platform','["Cloudflare","CI/CD","Infrastructure"]'),
('demo-qa','QA Automation Engineer','Fieldwork','United States','Remote','Contract','$65–$85 / hour','DEMO LISTING — not an actual vacancy.

Build a practical testing strategy for a growing product. Identify the most important user journeys and create automation that gives the team confidence to ship.','Experience with Playwright or Cypress.
Strong debugging and communication skills.
Ability to prioritize testing by customer impact.','https://example.com/careers/qa','["Playwright","TypeScript","Testing"]')
ON CONFLICT(id) DO NOTHING;
