<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api, date } from '$lib/client';
	import type { NormalizedJob } from '$lib/job-import';
	import { Upload, ArrowRight, FileJson, Check } from '@lucide/svelte';
	let { data } = $props();
	let text = $state(''),
		name = $state('Pasted jobs'),
		error = $state(''),
		success = $state(''),
		busy = $state(false),
		mappingOpen = $state(false);
	let mapping = $state<Record<string, string>>({});
	let preview = $state<{ jobs: NormalizedJob[]; warnings: string[] } | null>(null);
	let previewSource = $state('');
	async function file(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (!f) return;
		if (f.size > 2 * 1024 * 1024) {
			error = 'Choose a JSON file up to 2 MB.';
			return;
		}
		text = await f.text();
		name = f.name;
		preview = null;
	}
	async function review() {
		busy = true;
		error = '';
		success = '';
		try {
			preview = await api('imports/preview', 'POST', {
				text,
				mapping: Object.fromEntries(Object.entries(mapping).filter(([, v]) => v))
			});
			previewSource = JSON.stringify({ text, mapping });
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = false;
		}
	}
	async function commit() {
		if (previewSource !== JSON.stringify({ text, mapping })) {
			error = 'The input changed. Review the file again before importing.';
			return;
		}
		busy = true;
		error = '';
		try {
			const r = await api<{ published: number; held: number; duplicates: number }>(
				'imports/commit',
				'POST',
				{ text, name, mapping: Object.fromEntries(Object.entries(mapping).filter(([, v]) => v)) }
			);
			success = `${r.published} published · ${r.held} held for review · ${r.duplicates} duplicates skipped.`;
			preview = null;
			text = '';
			await invalidateAll();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>Import jobs · Space One</title></svelte:head>
<div class="page-heading">
	<div>
		<p class="eyebrow">FROM SOURCE TO OPPORTUNITY</p>
		<h1>A better job feed<span class="heading-dot">.</span></h1>
		<p class="muted">
			Bring your scraped jobs. We’ll standardize the details and flag what needs a human look.
		</p>
	</div>
	<a class="button secondary" href="/admin">Review & edit jobs <ArrowRight size={16} /></a>
</div>
{#if error}<p class="alert error" role="alert">{error}</p>{/if}{#if success}<p
		class="alert success"
		role="status"
	>
		<Check size={16} />{success}
	</p>{/if}
<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
	<section class="panel">
		<div class="section-heading">
			<h2>01 / Add your source</h2>
			<FileJson size={21} />
		</div>
		<label class="upload-box mb-5"
			><Upload size={25} /><strong>Choose a JSON or JSONL file</strong><span
				>Up to 2 MB · 100 jobs per batch</span
			><input type="file" accept=".json,.jsonl,.txt,application/json" onchange={file} /></label
		><label
			>Or paste scraped data<textarea
				rows="10"
				bind:value={text}
				maxlength="2000000"
				placeholder={'{"jobs": [{"title": "Data Engineer", "company": "…"}]}'}
				class="font-mono text-xs"></textarea></label
		><button class="text-button mb-4" onclick={() => (mappingOpen = !mappingOpen)}
			>{mappingOpen ? 'Hide' : 'Show'} custom field mapping</button
		>{#if mappingOpen}<p class="text-sm text-muted">
				Use a field name or dot path, such as <code>job.title</code>. Recognized sources work
				without mapping.
			</p>
			<div class="grid sm:grid-cols-2 gap-3">
				{#each ['title', 'company', 'location', 'description', 'application_url', 'salary', 'posted_at'] as key}<label
						>{key.replaceAll('_', ' ')}<input bind:value={mapping[key]} placeholder={key} /></label
					>{/each}
			</div>{/if}<button class="button primary" disabled={busy || !text.trim()} onclick={review}
			>{busy ? 'Working…' : 'Review import'}<ArrowRight size={16} /></button
		>
	</section>
	<aside class="agenda-card self-start">
		<p class="eyebrow">A FEW GOOD GUARDRAILS</p>
		<h3>Clean data.<br />Clear decisions.</h3>
		<p class="text-sm leading-7 text-muted">
			HTML is reduced to readable text. Tracking parameters are removed from links. Source IDs help
			prevent duplicates. Unknown details stay unknown.
		</p>
		<p class="text-sm leading-7 text-muted">
			Incomplete descriptions and mixed job grids are held for staff review. Clients see a listing
			only after its required details are ready.
		</p>
		<p class="text-sm leading-7 text-muted">
			Repeat imports skip existing records to protect editorial corrections and application history.
		</p>
	</aside>
</div>
{#if preview}<section class="panel mt-6">
		<div class="section-heading">
			<h2>02 / Review {preview.jobs.length} records</h2>
			<button
				class="button primary"
				disabled={busy || previewSource !== JSON.stringify({ text, mapping })}
				onclick={commit}>Confirm import <ArrowRight size={16} /></button
			>
		</div>
		{#each preview.warnings as warning}<p class="alert">
				{warning}
			</p>{/each}{#each preview.jobs as job}<div
				class="grid gap-4 py-5 border-b border-line md:grid-cols-[1fr_1fr]"
			>
				<div>
					<p class="eyebrow">
						{job.source} · {job.quality_state === 'ready' ? 'READY TO PUBLISH' : 'HELD FOR REVIEW'}
					</p>
					<h3>{job.title || 'Title needs review'}</h3>
					<p class="text-sm text-muted">
						{job.company || 'Unknown company'} · {job.location || 'Unknown location'}
					</p>
					<p class="text-sm">{job.salary || 'Salary not provided'}</p>
				</div>
				<div>
					{#each job.quality_warnings as warning}<p class="text-sm text-rust mb-2">
							{warning}
						</p>{/each}
					<details>
						<summary class="cursor-pointer text-sm">Preview standardized description</summary>
						<p class="mt-3 text-sm text-muted whitespace-pre-line">
							{job.description || 'No reliable description. Add one before publishing.'}
						</p>
					</details>
				</div>
			</div>{/each}
	</section>{/if}
<section class="panel mt-6">
	<h2>Recent imports</h2>
	{#each data.batches as batch}<div
			class="flex flex-wrap justify-between gap-3 py-4 border-b border-line text-sm"
		>
			<span
				><strong>{batch.name}</strong><small class="block text-muted"
					>{date(batch.created_at, data.user.timezone, true)}</small
				></span
			><span>{batch.total} records · {batch.published} published · {batch.held} held</span>
		</div>{:else}<p class="small-empty-text">Your import history will appear here.</p>{/each}
</section>
