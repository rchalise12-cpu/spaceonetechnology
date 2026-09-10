import { error, redirect } from '@sveltejs/kit';
import { publicPages, legacyRoutes } from '$lib/public/content';
export const load: import('./$types').PageServerLoad = ({ params }) => {
	const slug = params.slug.replace(/\/$/, '');
	if (legacyRoutes[slug]) redirect(308, legacyRoutes[slug]);
	const content = publicPages.find((p) => p.slug === slug);
	if (!content) error(404, 'This page could not be found.');
	return { content };
};
