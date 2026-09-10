export const load: import('./$types').PageServerLoad = ({ url }) => ({
	token: url.searchParams.get('token') || ''
});
