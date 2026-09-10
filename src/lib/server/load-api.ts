import { error, type RequestEvent } from '@sveltejs/kit';
export async function loadApi<T>(event: RequestEvent, path: string): Promise<T> {
	const r = await event.fetch(`/api/${path}`);
	if (!r.ok) error(r.status, ((await r.json()) as { message: string }).message);
	return r.json() as Promise<T>;
}
