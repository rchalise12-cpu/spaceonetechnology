<script lang="ts">
	import { focusDialog } from '$lib/focus';
	import { invalidateAll } from '$app/navigation';
	import {
		Plus,
		Upload,
		ArrowUpRight,
		X,
		Users,
		Download,
		Pencil,
		Search,
		Check
	} from '@lucide/svelte';
	import { api, date, downloadText, tags } from '$lib/client';
	import type { Job } from '$lib/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	let { data } = $props();
	let tab = $state('jobs');
	let edit = $state<Job | null | undefined>();
	let assign = $state<Job | null>(null);
	let selected = $state<string[]>([]);
	let error = $state('');
	let success = $state('');
	let busy = $state(false);
	let query = $state('');
	let importJobs = $state<unknown[] | null>(null);
	let importName = $state('');
	async function run(fn: () => Promise<unknown>, message: string) {
		busy = true;
		error = '';
		success = '';
		try {
			await fn();
			await invalidateAll();
			success = message;
			return true;
		} catch (e) {
			error = (e as Error).message;
			return false;
		} finally {
			busy = false;
		}
	}
	async function saveJob(event: SubmitEvent) {
		event.preventDefault();
		const f = new FormData(event.currentTarget as HTMLFormElement);
		const body = {
			...Object.fromEntries(f),
			...(edit?.id ? { id: edit.id } : {}),
			tags: String(f.get('tags'))
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean),
			active: f.get('active') === 'on',
			deadline: f.get('deadline') || null
		};
		if (await run(() => api('admin/jobs', 'POST', body), 'Job saved.')) edit = undefined;
	}
	async function readImport(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;
		error = '';
		try {
			if (file.size > 2 * 1024 * 1024) throw new Error('Use a JSON file smaller than 2 MB.');
			const parsed = JSON.parse(await file.text());
			const rows = Array.isArray(parsed) ? parsed : parsed.jobs;
			if (!Array.isArray(rows) || rows.length < 1 || rows.length > 100)
				throw new Error('Provide 1–100 jobs in an array or {"jobs": [...]} object.');
			importJobs = rows;
			importName = file.name;
		} catch (e) {
			error = (e as Error).message;
		}
		(event.target as HTMLInputElement).value = '';
	}
	async function saveAssignments() {
		if (!assign) return;
		if (
			await run(
				() => api('admin/assignments', 'POST', { job_id: assign!.id, user_ids: selected }),
				'Client assignments saved.'
			)
		)
			assign = null;
	}
	const example = [
		{
			id: 'your-stable-job-id',
			title: 'Senior Frontend Engineer',
			company: 'Your hiring partner',
			location: 'United States',
			workplace: 'Remote',
			employment_type: 'Full-time',
			salary: '$130,000–$160,000 / year',
			description: 'Describe the role and the team here.',
			requirements: 'Add the experience and skills needed.',
			application_url: 'https://example.com/careers/role',
			tags: ['TypeScript', 'React'],
			visibility: 'all',
			active: true,
			deadline: null
		}
	];
</script>

<svelte:head><title>Manage workspace · Space One</title></svelte:head>
<div class="page-heading">
	<div>
		<p class="eyebrow">THE RIGHT OPPORTUNITIES, THE RIGHT PEOPLE</p>
		<h1>Manage workspace<span class="heading-dot">.</span></h1>
		<p class="muted">Publish roles, assign clients, and see application progress.</p>
	</div>
	<button class="button primary" onclick={() => (edit = null)}><Plus size={17} />Add job</button>
