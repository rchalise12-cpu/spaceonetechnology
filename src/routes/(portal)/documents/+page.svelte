<script lang="ts">
	import { FileText, Image, Download, ArrowUpRight, Search } from '@lucide/svelte';
	import { date, fileSize } from '$lib/client';
	let { data } = $props();
	let kind = $state('all');
	let query = $state('');
	let files = $derived(
		data.files.filter(
			(f) =>
				(kind === 'all' || f.kind === kind) &&
				`${f.name} ${f.company} ${f.job_title}`.toLowerCase().includes(query.toLowerCase())
		)
	);
</script>

<svelte:head><title>Documents · Space One</title></svelte:head>
<div class="page-heading">
	<div>
		<p class="eyebrow">EVERY VERSION, IN ONE PLACE</p>
		<h1>Your documents<span class="heading-dot">.</span></h1>
		<p class="muted">Resumes and application proof, connected to the right opportunity.</p>
	</div>
	<FileText size={31} strokeWidth={1.3} />
</div>
<div class="board-toolbar document-toolbar">
	<div class="status-tabs">
		{#each [{ id: 'all', label: 'All documents' }, { id: 'resume', label: 'Resumes' }, { id: 'proof', label: 'Application proof' }] as tab}<button
				class:active={kind === tab.id}
				onclick={() => (kind = tab.id)}>{tab.label}</button
			>{/each}
	</div>
	<div class="search-input">
		<Search size={17} /><input
			bind:value={query}
			aria-label="Search documents"
			placeholder="Search files or companies…"
		/>
	</div>
</div>
<div class="panel">
	{#each files as file}<div class="file-row document-row">
			<div class="file-icon">
				{#if file.kind === 'resume'}<FileText size={23} />{:else}<Image size={23} />{/if}
			</div>
			<div class="file-info">
				<strong>{file.name}</strong><a href={`/jobs/${file.job_id}`}
					>{file.company} · {file.job_title}</a
				><small
					>{fileSize(file.size)} · {date(file.created_at)} · {file.kind === 'resume'
						? 'Resume'
						: 'Application proof'}</small
				>
			</div>
			<a class="button secondary" href={`/api/files/${file.id}`}
				><Download size={16} /><span>Download</span></a
			><a class="icon-button" aria-label="Open related job" href={`/jobs/${file.job_id}`}
				><ArrowUpRight size={18} /></a
			>
		</div>{:else}<div class="empty-state">
			<FileText size={35} strokeWidth={1.3} />
			<h3>
				{data.files.length ? 'No matching documents' : 'A home for your application documents'}
			</h3>
			<p>
				Upload a resume or a confirmation screenshot from a job’s page. You’ll find every version
				here.
			</p>
			<a class="button primary" href="/jobs">Go to my opportunities <ArrowUpRight size={16} /></a>
		</div>{/each}
</div>
