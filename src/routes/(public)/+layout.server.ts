export const load: import('./$types').LayoutServerLoad = ({ platform, locals, url }) => ({
	signedIn: !!locals.user,
	origin: platform?.env.APP_ORIGIN || url.origin
});
