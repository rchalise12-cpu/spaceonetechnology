<script lang="ts">
	import { api } from '$lib/client';
	import { ArrowUpRight, Check } from '@lucide/svelte';
	let busy = $state(false),
		error = $state(''),
		sent = $state(false);
	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = '';
		try {
			await api(
				'contact',
				'POST',
				Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement))
			);
			sent = true;
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<section class="bg-paper border border-line rounded-2xl p-7 lg:p-10">
	{#if sent}<div class="py-12">
			<Check size={32} class="text-forest mb-5" />
			<h2 class="text-3xl tracking-tight">A good conversation starts here.</h2>
			<p class="text-muted leading-8">
				Your message is with our team. We’ll review what you shared and respond using the email you
				provided.
			</p>
			<button class="button secondary mt-4" onclick={() => (sent = false)}
				>Send another message</button
			>
		</div>{:else}<h2 class="text-2xl tracking-tight mb-7">Tell us a little about it.</h2>
		{#if error}<p class="alert error" role="alert">{error}</p>{/if}
		<form onsubmit={submit}>
			<div class="grid sm:grid-cols-2 gap-5">
				<label
					>Your name<input
						name="name"
						autocomplete="name"
						required
						minlength="2"
						maxlength="100"
					/></label
				><label
					>Email address<input
						name="email"
						type="email"
						autocomplete="email"
						required
						maxlength="254"
					/></label
				>
			</div>
			<label
				>Company <span class="text-muted font-normal">(optional)</span><input
					name="company"
					autocomplete="organization"
					maxlength="160"
				/></label
			><label
				>How can we help?<select name="interest" required
					><option value="">Choose a topic</option><option>Technology project</option><option
						>Hiring & staffing</option
					><option>Career opportunities</option><option>Workspace support</option><option
						>Something else</option
					></select
				></label
			><label
				>What would you like to make happen?<textarea
					name="message"
					rows="5"
					required
					minlength="20"
					maxlength="5000"
					placeholder="A little context, your priorities, and any timeline you have in mind."
				></textarea></label
			>
			<div class="hidden" aria-hidden="true">
				<label>Website<input name="website" tabindex="-1" autocomplete="off" /></label>
			</div>
			<p class="text-xs text-muted leading-6">
				We’ll use these details to respond to your inquiry. Please don’t include confidential
				documents or sensitive personal information. <a class="underline" href="/privacy"
					>Privacy information</a
				>.
			</p>
			<button class="button primary mt-3" disabled={busy}
				>{busy ? 'Sending…' : 'Send your message'}<ArrowUpRight size={17} /></button
			>
		</form>{/if}
</section>
