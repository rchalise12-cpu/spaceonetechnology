<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api, date } from '$lib/client';
	let { data } = $props();
	let error = $state(''),
		success = $state(''),
		busy = $state(false),
		query = $state(''),
		confirm = $state('');
	async function save(e: SubmitEvent, id: string) {
		e.preventDefault();
		if (confirm !== id) {
			confirm = id;
			return;
		}
		busy = true;
		error = '';
		try {
			await api(
				`team/${id}`,
				'PATCH',
				Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement))
			);
			await invalidateAll();
			success = 'Access updated. The user will sign in again with their new permissions.';
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = false;
			confirm = '';
		}
	}
</script>

<svelte:head><title>Team & access · Space One</title></svelte:head>
<div class="page-heading">
	<div>
		<p class="eyebrow">ADMINISTRATION</p>
		<h1>The right access<span class="heading-dot">.</span></h1>
		<p class="muted">Manage workspace roles and account availability.</p>
	</div>
	<a class="button primary" href="/invitations">Invite staff ↗</a>
</div>
{#if error}<p class="alert error" role="alert">{error}</p>{/if}{#if success}<p
		class="alert success"
		role="status"
	>
		{success}
	</p>{/if}
<section class="panel">
	<label>Find a person<input bind:value={query} placeholder="Name or email" /></label
	>{#each data.users.filter((u) => `${u.name} ${u.email}`
			.toLowerCase()
			.includes(query.toLowerCase())) as user}<form
			class="flex flex-wrap items-end gap-4 py-5 border-b border-line"
			onsubmit={(e) => save(e, user.id)}
		>
			<div class="grow self-center">
				<strong>{user.name}{user.id === data.user.id ? ' (you)' : ''}</strong><small
					class="block text-muted break-all">{user.email}</small
				>
			</div>
			<label class="mb-0"
				>Role<select name="role" value={user.role} disabled={user.id === data.user.id}
					><option value="client">Client</option><option value="staff">Staff</option><option
						value="admin">Admin</option
					></select
				></label
			><label class="mb-0"
				>Account<select
					name="account_status"
					value={user.account_status}
					disabled={user.id === data.user.id}
					><option value="active">Active</option><option value="suspended">Suspended</option
					></select
				></label
			><button class="button secondary" disabled={busy || user.id === data.user.id}
				>{confirm === user.id ? 'Confirm change' : 'Save access'}</button
			>{#if confirm === user.id}<button
					type="button"
					class="text-button"
					onclick={() => (confirm = '')}>Cancel</button
				>{/if}
		</form>{/each}
</section>
<section class="panel mt-6">
	<h2>Recent administrative activity</h2>
	{#each data.audit as entry}<div class="py-3 border-b border-line text-sm">
			<strong>{entry.action.replaceAll('.', ' / ')}</strong>
			<p class="text-muted mb-0">
				{entry.actor || 'System'} · {date(entry.created_at, data.user.timezone, true)}{entry.detail
					? ` · ${entry.detail}`
					: ''}
			</p>
		</div>{:else}<p class="small-empty-text">
			Access changes and invitations will be recorded here.
		</p>{/each}
</section>
