import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const base = process.env.TEST_BASE_URL || 'http://localhost:8787';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
	throw new Error('Integration tests only run against a local server.');
const suffix = Date.now().toString(36);
const testIp = `192.0.2.${(Date.now() % 240) + 10}`;
const password = 'A long test passphrase 2026!';
function client() {
	let cookie = '';
	return {
		get cookie() {
			return cookie;
		},
		async req(path, method = 'GET', body, extra = {}) {
			const response = await fetch(base + '/api/' + path, {
				method,
				headers: {
					...(body instanceof FormData ? {} : { 'content-type': 'application/json' }),
					origin: base,
					'cf-connecting-ip': testIp,
					...(cookie ? { cookie } : {}),
					...extra
				},
				body:
					body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body)
			});
			const set = response.headers.get('set-cookie');
			if (set) cookie = set.split(';')[0];
			const text = await response.text();
			let data;
			try {
				data = JSON.parse(text);
			} catch {
				data = text;
			}
			return { status: response.status, data, headers: response.headers };
		}
	};
}
function sql(command) {
	const result = spawnSync(
		'npx',
		['wrangler', 'd1', 'execute', 'space-one-clients', '--local', '--command', command],
		{ encoding: 'utf8' }
	);
	assert.equal(result.status, 0, result.stderr);
}
const admin = client(),
	alice = client(),
	bob = client();
