import { redirect } from '@sveltejs/kit';
export const load: import('./$types').LayoutServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/dashboard');
};
