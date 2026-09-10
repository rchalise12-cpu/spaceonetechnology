<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { ArrowUpRight, ArrowRight, Eye, EyeOff, Check, Download, KeyRound } from '@lucide/svelte';
	import { api, downloadText } from '$lib/client';
	let { mode }: { mode: 'login' | 'signup' | 'recover' } = $props();
	let busy = $state(false);
	let error = $state('');
	let show = $state(false);
	let recovery = $state('');
	let saved = $state(false);
	async function submit(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		error = '';
		const form = new FormData(event.currentTarget as HTMLFormElement);
		const body = Object.fromEntries(form);
		if (mode === 'signup') body.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		try {
			const result = await api<{ recovery_key?: string }>(`auth/${mode}`, 'POST', body);
			if (result.recovery_key) {
				recovery = result.recovery_key;
			} else {
				await invalidateAll();
				await goto('/dashboard');
			}
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<div class="auth-layout">
	<section class="auth-story">
		<a class="brand" href="/">space one<span class="brand-dot">.</span></a>
		<div class="auth-editorial">
			<p class="eyebrow">YOUR NEXT CHAPTER</p>
			<h1>Good things<br />are ahead<span>.</span></h1>
			<p>A place for your opportunities.<br />And every step that comes next.</p>
			<div class="path-art" aria-hidden="true">
				<div class="path-ring one"></div>
				<div class="path-ring two"></div>
				<div class="path-ring three"></div>
				<div class="path-arrow"><ArrowUpRight size={62} strokeWidth={1} /></div>
				<span class="path-caption">THE WAY FORWARD</span>
			</div>
		</div>
		<small>SPACE ONE TECHNOLOGY · CLIENT WORKSPACE</small>
	</section>
	<section class="auth-form-wrap">
		<div class="auth-top">
			{mode === 'login' ? 'New to the workspace?' : 'Already have an account?'}<a
				href={mode === 'login' ? '/client/signup' : '/client/login'}
				>{mode === 'login' ? 'Create an account' : 'Sign in'} <ArrowUpRight size={14} /></a
			>
		</div>
		<div class="auth-form">
			{#if recovery}<div class="form-symbol"><KeyRound size={25} /></div>
				<p class="eyebrow">KEEP THIS SAFE</p>
				<h2>Your recovery key</h2>
				<p class="muted">
					Save this key in your password manager. You’ll need it to reset a forgotten password. We
					only show it once.
				</p>
				<code class="recovery-key">{recovery}</code><button
					class="button secondary full"
					onclick={() => {
						downloadText(
							'space-one-recovery-key.txt',
							`Space One Technology account recovery key\n\n${recovery}\n\nKeep this private. Use at /recover if you forget your password.\n`
						);
						saved = true;
					}}><Download size={17} />Download recovery key</button
				><label class="checkbox-row"
					><input type="checkbox" bind:checked={saved} /> I have saved my recovery key somewhere safe.</label
				><button
					class="button primary full"
					disabled={!saved}
					onclick={async () => {
						await invalidateAll();
						await goto('/dashboard');
					}}>Open my workspace <ArrowRight size={17} /></button
				>
			{:else}<p class="eyebrow">YOUR CLIENT WORKSPACE</p>
				<h2>
					{mode === 'login'
						? 'Welcome back.'
						: mode === 'signup'
							? 'A fresh start.'
							: 'Let’s get you back in.'}
				</h2>
				<p class="muted">
					{mode === 'login'
						? 'Your next opportunity is waiting for you.'
						: mode === 'signup'
							? 'Create an account to explore your opportunities.'
							: 'Use the recovery key you saved when you signed up.'}
				</p>
				<form onsubmit={submit}>
					{#if error}<p class="alert error" role="alert">{error}</p>{/if}
					{#if mode === 'signup'}<label
							>Full name<input
								name="name"
								autocomplete="name"
								required
								minlength="2"
								maxlength="100"
								placeholder="Your name"
							/></label
						>{/if}
					{#if mode === 'signup'}<label
							>Phone number<input
								name="phone"
								type="tel"
								autocomplete="tel"
								required
								minlength="7"
								maxlength="30"
								placeholder="+1 (555) 123-4567"
							/></label
						>{/if}
					<label
						>Email address<input
							name="email"
							type="email"
							autocomplete="email"
							required
							placeholder="you@example.com"
						/></label
					>
					{#if mode === 'recover'}<label
							>Recovery key<input
								name="recovery_key"
								required
								pattern="[a-f0-9]{64}"
								autocomplete="off"
								placeholder="Your 64-character recovery key"
							/></label
						>{/if}
					<label
						>{mode === 'recover' ? 'New password' : 'Password'}
						<div class="password-input">
							<input
								name="password"
								type={show ? 'text' : 'password'}
								autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
								required
								minlength={mode === 'login' ? 1 : 12}
								maxlength="128"
								placeholder={mode === 'login' ? 'Enter your password' : 'At least 12 characters'}
							/><button
								type="button"
								class="icon-button"
								aria-label={show ? 'Hide password' : 'Show password'}
								onclick={() => (show = !show)}
								>{#if show}<EyeOff size={18} />{:else}<Eye size={18} />{/if}</button
							>
						</div></label
					>
					{#if mode === 'login'}<div class="form-right">
							<a href="/client/forgot-password">Forgot password?</a>
						</div>{/if}
					<button class="button primary full" disabled={busy}
						>{busy
							? 'Please wait…'
							: mode === 'login'
								? 'Sign in'
								: mode === 'signup'
									? 'Create account'
									: 'Reset password'}<ArrowRight size={18} /></button
					>
					{#if mode === 'signup'}<p class="form-footnote">
							Your resumes and application updates are shared with authorized Space One staff to
							support your search.
						</p>{/if}
				</form>{/if}
		</div>
		<div class="auth-bottom"><Check size={14} /> A dedicated space for your job search.</div>
	</section>
</div>
