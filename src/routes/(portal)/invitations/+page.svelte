<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api, date } from '$lib/client';
	import { Send, Mail, RotateCw } from '@lucide/svelte';
	let { data } = $props();
	let error = $state(''),
		success = $state(''),
		preview = $state(''),
		busy = $state(false),
		revoke = $state('');
	async function send(path: string, method: string, body?: unknown) {
		busy = true;
		error = '';
		success = '';
		preview = '';
		try {
			const r = await api<{ preview_url?: string }>(path, method, body);
			preview = r.preview_url || '';
			success = preview
				? 'Local invitation created. Open the preview link to test onboarding.'
				: method === 'DELETE'
					? 'Invitation revoked.'
					: 'Invitation sent. The link is valid for seven days.';
			await invalidateAll();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = false;
			revoke = '';
		}
	}
	function submit(e: SubmitEvent) {
		e.preventDefault();
		void send(
			'invitations',
			'POST',
			Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement))
		);
	}
</script>

<svelte:head><title>Invitations · Space One</title></svelte:head>
<div class="page-heading">
	<div>
		<p class="eyebrow">OPEN THE DOOR</p>
		<h1>Invite your people<span class="heading-dot">.</span></h1>
		<p class="muted">A personal workspace begins with a simple invitation.</p>
	</div>
	<Mail size={28} strokeWidth={1.4} />
</div>
{#if error}<p class="alert error" role="alert">{error}</p>{/if}{#if success}<p
		class="alert success"
		role="status"
	>
		{success}
	</p>{/if}{#if preview}<a
		class="inline-link block mb-6 break-all"
		href={preview}
		target="_blank"
		rel="noreferrer">Open local invitation preview ↗</a
	>{/if}
<div class="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
	<section class="panel self-start">
		<h2>Send an invitation</h2>
		<p class="text-sm text-muted">
			They’ll add their name, phone number, and password. We’ll take them straight to their
			dashboard.
		</p>
		<form onsubmit={submit}>
			<label
				>Email address<input
					name="email"
					type="email"
					required
					placeholder="person@example.com"
				/></label
			><label
				>Workspace role<select name="role"
					><option value="client">Client</option>{#if data.user.role === 'admin'}<option
							value="staff">Staff</option
						>{/if}</select
				></label
			>
			<p class="form-footnote">
				Clients manage their own applications. Staff can manage jobs and support all candidates.
			</p>
			<button class="button primary full" disabled={busy}
				><Send size={16} />{busy ? 'Working…' : 'Send invitation'}</button
			>
		</form>
	</section>
	<section class="panel">
		<h2>Invitation history</h2>
		{#each data.invitations as invite}<div
				class="flex flex-wrap gap-3 items-center py-5 border-b border-line"
			>
				<div class="grow min-w-0">
					<strong class="block break-all">{invite.email}</strong><small class="text-muted"
						>{invite.role} · {invite.accepted_at
							? 'Accepted'
							: invite.revoked_at
								? 'Revoked'
								: invite.expires_at < Date.now()
									? 'Expired'
									: invite.delivery_status === 'failed'
										? 'Delivery failed'
										: 'Pending'} · Created {date(invite.created_at)}</small
					>
				</div>
				{#if !invite.accepted_at}<button
						class="text-button"
						disabled={busy}
						onclick={() => send(`invitations/${invite.id}`, 'POST', {})}
						><RotateCw size={14} />Resend</button
					>{#if !invite.revoked_at}{#if revoke === invite.id}<button
								class="text-button danger"
								disabled={busy}
								onclick={() => send(`invitations/${invite.id}`, 'DELETE')}>Confirm revoke</button
							><button class="text-button" onclick={() => (revoke = '')}>Cancel</button
							>{:else}<button class="text-button" onclick={() => (revoke = invite.id)}
								>Revoke</button
							>{/if}{/if}{/if}
			</div>{:else}<div class="small-empty">
				<Mail size={26} />
				<p>No invitations yet.</p>
			</div>{/each}
	</section>
</div>
