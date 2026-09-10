export const GET: import('./$types').RequestHandler = ({ platform, url }) =>
	new Response(
		`User-agent: *
Allow: /
Disallow: /api/
Disallow: /client/
Disallow: /dashboard
Disallow: /jobs
Disallow: /candidates
Disallow: /admin
Disallow: /team
Disallow: /imports
Disallow: /invitations
Disallow: /inquiries
Disallow: /documents
Disallow: /interviews
Disallow: /settings
Sitemap: ${platform?.env.APP_ORIGIN || url.origin}/sitemap.xml
`,
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
	);
