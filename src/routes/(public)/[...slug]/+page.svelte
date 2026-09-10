<script lang="ts">
	import { media } from '$lib/public/assets';
	import { ArrowUpRight, ArrowRight, Phone, MapPin, Check, Layers3 } from '@lucide/svelte';
	import { services, projectIdeas, articles } from '$lib/public/content';
	import ContactForm from '$lib/components/ContactForm.svelte';
	let { data } = $props();
	let p = $derived(data.content);
</script>

<svelte:head
	><title>{p.title} · Space One Technology</title><meta name="description" content={p.intro} /><link
		rel="canonical"
		href={`${data.origin}/${p.slug}`}
	/><meta property="og:title" content={p.title} /><meta
		property="og:description"
		content={p.intro}
	/><meta property="og:url" content={`${data.origin}/${p.slug}`} /><meta
		property="og:image"
		content={media.collaboration}
	/></svelte:head
>
<div class="max-w-[1600px] mx-auto px-6 lg:px-10">
	<header class="pt-14 lg:pt-24 pb-12 lg:pb-16 border-b border-line">
		<a
			class="text-xs text-muted hover:text-rust inline-block mb-10"
			href={p.kind === 'article' ? '/insights' : p.kind === 'project' ? '/projects' : '/'}
			>← {p.kind === 'article'
				? 'All insights'
				: p.kind === 'project'
					? 'All concepts'
					: 'Space One'}</a
		>
		<p class="eyebrow">{p.eyebrow}</p>
		<h1
			class="text-[clamp(2.7rem,5vw,4.8rem)] max-w-4xl leading-[1.08] tracking-[-.045em] font-medium mb-7"
		>
			{p.title}
		</h1>
		<p class="text-lg lg:text-xl leading-8 text-muted max-w-3xl mb-0">{p.intro}</p>
	</header>
	{#if p.kind === 'services'}<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 py-8 lg:pb-20">
			{#each services as service, i}<a
					class="group py-9 border-b border-line"
					href={`/services/${service.slug}`}
					><div class="flex justify-between mb-8">
						<span class="text-xs text-muted">0{i + 1}</span><ArrowUpRight
							size={23}
							class="group-hover:text-rust"
						/>
					</div>
					<h2 class="text-2xl tracking-tight font-medium">{service.name}</h2>
					<p class="text-sm leading-7 text-muted">{service.intro}</p>
					<span class="text-sm font-medium">Explore the service</span></a
				>{/each}
		</div>
	{:else if p.kind === 'projects'}<div
			class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 py-12 lg:py-20"
		>
			{#each projectIdeas as project, i}<a
					class="group border border-line rounded-xl overflow-hidden bg-paper"
					href={`/projects/${project.slug}`}
					><div class="bg-sage p-8 h-44 flex items-end justify-between">
						<span class="text-4xl text-forest/60 tracking-tighter font-medium">{project.name}</span
						><Layers3 size={35} strokeWidth={1} class="text-forest/60" />
					</div>
					<div class="p-7">
						<p class="eyebrow">{project.category}</p>
						<h2 class="text-xl font-medium leading-snug">{project.line}</h2>
						<span class="text-sm text-muted flex justify-between mt-6"
							>Explore the concept <ArrowUpRight size={18} /></span
						>
					</div></a
				>{/each}
		</div>
	{:else if p.kind === 'articles'}<div
			class="grid md:grid-cols-2 lg:grid-cols-3 gap-7 py-12 lg:py-20"
		>
			{#each articles as article, i}<a
					class="group bg-paper border border-line rounded-xl p-8 hover:border-forest/40"
					href={`/insights/${article.slug}`}
					><span class="text-xs text-rust tracking-widest"
						>PERSPECTIVE / {String(i + 1).padStart(2, '0')}</span
					>
					<h2 class="text-2xl tracking-tight leading-snug font-medium mt-12">{article.title}</h2>
					<p class="text-sm text-muted leading-7">{article.intro}</p>
					<span class="text-sm flex justify-between mt-7"
						>Read the note <ArrowUpRight size={18} /></span
					></a
				>{/each}
		</div>
	{:else if p.kind === 'contact'}<div
			class="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-20 py-12 lg:py-20"
		>
			<ContactForm />
			<aside>
				<div class="bg-sage rounded-2xl p-8 mb-8">
					<p class="eyebrow">A REAL CONVERSATION</p>
					<h2 class="text-3xl tracking-tight font-medium">Prefer to talk it through?</h2>
					<a class="flex gap-3 items-center mt-7 text-lg" href="tel:+18327105930"
						><Phone size={20} />+1 (832) 710-5930</a
					>
					<p class="text-sm text-forest/70 mt-3">Monday–Friday · 8am–5pm Central</p>
				</div>
				<div class="p-2">
					<h3 class="text-lg">Find us in Irving</h3>
					<address class="not-italic text-muted leading-8">
						2300 Valley View Ln, Ste #865<br />Irving, TX 75062
					</address>
					<a
						class="text-button mt-5"
						href="https://www.google.com/maps/search/?api=1&query=2300+Valley+View+Ln+Irving+TX+75062"
						target="_blank"
						rel="noopener noreferrer">Open directions <ArrowUpRight size={16} /></a
					>
				</div>
				<p class="text-sm text-muted leading-7 mt-8">
					Already using the client workspace? Include the job title or the page you need help with
					so we can find the right context.
				</p>
			</aside>
		</div>
	{:else}<div class="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-10 lg:gap-20 py-12 lg:py-20">
			<aside class="lg:sticky lg:top-8 self-start">
				<p class="eyebrow">ON THIS PAGE</p>
				<nav class="grid gap-4 text-sm text-muted" aria-label="Page sections">
					{#each p.sections as section, i}<a class="hover:text-rust" href={`#section-${i + 1}`}
							>{section.title}</a
						>{/each}
				</nav>
				{#if p.kind === 'careers'}<a
						class="button primary mt-8"
						href={data.signedIn ? '/dashboard' : '/client/signup'}
						>{data.signedIn ? 'Open dashboard' : 'Create your workspace'}<ArrowUpRight
							size={16}
						/></a
					><a class="text-button mt-4" href="/client/login">Already a client? Sign in</a
					>{:else if !['privacy', 'terms', 'image-credits'].includes(p.slug)}<a
						class="button secondary mt-8"
						href="/contact">Talk with us <ArrowUpRight size={16} /></a
					>{/if}
			</aside>
			<article class="max-w-3xl">
				{#if p.slug === 'about'}<img
						class="w-full aspect-[16/9] object-cover rounded-xl mb-12"
						src={media.collaboration}
						alt="Colleagues sharing ideas around a laptop"
						width="1024"
						height="645"
						loading="lazy"
					/>{/if}
				{#if p.kind === 'project'}<div
						class="bg-sage rounded-xl p-6 mb-10 text-sm leading-7 text-forest"
					>
						This is a product concept. It illustrates an approach to a problem and does not
						represent a verified client implementation or measured business outcome.
					</div>{/if}{#each p.sections as section, i}<section
						id={`section-${i + 1}`}
						class="scroll-mt-8 mb-12 last:mb-0"
					>
						<h2 class="text-2xl lg:text-3xl tracking-tight font-medium leading-snug mb-5">
							{section.title}
						</h2>
						<p class="text-muted text-base lg:text-lg leading-8">{section.body}</p>
					</section>{/each}{#if p.kind === 'careers'}<div class="rounded-2xl bg-sage p-8 mt-10">
						<h2 class="text-2xl font-medium">A place for every step.</h2>
						<p class="text-forest/75 leading-7">
							Your dashboard keeps jobs, application updates, resumes, interviews, and next steps
							together. Job listings are available after you sign in.
						</p>
						<a class="button primary" href={data.signedIn ? '/jobs' : '/client/signup'}
							>Explore opportunities <ArrowUpRight size={16} /></a
						>
					</div>{/if}
			</article>
		</div>{/if}
</div>
