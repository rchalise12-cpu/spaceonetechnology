export const statuses = [
	'to_apply',
	'saved',
	'applied',
	'processing',
	'interview',
	'offer',
	'rejected',
	'withdrawn'
] as const;
export type Status = (typeof statuses)[number];
export const statusLabel: Record<Status, string> = {
	to_apply: 'To apply',
	saved: 'Saved',
	applied: 'Applied',
	processing: 'In review',
	interview: 'Interview',
	offer: 'Offer',
	rejected: 'Rejected',
	withdrawn: 'Withdrawn'
};
export const interviewStates = ['scheduled', 'completed', 'cancelled'] as const;
export interface User {
	id: string;
	name: string;
	email: string;
	role: 'client' | 'staff' | 'admin';
	phone: string;
	location: string;
	headline: string;
	bio: string;
	skills: string;
	account_status: 'active' | 'suspended';
	created_at: string;
	timezone: string;
}
export interface Job {
	source: string;
	source_id: string | null;
	source_url: string;
	posted_at: string | null;
	scraped_at: string | null;
	source_posted_text: string;
	company_description: string;
	department: string;
	experience_level: string;
	country: string;
	quality_state: 'ready' | 'needs_review';
	quality_warnings: string;
	salary_min: number | null;
	salary_max: number | null;
	salary_currency: string;
	salary_period: string;
	hiring_team: string;
	application_count: number;
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
	tags: string;
	visibility: string;
	active: number;
	deadline: string | null;
	created_at: string;
	updated_at: string;
	status: Status;
	saved: number;
	follow_up: string | null;
	applied_at: string | null;
	version: number;
	application_id: string | null;
	next_interview: string | null;
	interview_state: string | null;
}
export interface Interview {
	id: string;
	application_id: string;
	title: string;
	starts_at: string;
	ends_at: string;
	timezone: string;
	state: 'scheduled' | 'completed' | 'cancelled';
	location: string;
	notes: string;
	job_id: string;
	job_title: string;
	company: string;
}
export interface Attachment {
	id: string;
	application_id: string;
	name: string;
	kind: 'resume' | 'proof';
	mime: string;
	size: number;
	created_at: string;
	job_id: string;
	job_title: string;
	company: string;
}
export interface Activity {
	id: string;
	body: string;
	kind: string;
	created_at: string;
}
