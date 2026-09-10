export function calendarEvent(item: {
	id: string;
	title: string;
	starts_at: string;
	ends_at: string;
	location: string;
	notes: string;
	state: string;
}) {
	const escape = (s: string) =>
		s
			.replace(/\\/g, '\\\\')
			.replace(/\r?\n/g, '\\n')
			.replace(/;/g, '\\;')
			.replace(/,/g, '\\,')
			.replace(/\r/g, '');
	const stamp = (s: string) =>
		new Date(s)
			.toISOString()
			.replace(/[-:]/g, '')
			.replace(/\.\d{3}/, '');
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Space One Technology//Client Portal//EN',
		'CALSCALE:GREGORIAN',
		'BEGIN:VEVENT',
		`UID:${item.id}@clients.spaceonetechnology.com`,
		`DTSTAMP:${stamp(new Date().toISOString())}`,
		`DTSTART:${stamp(item.starts_at)}`,
		`DTEND:${stamp(item.ends_at)}`,
		`SUMMARY:${escape(item.title)}`,
		`LOCATION:${escape(item.location)}`,
		`DESCRIPTION:${escape(item.notes)}`,
		`STATUS:${item.state === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
		'BEGIN:VALARM',
		'TRIGGER:-PT30M',
		'ACTION:DISPLAY',
		'DESCRIPTION:Interview in 30 minutes',
		'END:VALARM',
		'END:VEVENT',
		'END:VCALENDAR'
	];
	// RFC 5545 line folding uses octets, not UTF-16 characters.
	return (
		lines
			.map((line) => {
				let result = '';
				let bytes = 0;
				for (const ch of line) {
					const length = new TextEncoder().encode(ch).length;
					if (bytes + length > 73) {
						result += '\r\n ';
						bytes = 1;
					}
					result += ch;
					bytes += length;
				}
				return result;
			})
			.join('\r\n') + '\r\n'
	);
}
