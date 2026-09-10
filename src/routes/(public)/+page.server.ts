import { redirect } from '@sveltejs/kit';
export const load: import('./$types').PageServerLoad = ({ url }) => {
	if (url.searchParams.get('post_type') === 'services') {
		const target: Record<string, string> = {
			'40277': '/services/data-analytics',
			'41418': '/services/workflow-automation'
		};
		const href = target[url.searchParams.get('p') || ''];
		if (href) redirect(308, href);
	}
	return {};
};
