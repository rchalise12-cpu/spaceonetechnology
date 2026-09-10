import test from 'node:test';
import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://localhost:8787';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
	throw Error('Local server required.');
test('public sitemap pages render, old links redirect, private pages require authentication', async () => {
	const sitemap = await (await fetch(base + '/sitemap.xml')).text();
	const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
	assert.ok(paths.length >= 35);
	for (const path of paths) {
		const r = await fetch(base + path);
		assert.equal(r.status, 200, path);
		const html = await r.text();
		assert.match(html, /<h1[\s>]/, path);
		assert.doesNotMatch(html, /name="robots" content="noindex/);
		assert.ok(!r.headers.get('x-robots-tag'), path);
	}
	for (const [path, target] of [
		['/about-us', '/about'],
		['/our-team', '/company/team'],
		['/our-services', '/services'],
		['/job-openings', '/careers'],
		['/profiles/sara-thompson', '/company/team'],
		['/home-two', '/'],
		['/login', '/client/login'],
		['/client/jobs', '/jobs']
	]) {
		const r = await fetch(base + path, { redirect: 'manual' });
		assert.equal(r.status, 308, path);
		assert.equal(r.headers.get('location'), target, path);
	}
	for (const path of [
		'/dashboard',
		'/jobs',
		'/jobs/example',
		'/candidates',
		'/imports',
		'/invitations',
		'/admin'
	]) {
		const r = await fetch(base + path, { redirect: 'manual' });
		assert.equal(r.status, 303, path);
		assert.equal(r.headers.get('location'), '/client/login');
	}
	for (const path of [
		'/client/login',
		'/client/signup',
		'/client/forgot-password',
		'/client/reset-password',
		'/client/recover'
	])
		assert.equal((await fetch(base + path)).status, 200, path);
	assert.equal((await fetch(base + '/a-page-that-does-not-exist')).status, 404);
});
