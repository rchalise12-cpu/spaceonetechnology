import { documents } from '$lib/server/jobs';
export const load: import('./$types').PageServerLoad = async (event) => ({
	files: await documents(event)
});
