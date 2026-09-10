import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
const base = process.env.TEST_BASE_URL || 'http://localhost:8787';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
	throw Error('Local test server required.');
const suffix = 'ops-' + Date.now().toString(36),
	password = 'A very long operations passphrase!';
const addresses = [];
const ids = [];
const jobsCreated = [];
let ip = 10;
function client() {
	let cookie = '';
	const testIp = `198.51.100.${ip++}`;
	return {
		get cookie() {
			return cookie;
		},
		async req(path, method = 'GET', body) {
			const r = await fetch(base + '/api/' + path, {
				method,
				headers: {
					origin: base,
					'cf-connecting-ip': testIp,
					...(cookie ? { cookie } : {}),
					...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' })
				},
				body:
					body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body)
			});
			if (r.headers.get('set-cookie')) cookie = r.headers.get('set-cookie').split(';')[0];
			const text = await r.text();
			let data;
			try {
				data = JSON.parse(text);
			} catch {
				data = text;
			}
			return { status: r.status, data };
		}
	};
}
function sql(command) {
	const r = spawnSync(
		'npx',
		['wrangler', 'd1', 'execute', 'space-one-clients', '--local', '--command', command],
		{ encoding: 'utf8' }
	);
	assert.equal(r.status, 0, r.stderr);
}
function ok(r, status = 200) {
	assert.equal(r.status, status, JSON.stringify(r.data));
	return r.data;
}
const admin = client(),
	staff = client(),
	alice = client(),
	bob = client();
