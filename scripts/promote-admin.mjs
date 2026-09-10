import { spawnSync } from 'node:child_process';
const args = process.argv.slice(2);
const email = args
	.find((a) => !a.startsWith('--'))
	?.trim()
	.toLowerCase();
if (
	!email ||
	!/^[a-z0-9.!#$%&*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email) ||
	email.length > 254
) {
	console.error('Usage: npm run admin -- you@example.com --local|--remote');
	process.exit(1);
}
if (args.includes('--local') === args.includes('--remote')) {
	console.error('Choose exactly one target: --local or --remote.');
	process.exit(1);
}
// argv, not a shell command; SQL literals still require escaping.
const escaped = email.replaceAll("'", "''");
const result = spawnSync(
	'npx',
	[
		'wrangler',
		'd1',
		'execute',
		'space-one-clients',
		args.includes('--remote') ? '--remote' : '--local',
		'--command',
		`UPDATE users SET role='admin', access_role='admin', account_status='active' WHERE email='${escaped}'; SELECT email,access_role FROM users WHERE email='${escaped}';`
	],
	{ stdio: 'inherit', shell: false }
);
process.exit(result.status ?? 1);
