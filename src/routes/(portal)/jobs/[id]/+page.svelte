<script lang="ts">
	import { goto } from '$app/navigation';
	import TaskList from '$lib/components/TaskList.svelte';
	import { invalidateAll } from '$app/navigation';
	import {
		ArrowLeft,
		ArrowUpRight,
		Bookmark,
		MapPin,
		BriefcaseBusiness,
		Clock3,
		CalendarDays,
		Plus,
		FileText,
		Image,
		Download,
		Trash2,
		Check,
		Paperclip,
		Pencil,
		ExternalLink
	} from '@lucide/svelte';
	import { api as baseApi, date, initials, tags, fileSize } from '$lib/client';
	import { statuses, statusLabel, type Status } from '$lib/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import InterviewForm from '$lib/components/InterviewForm.svelte';
	let { data } = $props();
	let suffix = $derived(data.candidate ? `?candidate=${data.candidate}` : '');
	const api = (path: string, method = 'GET', body?: unknown) =>
		baseApi(path + suffix, method, body);
	let tab = $state('overview');
	let busy = $state('');
	let error = $state('');
	let success = $state('');
	let schedule = $state(false);
	let editing = $state<(typeof data.interviews)[number] | undefined>();
	let deleting = $state('');
	async function action(key: string, fn: () => Promise<unknown>, message = 'Saved.') {
		busy = key;
		error = '';
		success = '';
		try {
			await fn();
			await invalidateAll();
			success = message;
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = '';
		}
	}
	async function update(fields: Record<string, unknown>) {
		await action(
			'status',
			() =>
				api(`jobs/${data.job.id}/application`, 'PATCH', { version: data.job.version, ...fields }),
			'Application updated.'
		);
	}
	async function note(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		await action(
			'note',
			() => api(`jobs/${data.job.id}/notes`, 'POST', { body: new FormData(form).get('body') }),
			'Note added.'
		);
		if (!error) form.reset();
	}
	async function upload(event: Event, kind: 'resume' | 'proof') {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const body = new FormData();
		body.set('file', file);
		body.set('kind', kind);
		await action(kind, () => api(`jobs/${data.job.id}/files`, 'POST', body), 'File uploaded.');
		input.value = '';
	}
	const isUrl = (v: string) => /^https?:\/\//i.test(v);
</script>

