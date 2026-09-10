import { redirect } from '@sveltejs/kit';
export const load = ({ locals, url }: import('./$types').LayoutServerLoadEvent) => {
	if (locals.user && ['/client/login', '/client/signup'].includes(url.pathname))
		redirect(303, '/dashboard');
};
