import { candidateRows } from '$lib/server/operations';
export const load: import('./$types').PageServerLoad = async (event) => ({
	candidates: await candidateRows(event)
});
