import { profileFileRows } from '$lib/server/workspace';
export const load: import('./$types').PageServerLoad = async (event) => ({
	files: await profileFileRows(event)
});
