<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { api, downloadText } from '$lib/client';
	import { ArrowRight, Download } from '@lucide/svelte';
	let {
		mode,
		token = '',
		invite = null
	}: {
		mode: 'invite' | 'forgot-password' | 'reset-password';
		token?: string;
		invite?: { email: string; role: string } | null;
	} = $props();
	let busy = $state(false),
		error = $state(''),
		message = $state(''),
		recovery = $state(''),
		saved = $state(false);
	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = '';
		try {
			const body = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement));
			if (mode !== 'forgot-password') body.token = token;
			if (mode === 'invite') {
				body.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
				body.email = invite!.email;
			}
			const r = await api<{ message?: string; recovery_key?: string }>(
				`auth/${mode === 'invite' ? 'accept-invite' : mode}`,
				'POST',
				body
			);
			message = r.message || '';
			recovery = r.recovery_key || '';
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<div class="min-h-screen grid lg:grid-cols-2 bg-paper">
	<section class="bg-sage p-8 lg:p-16 flex flex-col justify-between min-h-64">
		<a class="brand" href="/">space one<span class="brand-dot">.</span></a>
		<div class="py-12">
			<p class="eyebrow">YOUR NEXT CHAPTER</p>
			<h1 class="text-5xl lg:text-7xl tracking-tight leading-[1.05] max-w-lg">
				A place to<br />move forward<span class="text-rust">.</span>
			</h1>
			<p class="text-lg text-forest mt-6 max-w-sm">
				Your opportunities, your people, and a clear next step.
			</p>
		</div>
		<small class="text-forest tracking-widest">SPACE ONE TECHNOLOGY</small>
	</section>
	<main class="p-8 lg:p-16 flex items-center justify-center">
		<div class="w-full max-w-md">
			<a class="text-button mb-10" href="/client/login">← Back to sign in</a>
			<p class="eyebrow">
				{mode === 'invite' ? `${invite?.role || 'Workspace'} INVITATION` : 'ACCOUNT ACCESS'}
			</p>
			<h2 class="text-4xl tracking-tight">
				{recovery
					? 'Keep a backup.'
					: mode === 'invite'
						? 'You’re invited.'
						: mode === 'forgot-password'
							? 'Let’s get you back in.'
							: 'A fresh password.'}
			</h2>
			{#if error}<p class="alert error" role="alert">{error}</p>{/if}{#if message}<p
					class="alert success"
					role="status"
				>
					{message}
				</p>{:else if recovery}<p class="text-muted leading-7">
					Save this recovery key in your password manager. It gives you another way back into your
					account.
				</p>
				<code class="recovery-key">{recovery}</code><button
					class="button secondary full"
					onclick={() => {
						downloadText('space-one-recovery-key.txt', recovery);
						saved = true;
					}}><Download size={16} />Download key</button
				><label class="checkbox-row"
					><input type="checkbox" bind:checked={saved} />I have saved my recovery key.</label
				><button
					class="button primary full"
					disabled={!saved}
					onclick={async () => {
						await invalidateAll();
						await goto('/dashboard');
					}}>Open dashboard <ArrowRight size={17} /></button
				>{:else}<p class="text-muted leading-7 mb-7">
					{mode === 'invite'
						? 'Complete your profile to join the workspace.'
						: mode === 'forgot-password'
							? 'Enter the email you use for Space One. We’ll send a link to reset your password.'
							: 'Choose a password with at least 12 characters.'}
				</p>
				<form onsubmit={submit}>
					{#if mode === 'invite'}<label
							>Full name<input
								name="name"
								autocomplete="name"
								required
								minlength="2"
								maxlength="100"
							/></label
						><label>Email address<input type="email" value={invite?.email} readonly /></label><label
							>Phone number<input
								name="phone"
								type="tel"
								autocomplete="tel"
								required
								minlength="7"
								maxlength="30"
							/></label
						>{:else if mode === 'forgot-password'}<label
							>Email address<input name="email" type="email" autocomplete="email" required /></label
						>{/if}{#if mode !== 'forgot-password'}<label
							>Password<input
								name="password"
								type="password"
								autocomplete="new-password"
								required
								minlength="12"
								maxlength="128"
							/></label
						>{/if}<button class="button primary full" disabled={busy}
						>{busy
							? 'Please wait…'
							: mode === 'invite'
								? 'Create my account'
								: mode === 'forgot-password'
									? 'Send reset link'
									: 'Reset password'}<ArrowRight size={17} /></button
					>
				</form>
				{#if mode === 'forgot-password'}<a class="text-button mt-6" href="/client/recover"
						>Use a recovery key instead</a
					>{/if}{/if}
		</div>
	</main>
</div>
