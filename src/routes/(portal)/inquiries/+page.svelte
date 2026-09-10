<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api, date } from '$lib/client';
	let { data } = $props();
	let status = $state('new'),
		error = $state(''),
		busy = $state('');
	async function update(id: string, value: string) {
		busy = id;
		error = '';
		try {
			await api(`inquiries/${id}`, 'PATCH', { status: value });
			await invalidateAll();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = '';
		}
	}
</script>

<svelte:head><title>Inquiries · Space One</title></svelte:head>
<div class="page-heading">
	<div>
		<p class="eyebrow">NEW CONVERSATIONS</p>
		<h1>Website inquiries<span class="heading-dot">.</span></h1>
		<p class="muted">Every message from your public contact page, ready for a thoughtful reply.</p>
	</div>
	<select class="w-auto" aria-label="Filter inquiries" bind:value={status}
		><option value="all">All inquiries</option><option value="new">New</option><option
			value="in_progress">In progress</option
		><option value="closed">Closed</option></select
	>
</div>
{#if error}<p class="alert error" role="alert">{error}</p>{/if}
<div class="space-y-5">
	{#each data.inquiries.filter((i) => status === 'all' || i.status === status) as inquiry}<article
			class="panel"
		>
			<div class="flex flex-wrap justify-between items-start gap-4">
				<div>
					<p class="eyebrow">{inquiry.interest}</p>
					<h2>{inquiry.name}{inquiry.company ? ` · ${inquiry.company}` : ''}</h2>
					<a class="inline-link text-sm" href={`mailto:${inquiry.email}`}>{inquiry.email}</a><small
						class="block text-muted mt-2"
						>{date(inquiry.created_at, data.user.timezone, true)}</small
					>
				</div>
				<select
					class="w-auto"
					aria-label={`Status for ${inquiry.name}`}
					value={inquiry.status}
					disabled={busy === inquiry.id}
					onchange={(e) => update(inquiry.id, e.currentTarget.value)}
					><option value="new">New</option><option value="in_progress">In progress</option><option
						value="closed">Closed</option
					></select
				>
			</div>
			<p class="whitespace-pre-line leading-7 mt-6 mb-0">{inquiry.message}</p>
		</article>{:else}<div class="panel py-14 text-center text-muted">
			No inquiries in this view.
		</div>{/each}
</div>
