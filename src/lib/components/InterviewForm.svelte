<script lang="ts">
	import { focusDialog } from '$lib/focus';
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/client';
	import { X, CalendarDays } from '@lucide/svelte';
	let {
		jobId,
		candidate = null,
		timezone,
		item,
		onclose
	}: {
		jobId: string;
		candidate?: string | null;
		timezone: string;
		item?: {
			id: string;
			title: string;
			starts_at: string;
			ends_at: string;
			timezone: string;
			state: string;
			location: string;
			notes: string;
		};
		onclose: () => void;
	} = $props();
	let error = $state('');
	let busy = $state(false);
	// Inputs use the browser timezone and are converted to UTC before persisting.
	const local = (s?: string) => {
		if (!s) return '';
		const d = new Date(s);
		return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
	};
	async function submit(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		error = '';
		const f = new FormData(event.currentTarget as HTMLFormElement);
		try {
			await api(
				(item ? `interviews/${item.id}` : `jobs/${jobId}/interviews`) +
					(candidate ? `?candidate=${candidate}` : ''),
				item ? 'PATCH' : 'POST',
				{
					title: f.get('title'),
					starts_at: new Date(String(f.get('starts_at'))).toISOString(),
					ends_at: new Date(String(f.get('ends_at'))).toISOString(),
					timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
					state: f.get('state'),
					location: f.get('location'),
					notes: f.get('notes')
				}
			);
			await invalidateAll();
			onclose();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<div class="modal-backdrop">
	<div
		use:focusDialog={onclose}
		role="dialog"
		aria-modal="true"
		aria-labelledby="interview-title"
		tabindex="-1"
		class="modal"
	>
		<div class="section-heading">
			<h2 id="interview-title">{item ? 'Edit interview' : 'Schedule an interview'}</h2>
			<button class="icon-button" aria-label="Close interview form" onclick={onclose}
				><X size={20} /></button
			>
		</div>
		<p class="muted">
			Enter times in your device timezone. Your agenda displays them in {timezone}.
		</p>
		<form onsubmit={submit}>
			{#if error}<p class="alert error" role="alert">{error}</p>{/if}<label
				>Interview round<input
					name="title"
					value={item?.title || ''}
					placeholder="e.g. Technical interview"
					minlength="2"
					maxlength="160"
					required
				/></label
			>
			<div class="form-grid">
				<label
					>Starts<input
						name="starts_at"
						type="datetime-local"
						value={local(item?.starts_at)}
						required
					/></label
				><label
					>Ends<input
						name="ends_at"
						type="datetime-local"
						value={local(item?.ends_at)}
						required
					/></label
				>
			</div>
			<label
				>State<select name="state" value={item?.state || 'scheduled'}
					><option value="scheduled">Scheduled</option><option value="completed">Completed</option
					><option value="cancelled">Cancelled</option></select
				></label
			><label
				>Meeting link or location<input
					name="location"
					value={item?.location || ''}
					maxlength="1000"
					placeholder="Video call link or office address"
				/></label
			><label
				>Preparation notes<textarea
					name="notes"
					rows="3"
					maxlength="5000"
					value={item?.notes || ''}
					placeholder="Who you’re meeting, what to prepare…"></textarea></label
			><button class="button primary full" disabled={busy}
				><CalendarDays size={17} />{busy
					? 'Saving…'
					: item
						? 'Save interview'
						: 'Add interview'}</button
			>
		</form>
	</div>
</div>
