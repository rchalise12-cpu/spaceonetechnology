import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { calendarEvent } from '../src/lib/calendar.ts';

test('Drizzle migration enforces ownership, unique applications, file constraints and interview bounds', () => {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys=ON');
	for (const file of readdirSync('migrations')
		.filter((f) => f.endsWith('.sql'))
		.sort())
		db.exec(readFileSync(`migrations/${file}`, 'utf8'));
	db.exec(
		"INSERT INTO users(id,email,name,password_hash,recovery_hash) VALUES ('u','a@example.com','User','hash','hash'); INSERT INTO jobs(id,title,company,location,description,application_url) VALUES ('j','Role','Company','Remote','Description','https://example.com'); INSERT INTO applications(id,user_id,job_id) VALUES ('a','u','j');"
	);
	assert.throws(
		() => db.exec("INSERT INTO applications(id,user_id,job_id) VALUES ('b','u','j')"),
		/UNIQUE/
	);
	assert.throws(() => db.exec("UPDATE applications SET status='anything' WHERE id='a'"), /CHECK/);
	assert.throws(
		() =>
			db.exec(
				"INSERT INTO attachments(id,application_id,object_key,name,kind,mime,size) VALUES ('f','a','key','resume','resume','application/pdf',10485761)"
			),
		/CHECK/
	);
	assert.throws(
		() =>
			db.exec(
				"INSERT INTO interviews(id,application_id,title,starts_at,ends_at,timezone) VALUES ('i','a','Interview','2026-10-02T10:00:00Z','2026-10-02T09:00:00Z','UTC')"
			),
		/CHECK/
	);
	db.exec("DELETE FROM users WHERE id='u'");
	assert.equal(db.prepare('SELECT COUNT(*) n FROM applications').get().n, 0);
	db.close();
});
test('calendar export escapes content, folds UTF-8 lines, uses UTC and includes a reminder', () => {
	const content = calendarEvent({
		id: 'test',
		title: 'Round 2, engineering; ' + '👩‍💻'.repeat(40),
		starts_at: '2026-11-02T16:00:00Z',
		ends_at: '2026-11-02T17:00:00Z',
		location: 'Room 2\nMain office',
		notes: 'Bring resume\nAsk questions',
		state: 'scheduled'
	});
	assert.match(content, /DTSTART:20261102T160000Z/);
	assert.match(content, /TRIGGER:-PT30M/);
	assert.match(content, /SUMMARY:Round 2\\, engineering\\;/);
	assert.match(content, /LOCATION:Room 2\\nMain office/);
	for (const line of content.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
	assert.ok(content.endsWith('END:VCALENDAR\r\n'));
});