let aliceId, staffId, jobId, profileId;
async function signup(c, name) {
	const email = `${suffix}-${name}@example.com`;
	addresses.push(email);
	ok(
		await c.req('auth/signup', 'POST', {
			name: `${name} Test`,
			email,
			phone: '+1 555 010 2026',
			password
		}),
		201
	);
	const id = ok(await c.req('me')).user.id;
	ids.push(id);
	return id;
}
test('Roles, invitations, imports and candidate operations', { timeout: 240000 }, async (t) => {
	await t.test('create isolated accounts and enforce role boundaries', async () => {
		await signup(admin, 'admin');
		staffId = await signup(staff, 'staff');
		aliceId = await signup(alice, 'alice');
		await signup(bob, 'bob');
		sql(
			`UPDATE users SET access_role='admin',role='admin' WHERE email='${addresses[0]}';UPDATE users SET access_role='staff' WHERE id='${staffId}';`
		);
		assert.equal(ok(await staff.req('me')).user.role, 'staff');
		for (const endpoint of ['candidates', 'invitations', 'imports', 'team', 'inquiries'])
			assert.equal((await alice.req(endpoint)).status, 403, endpoint);
		assert.equal((await staff.req('team')).status, 403);
		ok(await staff.req('candidates'));
		ok(await staff.req('admin/overview'));
	});
	await t.test('staff invites clients; admin invites staff; acceptance is single-use', async () => {
		assert.equal(
			(
				await staff.req('invitations', 'POST', {
					email: `blocked-${suffix}@example.com`,
					role: 'staff'
				})
			).status,
			403
		);
		for (const [inviter, role] of [
			[staff, 'client'],
			[admin, 'staff']
		]) {
			const email = `${suffix}-invited-${role}@example.com`;
			addresses.push(email);
			const invite = ok(await inviter.req('invitations', 'POST', { email, role }), 201);
			assert.equal(invite.delivery_status, 'local');
			assert.ok(invite.preview_url);
			const token = new URL(invite.preview_url).searchParams.get('token');
			const recipient = client();
			assert.equal(ok(await recipient.req(`auth/invitation?token=${token}`)).email, email);
			const payload = {
				token,
				email,
				name: `Invited ${role}`,
				phone: '+1 555 010 3333',
				password,
				timezone: 'America/Chicago'
			};
			ok(await recipient.req('auth/accept-invite', 'POST', payload), 201);
			const user = ok(await recipient.req('me')).user;
			ids.push(user.id);
			assert.equal(user.role, role);
			assert.equal((await client().req('auth/accept-invite', 'POST', payload)).status, 410);
			const page = await fetch(base + '/dashboard', { headers: { cookie: recipient.cookie } });
			assert.equal(page.status, 200, await page.text());
		}
	});
	await t.test('revoking and resending invalidates old invitation links', async () => {
		const email = `${suffix}-revoked@example.com`;
		const invite = ok(await staff.req('invitations', 'POST', { email, role: 'client' }), 201);
		const oldToken = new URL(invite.preview_url).searchParams.get('token');
		ok(await staff.req(`invitations/${invite.id}`, 'DELETE'));
		assert.equal((await client().req(`auth/invitation?token=${oldToken}`)).status, 410);
		const resent = ok(await staff.req(`invitations/${invite.id}`, 'POST', {}), 201);
		assert.notEqual(new URL(resent.preview_url).searchParams.get('token'), oldToken);
		assert.equal((await client().req(`auth/invitation?token=${oldToken}`)).status, 410);
	});
	await t.test(
		'import sanitizes descriptions, skips repeats and holds unsafe records',
		async () => {
			const rows = [
				{
					id: suffix + '-ready',
					title: 'Operations Data Engineer',
					company: 'Example',
					location: 'Denver',
					description: '<p>Build reliable data pipelines.</p><script>steal()</script>',
					applyUrl: `https://example.com/${suffix}?utm_source=test`
				},
				{ id: suffix + '-held', title: 'Incomplete role', company: 'Example' }
			];
			const text = JSON.stringify({ jobs: rows });
			const preview = ok(await staff.req('imports/preview', 'POST', { text }));
			assert.equal(preview.jobs[0].description, 'Build reliable data pipelines.');
			assert.equal(preview.jobs[1].quality_state, 'needs_review');
			const result = ok(
				await staff.req('imports/commit', 'POST', { text, name: 'Operations test' }),
				201
			);
			assert.equal(result.published, 1);
			assert.equal(result.held, 1);
			jobsCreated.push(...rows.map((j) => j.id));
			jobId = rows[0].id;
			assert.equal(
				ok(await staff.req('imports/commit', 'POST', { text, name: 'Repeat test' }), 201)
					.duplicates,
				2
			);
			assert.equal((await alice.req(`jobs/${rows[1].id}`)).status, 404);
			const job = ok(await alice.req(`jobs/${jobId}`)).job;
			assert.equal('raw_payload' in job, false);
			assert.equal('dedupe_key' in job, false);
		}
	);
	await t.test('candidate applications, comments and tasks stay isolated', async () => {
		ok(await alice.req(`jobs/${jobId}/application`, 'PATCH', { version: 0, status: 'applied' }));
		ok(
			await alice.req(`jobs/${jobId}/comments`, 'POST', {
				body: 'I applied and sent the tailored resume.'
			}),
			201
		);
		ok(
			await staff.req(`jobs/${jobId}/comments?candidate=${aliceId}`, 'POST', {
				body: 'Thanks. Let’s prepare for the next conversation.'
			}),
			201
		);
		assert.equal(ok(await alice.req(`jobs/${jobId}`)).comments.length, 2);
		assert.equal(ok(await bob.req(`jobs/${jobId}`)).comments.length, 0);
		assert.equal((await bob.req(`jobs/${jobId}?candidate=${aliceId}`)).status, 403);
		const task = ok(
			await staff.req(`tasks?candidate=${aliceId}`, 'POST', {
				title: 'Prepare a project example',
				job_id: jobId,
				due_date: '2026-09-01'
			}),
			201
		);
		assert.equal(ok(await alice.req('tasks')).tasks.length, 1);
		assert.equal((await bob.req(`tasks/${task.id}`, 'PATCH', { done: true })).status, 404);
		ok(await alice.req(`tasks/${task.id}`, 'PATCH', { done: true }));
	});
	await t.test('profile PDF library and per-job copies use private R2 access', async () => {
		const form = new FormData();
		form.set(
			'file',
			new Blob(['%PDF-1.7\nOperations test resume\n%%EOF'], { type: 'application/pdf' }),
			'resume.pdf'
		);
		profileId = ok(await alice.req('profile-files', 'POST', form), 201).id;
		assert.equal((await bob.req(`profile-files/${profileId}`)).status, 403);
		ok(await staff.req(`profile-files/${profileId}`));
		ok(await alice.req(`jobs/${jobId}/resume`, 'POST', { file_id: profileId }), 201);
		const details = ok(await staff.req(`jobs/${jobId}?candidate=${aliceId}`));
		assert.equal(details.attachments.length, 1);
		const f = details.attachments[0];
		assert.equal((await bob.req(`files/${f.id}`)).status, 404);
		ok(await staff.req(`files/${f.id}`));
		ok(await alice.req(`profile-files/${profileId}`, 'DELETE'));
		ok(await alice.req(`files/${f.id}`));
		ok(await alice.req(`files/${f.id}`, 'DELETE'));
	});
	await t.test('completed interviews and submissions appear in candidate analytics', async () => {
		ok(
			await staff.req(`jobs/${jobId}/interviews?candidate=${aliceId}`, 'POST', {
				title: 'Technical conversation',
				starts_at: '2026-10-01T16:00:00Z',
				ends_at: '2026-10-01T17:00:00Z',
				timezone: 'America/Denver',
				state: 'completed',
				location: 'Video call',
				notes: 'Discussed data pipelines.'
			}),
			201
		);
		const candidate = ok(await staff.req(`candidates/${aliceId}`));
		assert.equal(candidate.candidate.applied, 1);
		assert.equal(candidate.candidate.interviews_completed, 1);
		assert.equal(candidate.applications[0].job_id, jobId);
		assert.equal(ok(await staff.req(`jobs/${jobId}`)).job.application_count, 1);
	});
	await t.test('public contact form reaches the staff inquiry queue', async () => {
		ok(
			await client().req('contact', 'POST', {
				name: 'Test inquiry',
				email: `inquiry-${suffix}@example.com`,
				company: 'Example',
				interest: 'Technology project',
				message: 'We would like to discuss a new internal tool.'
			}),
			201
		);
		const rows = ok(await staff.req('inquiries')).inquiries;
		const item = rows.find((i) => i.email === `inquiry-${suffix}@example.com`);
		assert.ok(item);
		ok(await staff.req(`inquiries/${item.id}`, 'PATCH', { status: 'in_progress' }));
		sql(`DELETE FROM inquiries WHERE id='${item.id}'`);
	});
	await t.test(
		'all new protected pages render and clients cannot open operational pages',
		async () => {
			for (const path of [
				'/dashboard',
				'/candidates',
				`/candidates/${aliceId}`,
				'/imports',
				'/invitations',
				'/inquiries',
				`/jobs/${jobId}?candidate=${aliceId}`
			]) {
				const r = await fetch(base + path, { headers: { cookie: staff.cookie } });
				assert.equal(r.status, 200, `${path}: ${await r.text()}`);
			}
			const team = await fetch(base + '/team', { headers: { cookie: admin.cookie } });
			assert.equal(team.status, 200, await team.text());
			for (const path of ['/candidates', '/imports', '/invitations', '/team']) {
				const r = await fetch(base + path, {
					headers: { cookie: alice.cookie },
					redirect: 'manual'
				});
				assert.equal(r.status, 303);
				assert.equal(r.headers.get('location'), '/dashboard');
			}
			const r = await fetch(base + '/jobs', { redirect: 'manual' });
			assert.equal(r.headers.get('location'), '/client/login');
		}
	);
	await t.test(
		'email reset consumes a hashed token once and suspensions revoke sessions',
		async () => {
			const raw = randomBytes(32).toString('hex'),
				hash = createHash('sha256').update(raw).digest('hex');
			sql(
				`INSERT INTO password_resets(id,user_id,token_hash,expires_at) VALUES('${suffix}-reset','${aliceId}','${hash}',${Date.now() + 3600000})`
			);
			const reset = client();
			ok(
				await reset.req('auth/reset-password', 'POST', {
					token: raw,
					password: 'A replacement operations passphrase!'
				})
			);
			assert.equal((await alice.req('me')).status, 401);
			assert.equal(
				(await client().req('auth/reset-password', 'POST', { token: raw, password })).status,
				410
			);
			ok(
				await admin.req(`team/${staffId}`, 'PATCH', { role: 'staff', account_status: 'suspended' })
			);
			assert.equal((await staff.req('me')).status, 401);
			assert.equal(
				(await staff.req('auth/login', 'POST', { email: addresses[1], password })).status,
				401
			);
		}
	);
	// Only remove records uniquely owned by this test run. Keep real workspace data intact.
	sql(
		`DELETE FROM comments WHERE author_id IN (${ids.map((id) => `'${id}'`).join(',')});DELETE FROM tasks WHERE created_by IN (${ids.map((id) => `'${id}'`).join(',')});DELETE FROM invitations WHERE email LIKE '${suffix}-%';DELETE FROM audit_log WHERE actor_id IN (${ids.map((id) => `'${id}'`).join(',')});DELETE FROM import_batches WHERE user_id IN (${ids.map((id) => `'${id}'`).join(',')});DELETE FROM jobs WHERE id IN (${jobsCreated.map((id) => `'${id}'`).join(',')});DELETE FROM users WHERE id IN (${ids.map((id) => `'${id}'`).join(',')});`
	);
});
