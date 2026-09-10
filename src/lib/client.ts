export async function api<T = { ok: boolean }>(
	path: string,
	method = 'GET',
	body?: unknown
): Promise<T> {
	const response = await fetch(`/api/${path}`, {
		method,
		headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
		body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body)
	});
	const data = (await response.json()) as T & { message?: string };
	if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
	return data;
}
export function date(value: string | null, timezone = 'America/Denver', time = false) {
	return value
		? new Intl.DateTimeFormat('en-US', {
				month: 'short',
				day: 'numeric',
				...(time ? { hour: 'numeric', minute: '2-digit', timeZone: timezone } : { timeZone: 'UTC' })
			}).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value))
		: '—';
}
export function initials(name: string) {
	return name
		.split(/\s+/)
		.slice(0, 2)
		.map((p) => p[0])
		.join('')
		.toUpperCase();
}
export function tags(value: string): string[] {
	try {
		return JSON.parse(value);
	} catch {
		return [];
	}
}
export function fileSize(size: number) {
	return size >= 1048576 ? `${(size / 1048576).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`;
}
export function downloadText(name: string, text: string, type = 'text/plain') {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
