<script lang="ts">
	import { ArrowUpRight, CalendarDays, ArrowRight, Users, BriefcaseBusiness } from '@lucide/svelte';
	import { date, initials } from '$lib/client';
	import TaskList from '$lib/components/TaskList.svelte';
	let { data } = $props();
	let client = $derived(data.user.role === 'client');
	let upcoming = $derived(
		data.interviews.filter((i) => i.state === 'scheduled' && new Date(i.ends_at) > new Date())
	);
	let applied = $derived(data.jobs.filter((j) => j.applied_at).length);
</script>

<svelte:head><title>Dashboard · Space One</title></svelte:head>
<div class="page-heading">
	<div>
		<p class="eyebrow">{client ? 'YOUR NEXT CHAPTER' : 'WORKSPACE OVERVIEW'}</p>
		<h1>Welcome, {data.user.name.split(' ')[0]}<span class="heading-dot">.</span></h1>
		<p class="muted">
			{client
				? 'A clear view of your search. A good place to move it forward.'
				: 'The people, opportunities, and next steps that need your attention.'}
		</p>
	</div>
	<a class="button primary" href={client ? '/jobs' : '/invitations'}
		>{client ? 'Explore opportunities' : 'Invite someone'}<ArrowUpRight size={17} /></a
	>
</div>
<div class="stats-grid">
	{#each client ? [['Opportunities', data.jobs.length, 'Roles to explore'], ['Applications sent', applied, 'Your recorded submissions'], ['Upcoming interviews', upcoming.length, 'Conversations ahead'], ['Offers', data.jobs.filter((j) => j.status === 'offer').length, 'New possibilities']] : [['Candidates', data.stats?.candidates || 0, 'People in your workspace'], ['Applications sent', data.stats?.applied || 0, 'Across all clients'], ['Interviews completed', data.stats?.interviews || 0, 'Recorded conversations'], ['Live jobs', data.stats?.jobs || 0, 'Open opportunities']] as stat, i}<div
			class="stat"
			class:accent-stat={i === 3}
		>
			<div><span>{stat[0]}</span><ArrowUpRight size={17} /></div>
			<strong>{stat[1]}</strong><small>{stat[2]}</small>
		</div>{/each}
</div>
<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
	<div>
		{#if !client}<section class="panel">
				<div class="section-heading">
					<h2>Candidate momentum</h2>
					<a class="text-button" href="/candidates">All candidates <ArrowRight size={15} /></a>
				</div>
				{#each [...data.candidates].sort((a, b) => b.applied - a.applied).slice(0, 5) as c}<a
						class="flex items-center gap-4 py-5 border-b border-line [&>span:nth-child(2)]:grow [&_small]:block [&_small]:text-muted"
						href={`/candidates/${c.id}`}
						><span class="avatar">{initials(c.name)}</span><span
							><strong>{c.name}</strong><small>{c.headline || c.email}</small></span
						><span class="text-right shrink-0"
							><strong>{c.applied}</strong><small>applied</small></span
						><ArrowUpRight size={16} /></a
					>{:else}<div class="small-empty">
						<Users size={25} />
						<p>Your candidate workspace starts with an invitation.</p>
						<a class="inline-link" href="/invitations">Invite your first client</a>
					</div>{/each}
			</section>{:else}<section class="panel">
				<div class="section-heading">
					<h2>Pick up where you left off</h2>
					<a class="text-button" href="/jobs">All jobs <ArrowRight size={15} /></a>
				</div>
				{#each data.jobs
					.filter((j) => j.saved || j.follow_up || j.status === 'to_apply')
					.slice(0, 4) as job}<a
						class="flex items-center gap-4 py-5 border-b border-line [&>span:nth-child(2)]:grow [&_small]:block [&_small]:text-muted"
						href={`/jobs/${job.id}`}
						><span class="company-mark tone-1">{initials(job.company)}</span><span
							><strong>{job.title}</strong><small>{job.company} · {job.location}</small></span
						><ArrowUpRight size={18} /></a
					>{:else}<div class="small-empty">
						<BriefcaseBusiness size={25} />
						<p>
							Your team will share opportunities here. In the meantime, complete your profile and
							add a resume.
						</p>
						<a class="inline-link" href="/settings">Complete your profile</a>
					</div>{/each}
			</section>{/if}
		<TaskList items={data.tasks} />
	</div>
	<aside>
		{#if !client}<section class="agenda-card">
				<h2>Needs attention</h2>
				{#each [['/imports', 'Jobs awaiting review', data.stats?.held], ['/invitations', 'Pending invitations', data.stats?.pending], ['/inquiries', 'New inquiries', data.stats?.inquiries]] as item}<a
						class="flex items-center gap-3 py-5 border-b border-line [&>span]:grow"
						href={String(item[0])}
						><span>{item[1]}</span><strong>{item[2] || 0}</strong><ArrowUpRight size={16} /></a
					>{/each}
			</section>{/if}
		<section class="agenda-card">
			<div class="section-heading">
				<h2>Your calendar</h2>
				<CalendarDays size={18} />
			</div>
			{#each upcoming.slice(0, 4) as i}<a class="agenda-item" href={`/jobs/${i.job_id}`}
					><span
						><strong>{i.title}</strong>
						<p>{i.company}</p>
						<small>{date(i.starts_at, data.user.timezone, true)}</small></span
					></a
				>{:else}<p class="small-empty-text">No upcoming interviews in your calendar.</p>{/each}<a
				class="aside-link"
				href="/interviews">Open calendar <ArrowRight size={15} /></a
			>
		</section>
		<section class="momentum-card">
			<p class="eyebrow">KEEP IT MOVING</p>
			<h3>A little preparation.<br />A better next step.</h3>
			<p>
				Keep your profile current, save the resume you send, and give every conversation a
				follow-up.
			</p>
			<a class="text-button" href="/resources/candidate-roadmap"
				>Your preparation guide <ArrowUpRight size={16} /></a
			>
		</section>
	</aside>
</div>