<svelte:head><title>{data.job.title} at {data.job.company} · Space One</title></svelte:head>
<a class="back-link" href="/jobs"><ArrowLeft size={16} />All opportunities</a>
{#if data.user.role !== 'client'}<div class="panel mb-6 flex flex-wrap items-end gap-4">
		<label class="grow mb-0"
			>View application for a candidate<select
				value={data.candidate || ''}
				onchange={(e) =>
					goto(
						`/jobs/${data.job.id}${e.currentTarget.value ? '?candidate=' + e.currentTarget.value : ''}`
					)}
				><option value="">My workspace</option>{#each data.candidates as c}<option value={c.id}
						>{c.name} · {c.email}</option
					>{/each}</select
			></label
		><a class="button secondary" href="/admin">Edit listing ↗</a>
	</div>{/if}
{#if data.job.quality_state === 'needs_review'}<p class="alert">
		This listing is held for review. Complete and verify its required details in Manage jobs before
		publishing.
	</p>{/if}
<div class="detail-heading">
	<div class="company-mark large tone-0">{initials(data.job.company)}</div>
	<div>
		<p class="eyebrow">{data.job.company}</p>
		<h1>{data.job.title}</h1>
		<div class="detail-meta">
			<span><MapPin size={15} />{data.job.location}</span><span
				><BriefcaseBusiness size={15} />{data.job.employment_type}</span
			><span>{data.job.workplace}</span>
		</div>
	</div>
	<button
		class:chosen={!!data.job.saved}
		class="button secondary"
		disabled={busy === 'status'}
		onclick={() => update({ saved: !data.job.saved })}
		><Bookmark size={16} fill={data.job.saved ? 'currentColor' : 'none'} />{data.job.saved
			? 'Saved'
			: 'Save job'}</button
	>
</div>
{#if error}<p class="alert error" role="alert">{error}</p>{/if}{#if success}<p
		class="alert success"
		role="status"
	>
		<Check size={16} />{success}
	</p>{/if}
{#if !data.job.active}<p class="alert">
		This listing has closed. Your application history and documents are still available.
	</p>{/if}
<div class="detail-layout">
	<section>
		<div class="detail-tabs" role="group" aria-label="Job page section">
			{#each [{ id: 'overview', label: 'Job overview' }, { id: 'documents', label: 'Documents', count: data.attachments.length }, { id: 'activity', label: 'Activity & notes', count: data.activity.length }] as t}<button
					class:active={tab === t.id}
					onclick={() => (tab = t.id)}
					>{t.label}{#if t.count}<span class="count">{t.count}</span>{/if}</button
				>{/each}
		</div>
		{#if tab === 'overview'}<article class="panel description-panel">
				<div class="job-tags">
					{#each tags(data.job.tags) as tag}<span>{tag}</span>{/each}
				</div>
				<h2>About the role</h2>
				<div class="prose-text">{data.job.description}</div>
				{#if data.job.requirements}<h2>What you’ll bring</h2>
					<div class="prose-text">{data.job.requirements}</div>{/if}
				{#if data.job.company_description}<h2>About the company</h2>
					<p class="prose-text">{data.job.company_description}</p>{/if}
				<div class="role-facts">
					<div><span>Source</span><strong>{data.job.source}</strong></div>
					<div><span>Posted</span><strong>{date(data.job.posted_at)}</strong></div>
					<div>
						<span>Experience level</span><strong
							>{data.job.experience_level || 'Not specified'}</strong
						>
					</div>
					<div><span>Compensation</span><strong>{data.job.salary || 'Not provided'}</strong></div>
					<div><span>Workplace</span><strong>{data.job.workplace}</strong></div>
					<div><span>Application deadline</span><strong>{date(data.job.deadline)}</strong></div>
				</div>
			</article>
		{:else if tab === 'documents'}<div class="panel">
				<div class="section-heading">
					<h2>Your documents</h2>
					<Paperclip size={18} />
				</div>
				<p class="muted">
					Keep a copy of exactly what you sent. New resumes are saved as separate versions.
				</p>
				{#if data.profileFiles.length}<form
						class="flex flex-wrap items-end gap-3 my-6"
						onsubmit={async (e) => {
							e.preventDefault();
							await action(
								'library',
								() =>
									api(`jobs/${data.job.id}/resume`, 'POST', {
										file_id: new FormData(e.currentTarget as HTMLFormElement).get('file_id')
									}),
								'A copy of your resume was added to this job.'
							);
						}}
					>
						<label class="grow mb-0"
							>Use a saved resume<select name="file_id"
								>{#each data.profileFiles as file}<option value={file.id}>{file.name}</option
									>{/each}</select
							></label
						><button class="button secondary" disabled={!!busy}>Add a copy</button>
					</form>{/if}
				<div class="upload-grid">
					<label class="upload-box"
						><FileText size={25} strokeWidth={1.5} /><strong
							>{busy === 'resume' ? 'Uploading…' : 'Upload resume'}</strong
						><span>PDF · up to 10 MB</span><input
							type="file"
							accept="application/pdf,.pdf"
							disabled={!!busy}
							onchange={(e) => upload(e, 'resume')}
						/></label
					><label class="upload-box"
						><Image size={25} strokeWidth={1.5} /><strong
							>{busy === 'proof' ? 'Uploading…' : 'Add application proof'}</strong
						><span>PNG, JPEG, WebP · up to 10 MB</span><input
							type="file"
							accept="image/png,image/jpeg,image/webp"
							disabled={!!busy}
							onchange={(e) => upload(e, 'proof')}
						/></label
					>
				</div>
				{#each ['resume', 'proof'] as kind}<h3 class="file-section-title">
						{kind === 'resume' ? 'Resume history' : 'Proof of application'}
					</h3>
					{#each data.attachments.filter((f) => f.kind === kind) as file, index}<div
							class="file-row"
						>
							<div class="file-icon">
								{#if kind === 'resume'}<FileText size={21} />{:else}<Image size={21} />{/if}
							</div>
							<div class="file-info">
								<strong>{file.name}</strong><small
									>{fileSize(file.size)} · {date(
										file.created_at,
										data.user.timezone,
										true
									)}{kind === 'resume' && index === 0 ? ' · Latest version' : ''}</small
								>
							</div>
							<a
								class="icon-button"
								href={`/api/files/${file.id}`}
								aria-label={`Download ${file.name}`}><Download size={17} /></a
							>{#if deleting === file.id}<button
									class="text-button danger"
									disabled={!!busy}
									onclick={() =>
										action('delete', () => api(`files/${file.id}`, 'DELETE'), 'File removed.')}
									>Remove</button
								><button class="text-button" onclick={() => (deleting = '')}>Cancel</button
								>{:else}<button
									class="icon-button"
									aria-label={`Remove ${file.name}`}
									onclick={() => (deleting = file.id)}><Trash2 size={16} /></button
								>{/if}
						</div>{:else}<p class="small-empty-text">
							{kind === 'resume'
								? 'No resumes yet. Upload your tailored resume here.'
								: 'No proof yet. Add a screenshot after submitting your application.'}
						</p>{/each}{/each}
			</div>
		{:else}<div class="panel">
				<h2>Activity & notes</h2>
				<form class="note-form" onsubmit={note}>
					<label class="sr-only" for="note">Application note</label><textarea
						id="note"
						name="body"
						rows="3"
						required
						maxlength="5000"
						placeholder="Add an update, a recruiter’s details, or something to remember…"
					></textarea><button class="button primary" disabled={busy === 'note'}
						><Plus size={16} />{busy === 'note' ? 'Adding…' : 'Add note'}</button
					>
				</form>
				<div class="timeline">
					{#each data.activity as event}<div class="timeline-event">
							<span class="timeline-dot"></span>
							<div>
								<small>{date(event.created_at, data.user.timezone, true)} · {event.kind}</small>
								<p>{event.body}</p>
							</div>
						</div>{:else}<p class="small-empty-text">
							Your updates will appear here as you make progress.
						</p>{/each}
				</div>
			</div>{/if}
		<section class="panel mt-6">
			<div class="section-heading">
				<h2>Conversation</h2>
				<span class="text-xs text-muted">Shared with your Space One team</span>
			</div>
			{#each data.comments as comment}<div class="py-4 border-b border-line">
					<strong class="text-sm">{comment.author}</strong><small class="ml-2 text-muted"
						>{comment.role} · {date(comment.created_at, data.user.timezone, true)}</small
					>
					<p class="whitespace-pre-line text-sm mt-2 mb-0">{comment.body}</p>
					{#if comment.author_id === data.user.id}<button
							class="text-button mt-2"
							disabled={!!busy}
							onclick={() =>
								action(
									'comment',
									() => api(`comments/${comment.id}`, 'DELETE'),
									'Comment removed.'
								)}>Remove</button
						>{/if}
				</div>{:else}<p class="small-empty-text">
					Ask a question, share a recruiter update, or leave context for your coordinator.
				</p>{/each}
			<form
				class="mt-5"
				onsubmit={async (e) => {
					e.preventDefault();
					const form = e.currentTarget as HTMLFormElement;
					await action(
						'comment',
						() =>
							api(`jobs/${data.job.id}/comments`, 'POST', { body: new FormData(form).get('body') }),
						'Comment added.'
					);
					if (!error) form.reset();
				}}
			>
				<label>Message<textarea name="body" required maxlength="5000" rows="3"></textarea></label
				><button class="button primary" disabled={!!busy}>Post comment</button>
			</form>
		</section>
		<div class="mt-6">
			<TaskList items={data.tasks} jobId={data.job.id} candidate={data.candidate} />
		</div>
		<section class="panel interview-panel">
			<div class="section-heading">
				<h2>Interviews <span class="count">{data.interviews.length}</span></h2>
				<button
					class="text-button"
					onclick={() => {
						editing = undefined;
						schedule = true;
					}}><Plus size={16} />Add interview</button
				>
			</div>
			{#each data.interviews as item}<div class="detail-interview">
					<CalendarDays size={23} />
					<div>
						<strong>{item.title}</strong>
						<p>
							{date(item.starts_at, data.user.timezone, true)} – {new Intl.DateTimeFormat('en-US', {
								hour: 'numeric',
								minute: '2-digit',
								timeZone: data.user.timezone
							}).format(new Date(item.ends_at))}
						</p>
						<small>{data.user.timezone} · {item.state}</small>{#if item.location}<p>
								{#if isUrl(item.location)}<a
										class="inline-link"
										href={item.location}
										target="_blank"
										rel="noopener noreferrer">Join meeting <ExternalLink size={12} /></a
									>{:else}{item.location}{/if}
							</p>{/if}{#if item.notes}<p class="interview-notes">{item.notes}</p>{/if}
					</div>
					<div class="interview-actions">
						<a
							class="icon-button"
							href={`/api/interviews/${item.id}/calendar`}
							aria-label="Download calendar event"><Download size={16} /></a
						><button
							class="icon-button"
							aria-label="Edit interview"
							onclick={() => {
								editing = item;
								schedule = true;
							}}><Pencil size={16} /></button
						>{#if deleting === item.id}<button
								class="text-button danger"
								disabled={!!busy}
								onclick={() =>
									action(
										'delete',
										() => api(`interviews/${item.id}`, 'DELETE'),
										'Interview removed.'
									)}>Remove</button
							><button class="text-button" onclick={() => (deleting = '')}>Cancel</button
							>{:else}<button
								class="icon-button"
								aria-label="Remove interview"
								onclick={() => (deleting = item.id)}><Trash2 size={16} /></button
							>{/if}
					</div>
				</div>{:else}<div class="inline-empty">
					<CalendarDays size={25} />
					<div>
						<strong>Got an invitation?</strong>
						<p>Add the time, meeting link, and anything you need to prepare.</p>
					</div>
				</div>{/each}
		</section>
	</section>
	<aside class="detail-aside">
		<section class="application-card">
			<div class="section-heading">
				<h3>{data.candidate ? 'Candidate application' : 'Your application'}</h3>
				<StatusBadge status={data.job.status} />
			</div>
			<label
				>Application status<select
					value={data.job.status}
					disabled={busy === 'status'}
					onchange={(e) => update({ status: e.currentTarget.value as Status })}
					>{#each statuses as s}<option value={s}>{statusLabel[s]}</option>{/each}</select
				></label
			><label
				>Follow up on<input
					type="date"
					value={data.job.follow_up || ''}
					disabled={busy === 'status'}
					onchange={(e) => update({ follow_up: e.currentTarget.value || null })}
				/></label
			><label
				>Applied on<input
					type="date"
					value={data.job.applied_at?.slice(0, 10) || ''}
					disabled={busy === 'status'}
					onchange={(e) =>
						update({
							applied_at: e.currentTarget.value ? `${e.currentTarget.value}T12:00:00.000Z` : null
						})}
				/></label
			>
			<div class="apply-divider"></div>
			<a
				class="button primary full"
				href={data.job.application_url}
				target="_blank"
				rel="noopener noreferrer">Open application site <ArrowUpRight size={17} /></a
			>
			<p class="form-footnote">
				Opens the employer’s site. After applying, update your status and save a screenshot here.
			</p>
		</section>
		<section class="checklist-card">
			<h3>Before you hit submit</h3>
			<p>
				<span class:done={data.attachments.some((f) => f.kind === 'resume')}
					><Check size={12} /></span
				>Tailor and upload your resume
			</p>
			<p>
				<span class:done={!!data.job.applied_at}><Check size={12} /></span>Apply on the employer’s
				website
			</p>
			<p>
				<span class:done={data.attachments.some((f) => f.kind === 'proof')}
					><Check size={12} /></span
				>Save your confirmation screenshot
			</p>
			<button class="text-button" onclick={() => (tab = 'documents')}
				>Manage documents <ArrowUpRight size={14} /></button
			>
		</section>
	</aside>
</div>
{#if schedule}<InterviewForm
		jobId={data.job.id}
		candidate={data.candidate}
		timezone={data.user.timezone}
		item={editing}
		onclose={() => (schedule = false)}
	/>{/if}
