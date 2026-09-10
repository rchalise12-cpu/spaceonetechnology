<script lang="ts">
	import { Search, ArrowUpRight, Download, Users } from '@lucide/svelte';
	import { date, initials, downloadText } from '$lib/client';
	let { data } = $props();
	let query = $state(''),
		sort = $state('applied'),
		accountFilter = $state('all'),
		limit = $state(25);
	let results = $derived(
		data.candidates
			.filter(
				(c) =>
					`${c.name} ${c.email} ${c.headline} ${c.skills} ${c.location}`
						.toLowerCase()
						.includes(query.toLowerCase()) &&
					(accountFilter === 'all' || c.account_status === accountFilter)
			)
			.sort((a, b) =>
				sort === 'name'
					? a.name.localeCompare(b.name)
					: sort === 'joined'
						? b.created_at.localeCompare(a.created_at)
						: sort === 'oldest'
							? a.created_at.localeCompare(b.created_at)
							: sort === 'activity'
								? (b.last_activity || '').localeCompare(a.last_activity || '')
								: Number(b[sort as 'applied' | 'interviews_completed' | 'offers' | 'overdue']) -
									Number(a[sort as 'applied' | 'interviews_completed' | 'offers' | 'overdue'])
			)
	);
	function exportCsv() {
		const cell = (v: unknown) =>
			'"' +
			String(v ?? '')
				.replace(/^[\s=+@-]/, "'$&")
				.replaceAll('"', '""') +
			'"';
		downloadText(
			'space-one-candidates.csv',
			[
				[
					'Name',
					'Email',
					'Phone',
					'Joined',
					'Applied',
					'Completed interviews',
					'Offers',
					'Overdue tasks'
				],
				...results.map((c) => [
					c.name,
					c.email,
					c.phone,
					c.created_at,
					c.applied,
					c.interviews_completed,
					c.offers,
					c.overdue
				])
			]
				.map((r) => r.map(cell).join(','))
				.join('\r\n')
		);
	}
</script>

<svelte:head><title>Candidates · Space One</title></svelte:head>
<div class="page-heading">
	<div>
		<p class="eyebrow">PEOPLE & PROGRESS</p>
		<h1>Candidates<span class="heading-dot">.</span></h1>
		<p class="muted">Know who is moving forward, and who could use a hand.</p>
	</div>
	<a class="button primary" href="/invitations">Invite a client <ArrowUpRight size={17} /></a>
</div>
<section class="panel">
	<div class="flex flex-wrap items-center gap-3 mb-6">
		<div class="search-input grow">
			<Search size={18} /><input
				aria-label="Search candidates"
				placeholder="Search name, skill, email, or location"
				bind:value={query}
			/>
		</div>
		<select class="w-auto" aria-label="Rank candidates" bind:value={sort}
			><option value="applied">Most applications</option><option value="interviews_completed"
				>Most completed interviews</option
			><option value="offers">Most offers</option><option value="joined">Recently joined</option
			><option value="oldest">Earliest joined</option><option value="activity"
				>Recent application activity</option
			><option value="overdue">Most overdue tasks</option><option value="name">Name A–Z</option
			></select
		><select class="w-auto" aria-label="Account status" bind:value={accountFilter}
			><option value="all">All accounts</option><option value="active">Active</option><option
				value="suspended">Suspended</option
			></select
		><button class="button secondary" onclick={exportCsv}><Download size={16} />Export</button>
	</div>
	<p class="text-sm text-muted">
		{results.length} candidates · Counts reflect recorded activity, including applications later rejected
		or withdrawn.
	</p>
	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm">
			<thead class="border-b border-line text-muted"
				><tr
					><th class="py-4 pr-4 font-medium">Candidate</th><th class="p-4 font-medium">Applied</th
					><th class="p-4 font-medium">Interviews done</th><th class="p-4 font-medium">Offers</th
					><th class="p-4 font-medium">Joined</th><th class="p-4 font-medium">Last update</th></tr
				></thead
			><tbody
				>{#each results.slice(0, limit) as c}<tr class="border-b border-line hover:bg-canvas"
						><td class="py-5 pr-4"
							><a class="flex items-center gap-3" href={`/candidates/${c.id}`}
								><span class="avatar shrink-0">{initials(c.name)}</span><span
									><strong class="block">{c.name}</strong><small class="text-muted"
										>{c.headline || c.email}</small
									>{#if c.account_status === 'suspended'}<small class="block text-rust"
											>Suspended</small
										>{/if}</span
								></a
							></td
						><td class="p-4 font-semibold">{c.applied}</td><td class="p-4"
							>{c.interviews_completed}</td
						><td class="p-4">{c.offers}</td><td class="p-4 whitespace-nowrap"
							>{date(c.created_at)}</td
						><td class="p-4 whitespace-nowrap">{date(c.last_activity)}</td></tr
					>{:else}<tr
						><td colspan="6" class="py-12 text-center text-muted"
							><Users class="mx-auto mb-3" />No candidates match this view.</td
						></tr
					>{/each}</tbody
			>
		</table>
	</div>
	{#if results.length > limit}<button class="button secondary mt-6" onclick={() => (limit += 25)}
			>Load more candidates</button
		>{/if}
</section>
