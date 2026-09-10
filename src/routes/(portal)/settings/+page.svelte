<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { UserRound, LockKeyhole, KeyRound, Download, Check } from '@lucide/svelte';
	import ResumeLibrary from '$lib/components/ResumeLibrary.svelte';
	import { tags } from '$lib/client';
	import { api, downloadText } from '$lib/client';
	let { data } = $props();
	let busy = $state('');
	let error = $state('');
	let success = $state('');
	let recovery = $state('');
	async function submit(event: SubmitEvent, path: string, method: string, key: string) {
		event.preventDefault();
		busy = key;
		error = '';
		success = '';
		try {
			const body = Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement));
			const payload =
				path === 'me'
					? {
							...body,
							skills: String(body.skills || '')
								.split(',')
								.map((s) => s.trim())
								.filter(Boolean)
						}
					: body;
			const result = await api<{ recovery_key?: string }>(path, method, payload);
			if (result.recovery_key) recovery = result.recovery_key;
			await invalidateAll();
			success = 'Your changes are saved.';
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = '';
		}
	}
</script>

<svelte:head><title>Settings · Space One</title></svelte:head>
<div class="page-heading">
	<div>
		<p class="eyebrow">MAKE YOURSELF AT HOME</p>
		<h1>Account settings<span class="heading-dot">.</span></h1>
		<p class="muted">Your profile, your timezone, and your account security.</p>
	</div>
</div>
{#if error}<p class="alert error" role="alert">{error}</p>{/if}{#if success}<p
		class="alert success"
		role="status"
	>
		<Check size={16} />{success}
	</p>{/if}
<div class="settings-grid">
	<ResumeLibrary files={data.files} />
	<section class="panel">
		<div class="section-heading">
			<h2>Your profile</h2>
			<UserRound size={20} />
		</div>
		<form onsubmit={(e) => submit(e, 'me', 'PATCH', 'profile')}>
			<label
				>Full name<input
					name="name"
					value={data.user.name}
					required
					minlength="2"
					maxlength="100"
				/></label
			><label>Email address<input type="email" value={data.user.email} disabled /></label><label
				>Phone number<input
					name="phone"
					type="tel"
					value={data.user.phone}
					required
					minlength="7"
					maxlength="30"
				/></label
			><label
				>Professional headline<input
					name="headline"
					value={data.user.headline}
					maxlength="160"
					placeholder="Data analyst · SQL, Python & Power BI"
				/></label
			><label
				>Location<input
					name="location"
					value={data.user.location}
					maxlength="160"
					placeholder="City, state, country"
				/></label
			><label
				>Skills, separated by commas<input
					name="skills"
					value={tags(data.user.skills).join(', ')}
					maxlength="1200"
				/></label
			><label
				>About you<textarea
					name="bio"
					rows="4"
					maxlength="3000"
					value={data.user.bio}
					placeholder="A little about your experience and the work you want to do next."
				></textarea></label
			><label
				>Display timezone<select name="timezone" value={data.user.timezone}
					>{#each [...new Set( [data.user.timezone, 'UTC', ...Intl.supportedValuesOf('timeZone')] )] as zone}<option
							>{zone}</option
						>{/each}</select
				></label
			>
			<p class="form-footnote">Interview times use this timezone throughout your workspace.</p>
			<button class="button primary" disabled={busy === 'profile'}
				>{busy === 'profile' ? 'Saving…' : 'Save profile'}</button
			>
		</form>
	</section>
	<section class="panel">
		<div class="section-heading">
			<h2>Change password</h2>
			<LockKeyhole size={20} />
		</div>
		<form onsubmit={(e) => submit(e, 'auth/password', 'POST', 'password')}>
			<label
				>Current password<input
					name="current_password"
					type="password"
					autocomplete="current-password"
					required
				/></label
			><label
				>New password<input
					name="password"
					type="password"
					autocomplete="new-password"
					minlength="12"
					maxlength="128"
					required
					placeholder="At least 12 characters"
				/></label
			>
			<p class="form-footnote">Changing your password signs out your other sessions.</p>
			<button class="button primary" disabled={busy === 'password'}
				>{busy === 'password' ? 'Updating…' : 'Update password'}</button
			>
		</form>
	</section>
	<section class="panel recovery-panel">
		<div class="section-heading">
			<h2>Account recovery</h2>
			<KeyRound size={20} />
		</div>
		<p class="muted">
			Generate a new recovery key if you’ve misplaced yours. This immediately replaces the previous
			key.
		</p>
		{#if recovery}<code class="recovery-key">{recovery}</code><button
				class="button secondary"
				onclick={() => downloadText('space-one-recovery-key.txt', recovery)}
				><Download size={16} />Download new key</button
			>{:else}<form onsubmit={(e) => submit(e, 'auth/recovery-key', 'POST', 'recovery')}>
				<label
					>Confirm your password<input
						name="password"
						type="password"
						autocomplete="current-password"
						required
					/></label
				><button class="button secondary" disabled={busy === 'recovery'}
					>{busy === 'recovery' ? 'Generating…' : 'Generate a new recovery key'}</button
				>
			</form>{/if}
	</section>
</div>
