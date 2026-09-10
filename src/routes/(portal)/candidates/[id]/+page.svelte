<script lang="ts">
	import { ArrowLeft, ArrowUpRight, FileText } from '@lucide/svelte';
	import { date, tags } from '$lib/client';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	let { data } = $props();
	let sort = $state('updated');
	let apps = $derived(
		[...data.applications].sort((a, b) =>
			sort === 'status'
				? a.status.localeCompare(b.status)
				: sort === 'company'
					? a.company.localeCompare(b.company)
					: b.updated_at.localeCompare(a.updated_at)
		)
	);
</script>

<svelte:head><title>{data.candidate.name} · Candidates · Space One</title></svelte:head>
<a class="back-link" href="/candidates"><ArrowLeft size={16} />All candidates</a>
<div class="page-heading">
	<div>
		<p class="eyebrow">CANDIDATE WORKSPACE</p>
		<h1>{data.candidate.name}<span class="heading-dot">.</span></h1>
		<p class="muted">{data.candidate.headline || 'Building their next chapter.'}</p>
	</div>
	<span class="date-chip">Joined {date(data.candidate.created_at)}</span>
</div>
<div class="stats-grid">
	{#each [['Applications sent', data.candidate.applied], ['Interviews completed', data.candidate.interviews_completed], ['Scheduled interviews', data.candidate.interviews_scheduled], ['Offers received', data.candidate.offers]] as stat}<div
			class="stat"
		>
			<span>{stat[0]}</span><strong>{stat[1]}</strong>
		</div>{/each}
</div>
<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
	<div class="space-y-6">
		<section class="panel">
			<div class="section-heading">
				<h2>Application history</h2>
				<select class="w-auto" aria-label="Sort applications" bind:value={sort}
					><option value="updated">Latest update</option><option value="status">Status</option
					><option value="company">Company</option></select
				>
			</div>
			{#each apps as app}<a
					class="flex flex-wrap items-center gap-4 border-b border-line py-5"
					href={`/jobs/${app.job_id}?candidate=${data.candidate.id}`}
					><span class="grow"
						><strong class="block">{app.title}</strong><small class="text-muted"
							>{app.company} · Updated {date(app.updated_at)}</small
						></span
					><StatusBadge status={app.status} /><ArrowUpRight size={17} /></a
				>{:else}<p class="small-empty-text">
					No application activity yet. Assign a job to help this candidate get started.
				</p>{/each}
		</section>
		<TaskList items={data.tasks} candidate={data.candidate.id} />
		<section class="panel">
			<h2>Interviews</h2>
			{#each data.interviews as i}<a
					class="block border-b border-line py-4"
					href={`/jobs/${i.job_id}?candidate=${data.candidate.id}`}
					><strong>{i.title}</strong>
					<p class="text-sm text-muted mb-0">
						{i.company} · {date(i.starts_at, data.user.timezone, true)} · {i.state}
					</p></a
				>{:else}<p class="small-empty-text">No interviews recorded.</p>{/each}
		</section>
	</div>
	<aside class="space-y-6">
		<section class="panel">
			<h2>Profile</h2>
			<dl class="space-y-4 text-sm">
				<div>
					<dt class="text-muted">Email</dt>
					<dd>
						<a class="inline-link break-all" href={`mailto:${data.candidate.email}`}
							>{data.candidate.email}</a
						>
					</dd>
				</div>
				<div>
					<dt class="text-muted">Phone</dt>
					<dd>{data.candidate.phone || 'Not provided'}</dd>
				</div>
				<div>
					<dt class="text-muted">Location</dt>
					<dd>{data.candidate.location || 'Not provided'}</dd>
				</div>
				<div>
					<dt class="text-muted">Timezone</dt>
					<dd>{data.candidate.timezone}</dd>
				</div>
			</dl>
			<p class="mt-5 whitespace-pre-line text-sm">{data.candidate.bio}</p>
			<div class="job-tags">
				{#each tags(data.candidate.skills) as skill}<span>{skill}</span>{/each}
			</div>
		</section>
		<section class="panel">
			<h2>Resume library</h2>
			{#each data.files as f}<a
					class="flex gap-3 items-center py-3 border-b border-line text-sm break-all"
					href={`/api/profile-files/${f.id}`}
					><FileText size={20} />{f.name}<ArrowUpRight size={16} /></a
				>{:else}<p class="small-empty-text">
					This candidate has not added a profile resume.
				</p>{/each}
		</section>
		<section class="panel">
			<div class="section-heading">
				<h2>Assigned jobs</h2>
				<a class="text-button" href="/admin">Manage ↗</a>
			</div>
			{#each data.assigned as job}<a
					class="block py-3 border-b border-line text-sm"
					href={`/jobs/${job.id}?candidate=${data.candidate.id}`}
					><strong>{job.title}</strong><small class="block text-muted">{job.company}</small></a
				>{:else}<p class="small-empty-text">
					No individual assignments. Jobs shared with all clients are also available.
				</p>{/each}
		</section>
	</aside>
</div>