</div>
{#if error}<p class="alert error" role="alert">{error}</p>{/if}{#if success}<p
		class="alert success"
		role="status"
	>
		<Check size={16} />{success}
	</p>{/if}
<div class="status-tabs standalone-tabs">
	{#each ['jobs', 'clients', 'applications', 'import'] as t}<button
			class:active={tab === t}
			onclick={() => (tab = t)}
			>{t[0].toUpperCase() + t.slice(1)}{#if t === 'jobs'}
				<span>{data.overview.jobs.length}</span>{/if}</button
		>{/each}
</div>
{#if tab === 'jobs'}<section class="panel">
		<div class="search-input admin-search">
			<Search size={17} /><input
				aria-label="Search managed jobs"
				bind:value={query}
				placeholder="Search your jobs…"
			/>
		</div>
		{#each data.overview.jobs.filter((j) => `${j.title} ${j.company}`
				.toLowerCase()
				.includes(query.toLowerCase())) as job}<div class="admin-job-row">
				<div>
					<strong>{job.title}</strong>
					<p>{job.company} · {job.workplace}</p>
					<small
						>{job.quality_state === 'needs_review'
							? 'Needs review'
							: job.active
								? 'Published'
								: 'Closed'} · {job.visibility === 'all'
							? 'All clients'
							: `${data.overview.assignments.filter((a) => a.job_id === job.id).length} assigned clients`}</small
					>
				</div>
				<button
					class="button secondary"
					onclick={() => {
						assign = job;
						selected = data.overview.assignments
							.filter((a) => a.job_id === job.id)
							.map((a) => a.user_id);
					}}><Users size={15} />Assign</button
				><button class="button secondary" onclick={() => (edit = job)}
					><Pencil size={15} />Edit</button
				>
			</div>{:else}<div class="empty-state">
				<Plus size={30} />
				<h3>Start with a great opportunity</h3>
				<p>Add your first job, or import your jobs from a JSON file.</p>
				<button class="button primary" onclick={() => (edit = null)}>Add a job</button>
			</div>{/each}
	</section>
{:else if tab === 'clients'}<section class="panel">
		{#each data.overview.users as user}<div class="admin-job-row">
				<div>
					<strong>{user.name}</strong>
					<p>{user.email}</p>
				</div>
				<span class="neutral-badge">{user.role}</span><small
					>{data.overview.applications.filter((a) => a.user_id === user.id).length} tracked jobs</small
				>
			</div>{/each}
	</section>
{:else if tab === 'applications'}<div class="panel table-panel">
		<table>
			<thead><tr><th>Client</th><th>Opportunity</th><th>Status</th><th>Updated</th></tr></thead
			><tbody
				>{#each data.overview.applications as item}<tr
						><td><strong>{item.name}</strong><small>{item.email}</small></td><td
							><strong>{item.title}</strong><small>{item.company}</small></td
						><td><StatusBadge status={item.status} /></td><td>{date(item.updated_at)}</td></tr
					>{:else}<tr
						><td colspan="4" class="small-empty-text"
							>Client progress appears here when they start tracking jobs.</td
						></tr
					>{/each}</tbody
			>
		</table>
	</div>
{:else}<section class="panel import-panel">
		<Upload size={30} strokeWidth={1.3} />
		<h2>Bring your opportunities over</h2>
		<p class="muted">
			<a class="inline-link" href="/imports"
				>Import scraped data with automatic normalization and review →</a
			>
		</p>
		<p class="muted">
			For standardized job updates, import up to 100 jobs at a time. Each job needs a stable ID.
			Reimporting an ID updates the listing and keeps client applications intact.
		</p>
		<button
			class="button secondary"
			onclick={() =>
				downloadText(
					'jobs-template.json',
					JSON.stringify({ jobs: example }, null, 2),
					'application/json'
				)}><Download size={16} />Download JSON template</button
		><label class="upload-box"
			><Upload size={24} /><strong>Choose your jobs JSON</strong><span>JSON · up to 2 MB</span
			><input type="file" accept=".json,application/json" onchange={readImport} /></label
		>{#if importJobs}<div class="import-preview">
				<strong>{importName}</strong>
				<p>{importJobs.length} jobs ready for validation and import.</p>
				<p class="form-footnote">
					Existing IDs will be updated. Jobs missing from this file will stay as they are. The
					entire batch is rejected if any entry is invalid.
				</p>
				<button
					class="button primary"
					disabled={busy}
					onclick={async () => {
						if (
							await run(
								() => api('admin/import', 'POST', { jobs: importJobs }),
								`${importJobs!.length} jobs imported.`
							)
						)
							importJobs = null;
					}}>{busy ? 'Importing…' : 'Validate & import jobs'}</button
				>
			</div>{/if}
	</section>{/if}
{#if edit !== undefined}<div class="modal-backdrop">
		<div
			use:focusDialog={() => (edit = undefined)}
			class="modal wide"
			role="dialog"
			aria-modal="true"
			aria-labelledby="job-form-title"
			tabindex="-1"
		>
			<div class="section-heading">
				<h2 id="job-form-title">{edit ? 'Edit job' : 'Add an opportunity'}</h2>
				<button class="icon-button" aria-label="Close job form" onclick={() => (edit = undefined)}
					><X size={20} /></button
				>
			</div>
			{#if error}<p class="alert error" role="alert">
					{error}
				</p>{/if}{#if edit?.quality_state === 'needs_review'}<div class="alert">
					Review the source, complete the missing details, and check Published when this listing is
					ready.{#each tags(edit.quality_warnings) as warning}<p class="text-sm mt-2 mb-0">
							{warning}
						</p>{/each}
				</div>{/if}
			<form onsubmit={saveJob}>
				<div class="form-grid">
					<label
						>Job title<input
							name="title"
							value={edit?.title || ''}
							required
							minlength="2"
							maxlength="160"
						/></label
					><label
						>Company<input
							name="company"
							value={edit?.company || ''}
							required
							maxlength="120"
						/></label
					><label
						>Location<input
							name="location"
							value={edit?.location || ''}
							required
							maxlength="160"
							placeholder="e.g. United States"
						/></label
					><label
						>Workplace<select name="workplace" value={edit?.workplace || 'Remote'}
							><option>Remote</option><option>Hybrid</option><option>On-site</option><option
								>Not specified</option
							></select
						></label
					><label
						>Employment type<select
							name="employment_type"
							value={edit?.employment_type || 'Full-time'}
							><option>Full-time</option><option>Part-time</option><option>Contract</option><option
								>Internship</option
							><option>Not specified</option></select
						></label
					><label
						>Compensation<input
							name="salary"
							value={edit?.salary || ''}
							maxlength="120"
							placeholder="e.g. $120,000–$150,000 / year"
						/></label
					>
				</div>
				<label
					>Application URL<input
						name="application_url"
						type="url"
						value={edit?.application_url || ''}
						required
						maxlength="2000"
					/></label
				><label
					>About the role<textarea
						name="description"
						rows="5"
						required
						minlength="10"
						maxlength="30000"
						value={edit?.description || ''}></textarea></label
				><label
					>Requirements<textarea
						name="requirements"
						rows="3"
						maxlength="15000"
						value={edit?.requirements || ''}></textarea></label
				><label
					>Skills / tags <span class="muted">(comma separated)</span><input
						name="tags"
						value={edit ? tags(edit.tags).join(', ') : ''}
					/></label
				>
				<div class="form-grid">
					<label
						>Visibility<select name="visibility" value={edit?.visibility || 'all'}
							><option value="all">All clients</option><option value="assigned"
								>Assigned clients only</option
							></select
						></label
					><label
						>Deadline <span class="muted">(optional)</span><input
							name="deadline"
							type="date"
							value={edit?.deadline || ''}
						/></label
					>
				</div>
				<label class="checkbox-row"
					><input type="checkbox" name="active" checked={edit ? !!edit.active : true} />Published
					and accepting applications</label
				><button class="button primary full" disabled={busy}
					>{busy ? 'Saving…' : 'Save opportunity'}</button
				>
			</form>
		</div>
	</div>{/if}
{#if assign}<div class="modal-backdrop">
		<div
			use:focusDialog={() => (assign = null)}
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="assign-title"
			tabindex="-1"
		>
			<div class="section-heading">
				<h2 id="assign-title">Assign clients</h2>
				<button class="icon-button" aria-label="Close assignments" onclick={() => (assign = null)}
					><X size={20} /></button
				>
			</div>
			<p>{assign.title} · {assign.company}</p>
			{#if assign.visibility === 'all'}<p class="alert">
					This job is visible to all clients. To restrict it, change visibility to “Assigned clients
					only” in the job editor.
				</p>{/if}{#if error}<p class="alert error" role="alert">{error}</p>{/if}
			<div class="assignment-list">
				{#each data.overview.users as user}<label class="checkbox-row"
						><input type="checkbox" value={user.id} bind:group={selected} /><span
							>{user.name}<small>{user.email}</small></span
						></label
					>{/each}
			</div>
			<button class="button primary full" disabled={busy} onclick={saveAssignments}
				>{busy ? 'Saving…' : `Save ${selected.length} assignments`}</button
			>
		</div>
	</div>{/if}