let recovery;
const jobId = 'integration-' + suffix;
const job = {
	id: jobId,
	title: 'Integration Engineer',
	company: 'Test Company',
	location: 'Denver',
	description: 'This role is only an integration test.',
	application_url: 'https://example.com/apply',
	tags: ['TypeScript'],
	visibility: 'assigned'
};
const emails = [
	`admin-${suffix}@example.com`,
	`alice-${suffix}@example.com`,
	`bob-${suffix}@example.com`
];
let aliceId;
let fileId;
let interviewId;
test('Complete portal workflow on Cloudflare local D1 and R2', { timeout: 180000 }, async (t) => {
	await t.test('signup, session cookie and explicit administrator promotion', async () => {
		for (const [i, c] of [admin, alice, bob].entries()) {
			const r = await c.req('auth/signup', 'POST', {
				name: ['Admin Test', 'Alice Test', 'Bob Test'][i],
				email: emails[i],
				password,
				phone: '+1 555 010 1234',
				timezone: 'America/Denver'
			});
			assert.equal(r.status, 201, JSON.stringify(r.data));
			assert.match(r.headers.get('set-cookie'), /HttpOnly/i);
			assert.match(r.headers.get('set-cookie'), /SameSite=Lax/i);
			assert.match(r.data.recovery_key, /^[a-f0-9]{64}$/);
			if (i === 1) recovery = r.data.recovery_key;
		}
		sql(`UPDATE users SET role='admin',access_role='admin' WHERE email='${emails[0]}';`);
		aliceId = (await alice.req('me')).data.user.id;
		assert.equal((await admin.req('me')).data.user.role, 'admin');
	});
	await t.test('authentication and CSRF reject unauthorized requests', async () => {
		const duplicate = await client().req('auth/signup', 'POST', {
			name: 'Duplicate account',
			email: emails[1].toUpperCase(),
			password,
			phone: '+1 555 010 1234'
		});
		assert.equal(duplicate.status, 409, JSON.stringify(duplicate.data));
		assert.equal((await client().req('jobs')).status, 401);
		assert.equal((await alice.req('admin/overview')).status, 403);
		assert.equal(
			(await alice.req('auth/logout', 'POST', {}, { origin: 'https://attacker.example' })).status,
			403
		);
		assert.equal(
			(
				await client().req('auth/login', 'POST', {
					email: emails[1],
					password: 'incorrect password'
				})
			).status,
			401
		);
	});
	await t.test('assignment visibility and safe external URLs', async () => {
		assert.equal(
			(await admin.req('admin/jobs', 'POST', { ...job, application_url: 'javascript:alert(1)' }))
				.status,
			400
		);
		assert.equal((await admin.req('admin/jobs', 'POST', job)).status, 201);
		assert.equal((await alice.req(`jobs/${jobId}`)).status, 404);
		assert.equal(
			(await admin.req('admin/assignments', 'POST', { job_id: jobId, user_ids: [aliceId] })).status,
			200
		);
		assert.equal((await alice.req(`jobs/${jobId}`)).status, 200);
		assert.equal((await bob.req(`jobs/${jobId}`)).status, 404);
		assert.ok((await alice.req('jobs')).data.jobs.some((j) => j.id === jobId));
	});
	await t.test('status history, follow-up date and stale edit protection', async () => {
		const r = await alice.req(`jobs/${jobId}/application`, 'PATCH', {
			version: 0,
			status: 'applied',
			follow_up: '2026-11-01',
			saved: true
		});
		assert.equal(r.status, 200, JSON.stringify(r.data));
		assert.equal(r.data.job.version, 1);
		assert.equal(r.data.job.status, 'applied');
		assert.ok(r.data.job.applied_at);
		assert.equal(r.data.activity.length, 1);
		assert.equal(
			(await alice.req(`jobs/${jobId}/application`, 'PATCH', { version: 0, status: 'rejected' }))
				.status,
			409
		);
		assert.equal(
			(await alice.req(`jobs/${jobId}/application`, 'PATCH', { version: 1, status: 'invalid' }))
				.status,
			400
		);
		assert.equal(
			(
				await alice.req(`jobs/${jobId}/notes`, 'POST', {
					body: 'Recruiter said to follow up next week.'
				})
			).status,
			201
		);
	});
	await t.test('resume versions, image proof, validation and private downloads', async () => {
		assert.equal((await alice.req(`jobs/${jobId}/files`, 'POST', {})).status, 400);
		const upload = async (bytes, name, kind, mime) => {
			const f = new FormData();
			f.set('kind', kind);
			f.set('file', new Blob([bytes], { type: mime }), name);
			return alice.req(`jobs/${jobId}/files`, 'POST', f);
		};
		assert.equal(
			(await upload('<script>alert(1)</script>', 'fake.pdf', 'resume', 'application/pdf')).status,
			400
		);
		let r = await upload(
			'%PDF-1.4\nTest resume\n%%EOF',
			'resume-v1.pdf',
			'resume',
			'application/pdf'
		);
		assert.equal(r.status, 201, JSON.stringify(r.data));
		fileId = r.data.id;
		assert.equal(
			(
				await upload(
					'%PDF-1.4\nUpdated resume\n%%EOF',
					'resume-v2.pdf',
					'resume',
					'application/pdf'
				)
			).status,
			201
		);
		const png = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=',
			'base64'
		);
		assert.equal((await upload(png, 'confirmation.png', 'proof', 'image/png')).status, 201);
		assert.equal((await alice.req(`files/${fileId}`)).status, 200);
		assert.equal((await bob.req(`files/${fileId}`)).status, 404);
		assert.equal((await bob.req(`files/${fileId}`, 'DELETE')).status, 404);
		const files = (await alice.req(`jobs/${jobId}`)).data.attachments;
		assert.equal(files.filter((f) => f.kind === 'resume').length, 2);
		assert.equal(files.filter((f) => f.kind === 'proof').length, 1);
		assert.ok(files.every((f) => !('object_key' in f)));
	});
	await t.test('interview scheduling, editing, isolation and calendar export', async () => {
		const meeting = {
			title: 'Technical interview',
			starts_at: '2026-11-02T16:00:00.000Z',
			ends_at: '2026-11-02T17:00:00.000Z',
			timezone: 'America/Denver',
			state: 'scheduled',
			location: 'https://example.com/meeting',
			notes: 'Prepare project examples'
		};
		const r = await alice.req(`jobs/${jobId}/interviews`, 'POST', meeting);
		assert.equal(r.status, 201, JSON.stringify(r.data));
		interviewId = r.data.id;
		assert.equal((await bob.req(`interviews/${interviewId}/calendar`)).status, 404);
		const calendar = await alice.req(`interviews/${interviewId}/calendar`);
		assert.equal(calendar.status, 200);
		assert.match(calendar.data, /DTSTART:20261102T160000Z/);
		assert.equal(
			(
				await alice.req(`interviews/${interviewId}`, 'PATCH', {
					...meeting,
					ends_at: '2026-11-02T15:00:00.000Z'
				})
			).status,
			400
		);
		assert.equal(
			(await alice.req(`interviews/${interviewId}`, 'PATCH', { ...meeting, state: 'completed' }))
				.status,
			200
		);
		assert.equal(
			(await alice.req('interviews')).data.interviews.find((i) => i.id === interviewId).state,
			'completed'
		);
	});
	await t.test('import is validated, idempotent and preserves client applications', async () => {
		assert.equal(
			(
				await admin.req('admin/import', 'POST', {
					jobs: [
						{ ...job, title: 'Updated title' },
						{ ...job, id: jobId + '-bad', title: '' }
					]
				})
			).status,
			400
		);
		assert.equal((await alice.req(`jobs/${jobId}`)).data.job.title, job.title);
		assert.equal(
			(await admin.req('admin/import', 'POST', { jobs: [{ ...job, title: 'Updated title' }] }))
				.status,
			200
		);
		assert.equal((await alice.req(`jobs/${jobId}`)).data.job.status, 'applied');
		assert.equal(
			(await admin.req('admin/assignments', 'POST', { job_id: jobId, user_ids: [] })).status,
			200
		);
		assert.equal((await admin.req('admin/jobs', 'POST', { ...job, active: false })).status, 201);
		assert.equal((await alice.req(`jobs/${jobId}`)).status, 200);
		assert.equal((await bob.req(`jobs/${jobId}`)).status, 404);
	});
	await t.test('pages render with authenticated data', async () => {
		for (const path of ['/jobs', `/jobs/${jobId}`, '/documents', '/interviews', '/settings']) {
			const r = await fetch(base + path, { headers: { cookie: alice.cookie } });
			assert.equal(r.status, 200, `${path}: ${await r.text()}`);
		}
		const r = await fetch(base + '/admin', { headers: { cookie: admin.cookie } });
		assert.equal(r.status, 200, await r.text());
	});
	await t.test('recovery key is single-use and revokes old sessions', async () => {
		const other = client();
		assert.equal(
			(await other.req('auth/login', 'POST', { email: emails[1], password })).status,
			200
		);
		const recovered = client();
		const r = await recovered.req('auth/recover', 'POST', {
			email: emails[1],
			recovery_key: recovery,
			password: 'A new long test passphrase!'
		});
		assert.equal(r.status, 200, JSON.stringify(r.data));
		assert.notEqual(r.data.recovery_key, recovery);
		assert.equal((await other.req('me')).status, 401);
		assert.equal((await alice.req('me')).status, 401);
		assert.equal(
			(
				await client().req('auth/recover', 'POST', {
					email: emails[1],
					recovery_key: recovery,
					password: 'Another long passphrase!'
				})
			).status,
			400
		);
		const files = (await recovered.req('files')).data.files;
		for (const f of files.filter((f) => f.job_id === jobId))
			assert.equal((await recovered.req(`files/${f.id}`, 'DELETE')).status, 200);
		assert.equal((await recovered.req(`files/${fileId}`)).status, 404);
		assert.equal((await recovered.req('auth/logout', 'POST', {})).status, 200);
		assert.equal((await recovered.req('me')).status, 401);
	});
	// Test-only fixtures; no demo or user data is touched.
	sql(
		`DELETE FROM users WHERE email IN (${emails.map((e) => `'${e}'`).join(',')}); DELETE FROM jobs WHERE id='${jobId}';`
	);
});
