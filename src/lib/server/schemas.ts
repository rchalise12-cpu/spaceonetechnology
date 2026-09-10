import { z } from 'zod';
import { statuses, interviewStates } from '$lib/types';
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(12, 'Use at least 12 characters.').max(128);
export const timezoneSchema = z
	.string()
	.max(100)
	.refine((value) => {
		try {
			new Intl.DateTimeFormat('en', { timeZone: value });
			return true;
		} catch {
			return false;
		}
	}, 'Choose a valid timezone.');
const dateOnly = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/)
	.refine((s) => {
		const d = new Date(s);
		return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === s;
	});
const httpUrl = z
	.string()
	.url()
	.max(2000)
	.refine((s) => {
		const u = new URL(s);
		return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password;
	}, 'Use an http or https URL.');
export const jobSchema = z
	.object({
		id: z
			.string()
			.regex(/^[a-zA-Z0-9_-]{1,100}$/)
			.optional(),
		title: z.string().trim().min(2).max(160),
		company: z.string().trim().min(1).max(120),
		location: z.string().trim().min(1).max(160),
		workplace: z.enum(['Remote', 'Hybrid', 'On-site', 'Not specified']).default('Remote'),
		employment_type: z
			.enum(['Full-time', 'Part-time', 'Contract', 'Internship', 'Not specified'])
			.default('Full-time'),
		salary: z.string().max(120).default(''),
		description: z.string().trim().min(10).max(30000),
		requirements: z.string().max(15000).default(''),
		application_url: httpUrl,
		tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
		visibility: z.enum(['all', 'assigned']).default('all'),
		active: z.boolean().default(true),
		deadline: dateOnly.nullable().default(null)
	})
	.strict();
export const applicationSchema = z
	.object({
		version: z.number().int().min(0),
		status: z.enum(statuses).optional(),
		saved: z.boolean().optional(),
		follow_up: dateOnly.nullable().optional(),
		applied_at: z.iso.datetime().nullable().optional()
	})
	.strict();
export const interviewSchema = z
	.object({
		title: z.string().trim().min(2).max(160),
		starts_at: z.iso.datetime(),
		ends_at: z.iso.datetime(),
		timezone: timezoneSchema,
		state: z.enum(interviewStates).default('scheduled'),
		location: z.string().max(1000).default(''),
		notes: z.string().max(5000).default('')
	})
	.strict()
	.refine((v) => v.ends_at > v.starts_at, 'The end must be after the start.');
