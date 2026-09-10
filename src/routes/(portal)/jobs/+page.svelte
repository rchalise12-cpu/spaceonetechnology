<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import {
		Search,
		SlidersHorizontal,
		ArrowUpRight,
		ArrowDownUp,
		Bookmark,
		MapPin,
		ArrowRight,
		CalendarDays,
		BriefcaseBusiness,
		Check,
		Clock3,
		X
	} from '@lucide/svelte';
	import { api, date, initials, tags } from '$lib/client';
	import { statuses, statusLabel, type Job } from '$lib/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	let { data } = $props();
	let query = $state(page.url.searchParams.get('q') || '');
	let status = $state(page.url.searchParams.get('status') || 'all');
	let sort = $state(page.url.searchParams.get('sort') || 'newest');
	let workplace = $state('all');
	let interviewFilter = $state('all');
	let savedOnly = $state(false);
	let publication = $state('all');
	let filters = $state(false);
	let error = $state('');
	let busy = $state('');
	let limit = $state(15);
	const interviewOrder = (value: string | null) =>
		value ? ['scheduled', 'completed', 'cancelled'].indexOf(value) : 3;
	const tabs = ['all', 'to_apply', 'applied', 'processing', 'interview', 'offer'];
	let results = $derived(
		data.jobs
			.filter(
				(j) =>
					(!query ||
						`${j.title} ${j.company} ${j.location} ${j.tags}`
							.toLowerCase()
							.includes(query.toLowerCase())) &&
					(status === 'all' || j.status === status) &&
					(workplace === 'all' || j.workplace === workplace) &&
					(interviewFilter === 'all' || j.interview_state === interviewFilter) &&
					(!savedOnly || !!j.saved) &&
					(publication === 'all' ||
						(publication === 'live'
							? j.active && j.quality_state === 'ready'
							: publication === 'review'
								? j.quality_state === 'needs_review'
								: !j.active))
			)
			.sort((a, b) =>
				sort === 'most_applied'
					? b.application_count - a.application_count
					: sort === 'least_applied'
						? a.application_count - b.application_count
						: sort === 'oldest'
							? a.created_at.localeCompare(b.created_at)
							: sort === 'posted'
								? (b.posted_at || '').localeCompare(a.posted_at || '')
								: sort === 'interview_state'
									? interviewOrder(a.interview_state) - interviewOrder(b.interview_state)
									: sort === 'status'
										? statuses.indexOf(a.status) - statuses.indexOf(b.status)
										: sort === 'company'
											? a.company.localeCompare(b.company)
											: sort === 'interview'
												? (a.next_interview || '9999').localeCompare(b.next_interview || '9999')
												: sort === 'follow_up'
													? (a.follow_up || '9999').localeCompare(b.follow_up || '9999')
													: sort === 'deadline'
														? (a.deadline || '9999').localeCompare(b.deadline || '9999')
														: b.created_at.localeCompare(a.created_at)
			)
	);
	let upcoming = $derived(
		data.interviews
			.filter((i) => i.state === 'scheduled' && new Date(i.ends_at) > new Date())
			.slice(0, 3)
	);
	let applied = $derived(data.jobs.filter((j) => !!j.applied_at).length);
	let due = $derived(
		data.jobs.filter(
			(j) =>
				j.follow_up &&
				j.follow_up <=
					new Intl.DateTimeFormat('en-CA', {
						timeZone: data.user.timezone,
						year: 'numeric',
						month: '2-digit',
						day: '2-digit'
					}).format(new Date()) &&
				!['rejected', 'withdrawn', 'offer'].includes(j.status)
		)
	);
	async function save(job: Job) {
		busy = job.id;
		try {
			await api(`jobs/${job.id}/application`, 'PATCH', { version: job.version, saved: !job.saved });
			await invalidateAll();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = '';
		}
	}
	function persist() {
		limit = 15;
		const p = new URLSearchParams();
		if (query) p.set('q', query);
		if (status !== 'all') p.set('status', status);
		if (sort !== 'newest') p.set('sort', sort);
		void goto(`/jobs${p.size ? '?' + p : ''}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}
</script>

<svelte:head><title>My opportunities · Space One</title></svelte:head>
<div class="page-heading">
	<div>
		<p class="eyebrow">YOUR NEXT CHAPTER</p>
		<h1>
			{data.user.role === 'client' ? 'My opportunities' : 'Job opportunities'}<span
				class="heading-dot">.</span
			>
		</h1>
		<p class="muted">A new role starts with a little momentum. Let’s keep yours going.</p>
	</div>
	<div class="date-chip">
		<CalendarDays size={16} />{new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			timeZone: data.user.timezone
		}).format(new Date())}
	</div>
</div>
<div class="stats-grid">
	<div class="stat">
		<div><span>Total opportunities</span><BriefcaseBusiness size={17} /></div>
		<strong>{String(data.jobs.length).padStart(2, '0')}</strong><small
			>Selected for your next move</small
		>
	</div>
	<div class="stat">
		<div><span>Applications sent</span><ArrowUpRight size={18} /></div>
		<strong>{String(applied).padStart(2, '0')}</strong><small
			>Every application is a step forward</small
		>
	</div>
	<div class="stat">
		<div><span>Upcoming interviews</span><CalendarDays size={17} /></div>
		<strong
			>{String(
				upcoming.length
					? data.interviews.filter(
							(i) => i.state === 'scheduled' && new Date(i.ends_at) > new Date()
						).length
					: 0
			).padStart(2, '0')}</strong
		><small
			>{upcoming[0]
				? `Next: ${date(upcoming[0].starts_at, data.user.timezone, true)}`
				: 'Room for your next conversation'}</small
		>
	</div>
	<div class="stat accent-stat">
		<div><span>Offers received</span><Check size={18} /></div>
		<strong>{String(data.jobs.filter((j) => j.status === 'offer').length).padStart(2, '0')}</strong
		><small>Good things are taking shape</small>
	</div>
</div>
{#if error}<p class="alert error" role="alert">{error}</p>{/if}
<div class="board-layout">
	<section class="jobs-board">
		<div class="section-heading">
			<h2>
				{data.user.role === 'client' ? 'Your job board' : 'All workspace jobs'}
				<span class="count">{data.jobs.length}</span>
			</h2>
			<button
				class:chosen={savedOnly}
				class="text-button"
				onclick={() => {
					savedOnly = !savedOnly;
					limit = 15;
				}}><Bookmark size={15} />Saved jobs</button
			>
		</div>
		<div class="status-tabs" role="group" aria-label="Application status">
			{#each tabs as tab}<button
					class:active={status === tab}
					onclick={() => {
						status = tab;
						persist();
					}}
					>{tab === 'all'
						? 'All jobs'
						: statusLabel[tab as keyof typeof statusLabel]}{#if tab === 'all'}<span
							>{data.jobs.length}</span
						>{/if}</button
				>{/each}
		</div>
		<div class="board-toolbar">
			<div class="search-input">
				<Search size={17} /><input
					aria-label="Search jobs"
					placeholder="Search role, company, or keyword…"
					bind:value={query}
					oninput={() => {
						limit = 15;
					}}
					onblur={persist}
				/>{#if query}<button
						class="icon-button"
						aria-label="Clear search"
						onclick={() => {
							query = '';
							persist();
						}}><X size={15} /></button
					>{/if}
			</div>
			<button
				class:chosen={filters}
				class="button secondary filter-button"
				onclick={() => (filters = !filters)}><SlidersHorizontal size={16} />Filters</button
			>
			<div class="sort-select">
				<ArrowDownUp size={15} /><select aria-label="Sort jobs" bind:value={sort} onchange={persist}
					><option value="newest">Recently added</option><option value="posted"
						>Recently posted</option
					><option value="oldest">Oldest first</option><option value="most_applied"
						>Most applied</option
					><option value="least_applied">Least applied / unapplied</option><option value="status"
						>Application status</option
					><option value="interview">Interview date</option><option value="interview_state"
						>Interview state</option
					><option value="follow_up">Follow-up date</option><option value="deadline"
						>Deadline</option
					><option value="company">Company A–Z</option></select
				>
			</div>
		</div>
		{#if filters}<div class="filter-panel">
				{#if data.user.role !== 'client'}<label
						>Publication<select bind:value={publication}
							><option value="all">All listings</option><option value="live">Live</option><option
								value="review">Needs review</option
							><option value="closed">Closed / draft</option></select
						></label
					>{/if}
				<label
					>Status<select bind:value={status} onchange={persist}
						><option value="all">All statuses</option>{#each statuses as value}<option {value}
								>{statusLabel[value]}</option
							>{/each}</select
					></label
				><label
					>Workplace<select bind:value={workplace}
						><option value="all">Any workplace</option><option>Remote</option><option>Hybrid</option
						><option>On-site</option></select
					></label
				><label
					>Interview state<select bind:value={interviewFilter}
						><option value="all">Any state</option><option value="scheduled">Scheduled</option
						><option value="completed">Completed</option><option value="cancelled">Cancelled</option
						></select
					></label
				>
			</div>{/if}
		<div class="list-caption">
			<span
				>{results.length}
				{results.length === 1 ? 'opportunity' : 'opportunities'}{query
					? ' matching your search'
					: ''}</span
			><span>YOUR PROGRESS</span>
		</div>
		<div class="job-list">
			{#each results.slice(0, limit) as job, index}<article class="job-row">
					<div class="company-mark tone-{index % 5}">{initials(job.company)}</div>
					<div class="job-summary">
						<a class="job-title" href={`/jobs/${job.id}`}>{job.title}</a>
						<div class="job-company">
							{job.company}<span>·</span><span>{job.employment_type}</span>
						</div>
						<div class="job-meta">
							<span><MapPin size={12} />{job.location}</span><span class="workplace"
								>{job.workplace}</span
							>{#if job.salary}<span>{job.salary}</span>{/if}
						</div>
						<div class="job-tags">
							{#each tags(job.tags).slice(0, 3) as tag}<span>{tag}</span
								>{/each}{#if !job.active}<span>Listing closed</span>{/if}
						</div>
					</div>
					<div class="job-progress">
						{#if data.user.role !== 'client'}<span class="text-sm font-semibold"
								>{job.application_count} applications</span
							><small
								>{job.quality_state === 'needs_review'
									? 'Needs review'
									: job.active
										? 'Published'
										: 'Closed'}</small
							>{:else}<StatusBadge status={job.status} />{/if}<small
							>{job.next_interview
								? date(job.next_interview, data.user.timezone, true)
								: job.follow_up
									? `Follow up ${date(job.follow_up)}`
									: `Added ${date(job.created_at)}`}</small
						>
						<div class="job-actions">
							<button
								class:saved={!!job.saved}
								class="icon-button"
								disabled={busy === job.id}
								aria-label={job.saved ? 'Unsave job' : 'Save job'}
								aria-pressed={!!job.saved}
								onclick={() => save(job)}
								><Bookmark size={17} fill={job.saved ? 'currentColor' : 'none'} /></button
							><a class="job-open" href={`/jobs/${job.id}`} aria-label={`Open ${job.title}`}
								><ArrowUpRight size={18} /></a
							>
						</div>
					</div>
				</article>{:else}<div class="empty-state">
					<BriefcaseBusiness size={32} strokeWidth={1.3} />
					<h3>
						{data.jobs.length ? 'No matching opportunities' : 'Your next chapter starts here'}
					</h3>
					<p>
						{data.jobs.length
							? 'Try a different search or clear your filters.'
							: 'Your team will share jobs here. Each one will have a place for your resume, updates, and interviews.'}
					</p>
					{#if data.jobs.length}<button
							class="button secondary"
							onclick={() => {
								query = '';
								status = 'all';
								workplace = 'all';
								interviewFilter = 'all';
								savedOnly = false;
								persist();
							}}>Clear filters</button
						>{:else if data.user.role !== 'client'}<a class="button primary" href="/admin"
							>Add your first job <ArrowRight size={16} /></a
						>{/if}
				</div>{/each}
		</div>
		{#if results.length > limit}<button
				class="button secondary full load-more"
				onclick={() => (limit += 15)}>Show more opportunities</button
			>{/if}
	</section>
	<aside class="board-aside">
		<section class="agenda-card">
			<div class="section-heading">
				<h3>Coming up</h3>
				<CalendarDays size={17} />
			</div>
			{#each upcoming as interview}<a class="agenda-item" href={`/jobs/${interview.job_id}`}
					><div class="calendar-square">
						<span
							>{new Intl.DateTimeFormat('en-US', {
								month: 'short',
								timeZone: data.user.timezone
							}).format(new Date(interview.starts_at))}</span
						><strong
							>{new Intl.DateTimeFormat('en-US', {
								day: '2-digit',
								timeZone: data.user.timezone
							}).format(new Date(interview.starts_at))}</strong
						>
					</div>
					<div>
						<strong>{interview.title}</strong>
						<p>{interview.company}</p>
						<small>{date(interview.starts_at, data.user.timezone, true)}</small>
					</div></a
				>{:else}<div class="small-empty">
					<Clock3 size={22} />
					<p>No interviews scheduled yet.</p>
					<small>Add a time from any job page when an invitation arrives.</small>
				</div>{/each}<a class="aside-link" href="/interviews"
				>View all interviews <ArrowRight size={15} /></a
			>
		</section>
		<section class="momentum-card">
			<span class="eyebrow">A SMALL REMINDER</span>
			<h3>Progress is a<br />practice.</h3>
			<p>Tailor your resume. Make the connection. Keep showing up.</p>
			<div class="momentum-art" aria-hidden="true">
				<span></span><span></span><span></span><ArrowUpRight size={34} strokeWidth={1.4} />
			</div>
		</section>
		{#if due.length}<section class="followup-card">
				<h3>Time to follow up <span class="count">{due.length}</span></h3>
				{#each due.slice(0, 4) as job}<a href={`/jobs/${job.id}`}
						><span>{job.company}<small>{date(job.follow_up)}</small></span><ArrowUpRight
							size={15}
						/></a
					>{/each}
			</section>{/if}
		<p class="aside-footnote">
			Your application details are shared<br />with your Space One support team.
		</p>
	</aside>
</div>
