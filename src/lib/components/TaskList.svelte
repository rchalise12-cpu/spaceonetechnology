<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api, date } from '$lib/client';
	import { Plus, Trash2, CheckSquare } from '@lucide/svelte';
	let {
		items,
		jobId = null,
		candidate = null
	}: {
		items: {
			id: string;
			title: string;
			done: number;
			due_date: string | null;
			job_id: string | null;
		}[];
		jobId?: string | null;
		candidate?: string | null;
	} = $props();
	let error = $state(''),
		busy = $state(false);
	let suffix = $derived(candidate ? `?candidate=${candidate}` : '');
	async function act(path: string, method: string, body?: unknown) {
		busy = true;
		error = '';
		try {
			await api(path + suffix, method, body);
			await invalidateAll();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = false;
		}
	}
	async function add(e: SubmitEvent) {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement,
			f = new FormData(form);
		await act('tasks', 'POST', {
			title: f.get('title'),
			due_date: f.get('due_date') || null,
			job_id: jobId
		});
		if (!error) form.reset();
	}
</script>

<section class="panel mt-6">
	<div class="section-heading">
		<h2>Next steps <span class="count">{items.filter((t) => !t.done).length}</span></h2>
		<CheckSquare size={20} />
	</div>
	{#if error}<p class="alert error" role="alert">{error}</p>{/if}
	<div class="divide-y divide-line">
		{#each items as item}<div
				class="flex items-center gap-3 py-3 [&>label]:grow [&_small]:block [&_small]:text-muted"
			>
				<label class="checkbox-row"
					><input
						type="checkbox"
						checked={!!item.done}
						disabled={busy}
						onchange={(e) => act(`tasks/${item.id}`, 'PATCH', { done: e.currentTarget.checked })}
					/><span class:line-through={!!item.done}
						>{item.title}{#if item.due_date}<small>Due {date(item.due_date)}</small>{/if}</span
					></label
				>{#if item.job_id && !jobId}<a class="text-button" href={`/jobs/${item.job_id}${suffix}`}
						>Job ↗</a
					>{/if}<button
					class="icon-button"
					aria-label={`Remove task: ${item.title}`}
					disabled={busy}
					onclick={() => act(`tasks/${item.id}`, 'DELETE')}><Trash2 size={15} /></button
				>
			</div>{:else}<p class="small-empty-text">
				A clear next step makes a busy week easier. Add yours below.
			</p>{/each}
	</div>
	<form
		class="grid gap-3 mt-5 sm:grid-cols-[1fr_140px_auto] items-end [&>label]:mb-0"
		onsubmit={add}
	>
		<label
			>Next action<input
				name="title"
				placeholder="Follow up with the recruiter"
				required
				minlength="2"
				maxlength="300"
			/></label
		><label>Due date<input type="date" name="due_date" /></label><button
			class="button secondary"
			disabled={busy}><Plus size={16} />Add task</button
		>
	</form>
</section>
