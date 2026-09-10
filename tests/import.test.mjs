import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import {
	normalizeInput,
	normalizeJob,
	canonicalUrl,
	cleanText,
	parseJobInput
} from '../src/lib/job-import.ts';
test('provided LinkedIn fragment preserves all complete jobs and safe application links', async () => {
	const result = await normalizeInput(readFileSync('tests/fixtures/linkedin-fragment.txt', 'utf8'));
	assert.equal(result.jobs.length, 3);
	assert.ok(result.warnings.length);
	assert.equal(result.jobs[0].company, 'Credico');
	assert.equal(result.jobs[0].quality_state, 'ready');
	assert.ok(result.jobs[1].application_url.includes('opportunityId='));
	assert.ok(!result.jobs[1].application_url.includes('utm_'));
});
test('mixed Greenhouse search cards are held and never borrow a different employer salary or description', async () => {
	const { jobs } = await normalizeInput(
		readFileSync('tests/fixtures/greenhouse-fragment.txt', 'utf8')
	);
	assert.equal(jobs.length, 2);
	assert.ok(jobs.every((j) => !j.active && j.quality_state === 'needs_review' && !j.description));
	assert.equal(jobs[0].company, 'Alpaca');
	assert.equal(jobs[0].salary, '');
	assert.equal(jobs[1].company, 'Terrabis');
	assert.ok(jobs[1].location.includes('Chicago'));
});
test('normalization accepts JSON-LD, aliases, JSONL and explicit field mapping without rendering HTML', async () => {
	const j = await normalizeJob({
		title: 'Engineer',
		hiringOrganization: { name: 'Company' },
		jobLocation: { address: { addressLocality: 'Denver' } },
		description: '<p>Useful <b>engineering</b> work</p><script>alert(1)</script>',
		url: 'https://example.com/apply?utm_source=test&job=1'
	});
	assert.equal(j.company, 'Company');
	assert.equal(j.location, 'Denver');
	assert.equal(j.description, 'Useful engineering work');
	assert.equal(j.workplace, 'Not specified');
	assert.equal(j.quality_state, 'ready');
	assert.equal(canonicalUrl('javascript:alert(1)'), '');
	assert.equal(canonicalUrl('https://user:pass@example.com'), '');
	assert.equal(parseJobInput('{"title":"A"}\n{"title":"B"}').rows.length, 2);
	assert.equal(
		(await normalizeJob({ role: { label: 'Designer' } }, { title: 'role.label' })).title,
		'Designer'
	);
});
test('duplicates are detected across tracking URLs and incomplete inputs stay unpublished', async () => {
	const row = {
		title: 'Data Engineer',
		company: 'Example',
		location: 'Denver',
		description: 'A complete description for this role.',
		application_url: 'https://example.com/job?job=42'
	};
	const r = await normalizeInput(
		JSON.stringify([row, { ...row, application_url: row.application_url + '&utm_source=x' }])
	);
	assert.equal(r.jobs[0].dedupe_key, r.jobs[1].dedupe_key);
	assert.equal(r.jobs[1].active, false);
	assert.equal((await normalizeJob({ title: 'Engineer' })).active, false);
	await assert.rejects(() => normalizeInput(JSON.stringify(Array(101).fill(row))), /100/);
});
test('additive upgrade preserves existing administrators and their application history', () => {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys=ON');
	db.exec(readFileSync('migrations/0000_reflective_nekra.sql', 'utf8'));
	db.exec(
		"INSERT INTO users(id,email,name,password_hash,recovery_hash,role) VALUES('old','old@example.com','Old admin','hash','hash','admin');INSERT INTO jobs(id,title,company,location,description,application_url) VALUES('oldjob','Title','Company','Remote','Description','https://example.com');INSERT INTO applications(id,user_id,job_id) VALUES('oldapp','old','oldjob');"
	);
	db.exec(readFileSync('migrations/0001_smiling_galactus.sql', 'utf8'));
	assert.equal(
		db.prepare("SELECT access_role FROM users WHERE id='old'").get().access_role,
		'admin'
	);
	assert.equal(db.prepare('SELECT count(*) n FROM applications').get().n, 1);
	db.close();
});
