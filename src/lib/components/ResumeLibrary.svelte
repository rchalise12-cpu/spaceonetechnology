<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api, fileSize, date } from '$lib/client';
	import { FileText, Trash2, Download, Upload } from '@lucide/svelte';
	let { files }: { files: { id: string; name: string; size: number; created_at: string }[] } =
		$props();
	let error = $state(''),
		busy = $state(false),
		remove = $state('');
	async function upload(e: Event) {
		const input = e.target as HTMLInputElement,
			file = input.files?.[0];
		if (!file) return;
		const form = new FormData();
		form.set('file', file);
		busy = true;
		error = '';
		try {
			await api('profile-files', 'POST', form);
			await invalidateAll();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = false;
			input.value = '';
		}
	}
	async function del(id: string) {
		busy = true;
		error = '';
		try {
			await api(`profile-files/${id}`, 'DELETE');
			await invalidateAll();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = false;
			remove = '';
		}
	}
</script>

<section class="panel">
	<div class="section-heading">
		<h2>Your resume library</h2>
		<FileText size={21} />
	</div>
	<p class="text-sm text-muted leading-7">
		Keep your base resumes here. Add a copy to a job from its Documents tab; each job keeps the
		exact version you chose.
	</p>
	{#if error}<p class="alert error" role="alert">{error}</p>{/if}<label class="upload-box mb-5"
		><Upload size={23} /><strong>{busy ? 'Working…' : 'Add a resume'}</strong><span
			>PDF · up to 10 MB</span
		><input type="file" accept=".pdf,application/pdf" disabled={busy} onchange={upload} /></label
	>{#each files as file}<div class="file-row">
			<FileText size={22} />
			<div class="file-info">
				<strong>{file.name}</strong><small>{fileSize(file.size)} · {date(file.created_at)}</small>
			</div>
			<a
				class="icon-button"
				href={`/api/profile-files/${file.id}`}
				aria-label={`Download ${file.name}`}><Download size={17} /></a
			>{#if remove === file.id}<button
					class="text-button danger"
					disabled={busy}
					onclick={() => del(file.id)}>Confirm remove</button
				><button class="text-button" onclick={() => (remove = '')}>Cancel</button>{:else}<button
					class="icon-button"
					aria-label={`Remove ${file.name}`}
					onclick={() => (remove = file.id)}><Trash2 size={16} /></button
				>{/if}
		</div>{:else}<p class="small-empty-text">
			Start with your strongest resume. You can tailor a copy for each opportunity.
		</p>{/each}
</section>
