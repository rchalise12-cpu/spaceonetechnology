import { publicPages } from '$lib/public/content';
export const GET: import('./$types').RequestHandler = ({ platform, url }) => {
	const origin = platform?.env.APP_ORIGIN || url.origin;
	return new Response(
		'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
			['', ...publicPages.map((p) => p.slug)]
				.map((slug) => `<url><loc>${origin}/${slug}</loc></url>`)
				.join('') +
			'</urlset>',
		{ headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
	);
};
