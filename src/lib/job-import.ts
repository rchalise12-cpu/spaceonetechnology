/** Scraped input is untrusted data. Nothing here evaluates code or fetches remote URLs. */
export type RawJob = Record<string, unknown>;
export type FieldMapping = Partial<
	Record<
		'title' | 'company' | 'location' | 'description' | 'application_url' | 'salary' | 'posted_at',
		string
	>
>;
export interface NormalizedJob {
	id: string;
	title: string;
	company: string;
	location: string;
	workplace: string;
	employment_type: string;
	salary: string;
	description: string;
	requirements: string;
	application_url: string;
	tags: string[];
	visibility: 'all' | 'assigned';
	active: boolean;
	deadline: string | null;
	source: string;
	source_id: string | null;
	source_url: string;
	dedupe_key: string;
	posted_at: string | null;
	scraped_at: string;
	source_posted_text: string;
	company_description: string;
	department: string;
	experience_level: string;
	country: string;
	salary_min: number | null;
	salary_max: number | null;
	salary_currency: string;
	salary_period: string;
	hiring_team: string;
	quality_state: 'ready' | 'needs_review';
	quality_warnings: string[];
	raw_payload: string;
}
const entities: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	ndash: '–',
	mdash: '—',
	rsquo: '’',
	lsquo: '‘',
	ldquo: '“',
	rdquo: '”',
	bull: '•'
};
export function cleanText(value: unknown, max = 30000): string {
	if (typeof value !== 'string' && typeof value !== 'number') return '';
	return String(value)
		.replace(/<(script|style|iframe|object)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
		.replace(/<\/(?:p|div|li|h[1-6])\s*>|<br\s*\/?>/gi, '\n')
		.replace(/<[^>]*>/g, '')
		.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (_, key: string) => {
			if (key[0] === '#') {
				const n = key[1] === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
				return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
			}
			return entities[key] ?? `&${key};`;
		})
		.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
		.replace(/[ \t]+/g, ' ')
		.replace(/\n[ \t]+/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim()
		.slice(0, max);
}
function object(value: unknown): RawJob | undefined {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as RawJob)
		: undefined;
}
function at(row: RawJob, key: string): unknown {
	return key.split('.').reduce<unknown>((v, k) => object(v)?.[k], row);
}
function first(row: RawJob, ...keys: string[]): unknown {
	for (const k of keys) {
		const v = at(row, k);
		if (v !== undefined && v !== null && v !== '' && (typeof v !== 'object' || Array.isArray(v)))
			return v;
	}
	return '';
}
export function parseJobInput(input: string): { rows: RawJob[]; warnings: string[] } {
	const text = input.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
	const unpack = (value: unknown): unknown => {
		if (Array.isArray(value)) return value;
		const o = object(value);
		if (!o) return value;
		for (const key of [
			'jobs',
			'results',
			'items',
			'jobPostings',
			'data.jobs',
			'data.results',
			'data'
		]) {
			const v = at(o, key);
			if (Array.isArray(v)) return v;
		}
		return [o];
	};
	try {
		const values = unpack(JSON.parse(text));
		if (!Array.isArray(values) || !values.every(object)) throw new Error('Expected job records.');
		return { rows: values, warnings: [] };
	} catch {
		/* Try JSON Lines and complete objects in a pasted array fragment. */
	}
	const lines = text.split('\n').filter((l) => l.trim());
	try {
		const rows = lines.map((l) => JSON.parse(l));
		if (rows.every(object)) return { rows, warnings: ['JSON Lines input detected.'] };
	} catch {
		/* Continue. */
	}
	if (!/^(?:\{\s*)?"(?:jobs|results|items)"\s*:\s*\[|^\[/.test(text))
		throw new Error('Upload JSON, JSON Lines, an array, or a pasted "jobs": [...] fragment.');
	const body = text.slice(text.indexOf('[') + 1);
	let depth = 0,
		start = -1,
		inString = false,
		escaped = false;
	const rows: RawJob[] = [];
	for (let i = 0; i < body.length; i++) {
		const ch = body[i];
		if (inString) {
			if (escaped) escaped = false;
			else if (ch === '\\') escaped = true;
			else if (ch === '"') inString = false;
			continue;
		}
		if (ch === '"') {
			inString = true;
			continue;
		}
		if (ch === '{') {
			if (depth === 0) start = i;
			depth++;
		}
		if (ch === '}') {
			depth--;
			if (depth === 0 && start >= 0) {
				try {
					const row = JSON.parse(body.slice(start, i + 1));
					if (object(row)) rows.push(row);
				} catch {
					throw new Error('One job object contains invalid JSON. Fix it before importing.');
				}
				start = -1;
			}
		}
	}
	if (!rows.length) throw new Error('No complete job objects were found.');
	return {
		rows,
		warnings: [
			'Recovered complete records from a pasted JSON fragment.',
			...(depth > 0 ? ['The final incomplete record was excluded.'] : [])
		]
	};
}
export function canonicalUrl(value: unknown): string {
	if (typeof value !== 'string' || value.length > 2000) return '';
	try {
		const u = new URL(value);
		if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password) return '';
		u.hash = '';
		for (const key of [...u.searchParams.keys()])
			if (
				/^(utm_|trk|tracking|source$|ref$|country_short_name$|date_posted$|lat$|lon$|location$|location_type$|query$|work_type)/i.test(
					key
				)
			)
				u.searchParams.delete(key);
		u.searchParams.sort();
		return u.toString();
	} catch {
		return '';
	}
}
async function hash(value: string) {
	return Array.from(
		new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))),
		(b) => b.toString(16).padStart(2, '0')
	).join('');
}
export function parsePosted(value: unknown, reference: string): string | null {
	const s = cleanText(value, 100);
	if (!s) return null;
	const relative = s.match(/(\d+)\s*(minute|hour|day|week|month)s?\s*ago/i);
	if (relative) {
		const units: Record<string, number> = {
			minute: 60000,
			hour: 3600000,
			day: 86400000,
			week: 604800000,
			month: 2592000000
		};
		return new Date(
			new Date(reference).getTime() - Number(relative[1]) * units[relative[2].toLowerCase()]
		).toISOString();
	}
	if (/just now|today/i.test(s)) return reference;
	if (!/^\d{4}-\d\d-\d\d/.test(s)) return null;
	const d = new Date(s);
	return Number.isNaN(d.valueOf()) ? null : d.toISOString();
}
export async function normalizeJob(
	row: RawJob,
	mapping: FieldMapping = {},
	reference = new Date().toISOString()
): Promise<NormalizedJob> {
	const warnings: string[] = [];
	const read = (field: keyof FieldMapping, ...aliases: string[]) =>
		first(row, ...(mapping[field] ? [mapping[field]!] : []), field, ...aliases);
	let title = cleanText(
		read('title', 'jobTitle', 'job_title', 'position', 'name', 'job.title'),
		160
	);
	let company = cleanText(
		read(
			'company',
			'companyName',
			'company_name',
			'hiringOrganization.name',
			'employer.name',
			'company.name'
		),
		120
	);
	let location = cleanText(
		read(
			'location',
			'jobLocation.address.addressLocality',
			'jobLocation.address.addressRegion',
			'city'
		),
		160
	);
	let description = cleanText(
		read('description', 'jobDescription', 'job_description', 'descriptionHtml', 'body', 'content'),
		30000
	);
	let salary = cleanText(read('salary', 'salaryRange', 'compensation'), 120);
	if (/^(not listed|n\/?a|not specified|unknown)$/i.test(salary)) salary = '';
	const application_url = canonicalUrl(
		read(
			'application_url',
			'applyUrl',
			'apply_url',
			'applicationUrl',
			'jobUrl',
			'url',
			'linkedinUrl',
			'greenhouseUrl'
		)
	);
	const source_url =
		canonicalUrl(first(row, 'source_url', 'linkedinUrl', 'greenhouseUrl', 'jobUrl', 'url')) ||
		application_url;
	const hostname = source_url ? new URL(source_url).hostname : '';
	const source = hostname.includes('linkedin')
		? 'linkedin'
		: hostname.includes('greenhouse')
			? 'greenhouse'
			: cleanText(first(row, 'source', 'platform'), 50) || hostname || 'import';
	const sourceId =
		cleanText(
			first(row, 'source_id', 'jobId', 'job_id', 'externalId', 'identifier.value', 'id'),
			160
		) || null;
	const scrapedValue = first(row, 'scraped_at', 'scrapedAt', 'fetchedAt');
	const scrapedDate = new Date(
		typeof scrapedValue === 'string' && scrapedValue ? scrapedValue : reference
	);
	const scraped_at = Number.isNaN(scrapedDate.valueOf()) ? reference : scrapedDate.toISOString();
	const source_posted_text = cleanText(
		read('posted_at', 'datePosted', 'postedAt', 'published_at', 'date'),
		100
	);
	const posted_at = parsePosted(source_posted_text, scraped_at);
	if (source_posted_text && !posted_at) warnings.push('Posting date could not be interpreted.');
	if (/ago|today|just now/i.test(source_posted_text))
		warnings.push(
			`Posting date is estimated relative to ${scrapedValue ? 'the scrape time' : 'this import time'}.`
		);
	const aggregate =
		(description.match(/Posted\s*·/g) || []).length >= 3 || /^MyGreenhouse$/i.test(title);
	if (aggregate) {
		const slug =
			cleanText(first(row, 'companySlug'), 100) || source_url.match(/\/jobs\/([^/]+)\//)?.[1] || '';
		const lines = description
			.split(/\n+/)
			.map((v) => v.trim())
			.filter(Boolean);
		const idx = lines.findIndex(
			(v) =>
				v.toLowerCase().replace(/[^a-z0-9]/g, '') === slug.toLowerCase().replace(/[^a-z0-9]/g, '')
		);
		if (idx > 0) {
			title = lines[idx - 1].length > 2 ? lines[idx - 1] : title;
			company = lines[idx];
			const end = lines.findIndex((v, i) => i > idx && /^Posted/i.test(v));
			const own = lines.slice(idx + 1, end > idx ? end : idx + 5);
			location = own
				.filter((v) => !/^Remote|^Hybrid|^On-site|^\$/.test(v))
				.join(', ')
				.slice(0, 160);
			salary = own.find((v) => /^[$£€]/.test(v)) || '';
		} else {
			company = slug ? slug.replace(/[-_]/g, ' ') : company;
			title = /^MyGreenhouse$/i.test(title) ? '' : title;
			location = '';
			salary = '';
		}
		description = '';
		warnings.push(
			'Search-result cards were scraped instead of a job description. Verify the recovered fields and add the full description before publishing.'
		);
	}
	const workplaceValue = cleanText(
		first(row, 'workplace', 'workType', 'work_type', 'remoteType', 'jobLocationType'),
		50
	);
	const workplace = /hybrid/i.test(workplaceValue)
		? 'Hybrid'
		: /remote|telecommute/i.test(workplaceValue)
			? 'Remote'
			: /on.?site|office/i.test(workplaceValue)
				? 'On-site'
				: 'Not specified';
	const employmentValue = cleanText(
		first(row, 'employment_type', 'employmentType', 'jobType', 'type'),
		60
	);
	const employment_type = /full.?time/i.test(employmentValue)
		? 'Full-time'
		: /part.?time/i.test(employmentValue)
			? 'Part-time'
			: /contract/i.test(employmentValue)
				? 'Contract'
				: /intern/i.test(employmentValue)
					? 'Internship'
					: 'Not specified';
	if (!title || title.length < 2) warnings.push('A reliable job title is missing.');
	if (!company) warnings.push('Company is missing.');
	if (!location) warnings.push('Location is missing.');
	if (description.length < 10) warnings.push('A complete job description is required.');
	if (!application_url) warnings.push('A valid http(s) application URL is required.');
	if (!salary && !aggregate) {
		const match = description.match(
			/(?:salary|base pay|compensation)[^$£€\n]{0,100}([$£€][\d,]+\s*[-–]\s*[$£€]?[\d,]+)/i
		);
		if (match) {
			salary = match[1];
			warnings.push('Salary extracted from the description; verify its range and period.');
		}
	}
	const amounts =
		salary.match(/\d[\d,]*(?:\.\d+)?/g)?.map((v) => Number(v.replace(/,/g, ''))) || [];
	const suppliedTags = first(row, 'tags', 'skills', 'keywords');
	const tags = (
		Array.isArray(suppliedTags)
			? suppliedTags
			: typeof suppliedTags === 'string'
				? suppliedTags.split(',')
				: []
	)
		.map((v) => cleanText(v, 40))
		.filter(Boolean)
		.slice(0, 12);
	if (!tags.length)
		for (const skill of [
			'SQL',
			'Python',
			'TypeScript',
			'React',
			'Svelte',
			'Power BI',
			'Tableau',
			'Qlik',
			'AWS',
			'Azure',
			'Snowflake',
			'Java',
			'ETL'
		])
			if (new RegExp(`\\b${skill.replace(' ', '\\s+')}\\b`, 'i').test(title + ' ' + description))
				tags.push(skill);
	const identity = `${source}:${sourceId || application_url || `${company}:${title}:${location}`}`;
	const dedupe_key = await hash(identity);
	const suppliedId = cleanText(row.id, 100);
	const missing =
		!title ||
		title.length < 2 ||
		!company ||
		!location ||
		description.length < 10 ||
		!application_url ||
		aggregate;
	return {
		id: /^[a-zA-Z0-9_-]{1,100}$/.test(suppliedId) ? suppliedId : `job_${dedupe_key.slice(0, 24)}`,
		title,
		company,
		location,
		workplace,
		employment_type,
		salary,
		description,
		requirements: cleanText(first(row, 'requirements', 'qualifications')),
		application_url,
		tags: tags.slice(0, 12),
		visibility: row.visibility === 'assigned' ? 'assigned' : 'all',
		active: !missing,
		deadline: null,
		source,
		source_id: sourceId,
		source_url,
		dedupe_key,
		posted_at,
		scraped_at,
		source_posted_text,
		company_description: cleanText(
			first(row, 'company_description', 'aboutCompany', 'companyDescription'),
			10000
		),
		department: cleanText(first(row, 'department', 'jobCategory', 'category'), 120),
		experience_level: cleanText(
			first(row, 'experience_level', 'seniority', 'experienceLevel'),
			100
		),
		country: cleanText(
			first(row, 'country', 'location_filter', 'jobLocation.address.addressCountry'),
			100
		),
		salary_min: amounts[0] === undefined ? null : Math.round(amounts[0]),
		salary_max: amounts[1] === undefined ? null : Math.round(amounts[1]),
		salary_currency: /USD|US\$/.test(salary)
			? 'USD'
			: /£/.test(salary)
				? 'GBP'
				: /€/.test(salary)
					? 'EUR'
					: '',
		salary_period: /hour/i.test(salary) ? 'hour' : /year|annual/i.test(salary) ? 'year' : '',
		hiring_team: JSON.stringify(
			(Array.isArray(row.hiringTeam) ? row.hiringTeam.slice(0, 10) : []).map((member) => ({
				name: cleanText(object(member)?.name, 100),
				title: cleanText(object(member)?.title, 160),
				profile_url: canonicalUrl(object(member)?.profileUrl || object(member)?.url)
			}))
		),
		quality_state: missing ? 'needs_review' : 'ready',
		quality_warnings: warnings,
		raw_payload:
			JSON.stringify(row).length <= 100000
				? JSON.stringify(row)
				: JSON.stringify({ truncated: true, source_id: sourceId })
	};
}
export async function normalizeInput(text: string, mapping: FieldMapping = {}) {
	const parsed = parseJobInput(text);
	if (parsed.rows.length > 100) throw new Error('Import at most 100 jobs per batch.');
	if (!parsed.rows.length) throw new Error('No jobs found.');
	const jobs = await Promise.all(parsed.rows.map((row) => normalizeJob(row, mapping)));
	const seen = new Set<string>();
	for (const job of jobs) {
		if (seen.has(job.dedupe_key)) {
			job.quality_warnings.push('Duplicate source job in this batch. Select only one copy.');
			job.active = false;
			job.quality_state = 'needs_review';
		}
		seen.add(job.dedupe_key);
	}
	return { jobs, warnings: parsed.warnings };
}
