import { redirect } from '@sveltejs/kit';
export const load = ({ params, url }: import('./$types').PageServerLoadEvent) =>
	redirect(308, '/dashboard' + (params.rest ? '/' + params.rest : '') + url.search);
