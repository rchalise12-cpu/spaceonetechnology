<script lang="ts">
	import { ArrowUpRight, ArrowRight, Check, Code2, Users, Layers3 } from '@lucide/svelte';
	import { media } from '$lib/public/assets';
	import { services, articles } from '$lib/public/content';
	let { data } = $props();
</script>

<svelte:head
	><title>Space One Technology · Build what’s next, together</title><meta
		name="description"
		content="Practical technology services and thoughtful talent support. Build software, connect systems, and take your next career step with Space One Technology."
	/><link rel="canonical" href={data.origin + '/'} /><meta
		property="og:title"
		content="Space One Technology · Build what’s next, together"
	/><meta
		property="og:description"
		content="Technology that works. People who move it forward."
	/><meta property="og:image" content={media.collaboration} /></svelte:head
>
<section class="max-w-[1600px] mx-auto px-6 lg:px-10 pt-16 lg:pt-24 pb-14">
	<div class="grid lg:grid-cols-[1.25fr_1fr] gap-10 lg:gap-16 items-end">
		<div>
			<p class="eyebrow flex items-center gap-3">
				<span class="w-2 h-2 rounded-full bg-rust"></span>TECHNOLOGY. TALENT. FORWARD.
			</p>
			<h1 class="text-[clamp(3.3rem,6.4vw,6rem)] font-medium leading-[1.02] tracking-[-.06em] mb-7">
				Build what’s<br />next<span class="text-rust">.</span><br /><span class="text-forest"
					>Together.</span
				>
			</h1>
			<p class="max-w-md text-lg leading-8 text-muted mb-8">
				Useful technology starts with the right people. We help businesses build better—and people
				find their next place to grow.
			</p>
			<div class="flex flex-wrap gap-3">
				<a class="button primary px-6 py-4" href="/services"
					>Explore our services <ArrowUpRight size={17} /></a
				><a class="button secondary px-6 py-4" href="/careers"
					>Find your next role <ArrowRight size={17} /></a
				>
			</div>
		</div>
		<div class="relative">
			<div class="bg-sage rounded-t-[9rem] rounded-b-2xl overflow-hidden pt-10">
				<img
					class="w-full h-[310px] sm:h-[410px] object-cover"
					src={media.collaboration}
					srcset={`${media.collaborationSmall} 600w, ${media.collaboration} 1024w`}
					sizes="(max-width: 1024px) 100vw, 45vw"
					alt="People working together around a laptop"
					width="1024"
					height="645"
					fetchpriority="high"
				/>
				<div class="px-7 py-6 flex justify-between items-center">
					<span class="text-sm text-forest leading-6"
						>Good questions.<br /><strong>Better possibilities.</strong></span
					><span
						class="w-12 h-12 rounded-full border border-forest/30 flex items-center justify-center text-forest"
						><ArrowUpRight size={28} strokeWidth={1.3} /></span
					>
				</div>
			</div>
		</div>
	</div>
	<div
		class="mt-16 pt-7 border-t border-line flex flex-wrap justify-between gap-5 text-xs uppercase tracking-[.15em] text-muted"
	>
		<span>Thoughtful by design</span><span>Practical in delivery</span><span
			>Connected by people</span
		>
	</div>
</section>
<section class="bg-paper border-y border-line">
	<div class="max-w-[1600px] mx-auto px-6 lg:px-10 py-16 lg:py-24">
		<div class="grid lg:grid-cols-2 gap-8 mb-12">
			<div>
				<p class="eyebrow">TWO WAYS FORWARD</p>
				<h2 class="text-4xl lg:text-5xl leading-tight tracking-tight font-medium max-w-lg">
					The work you’re building.<br />The future you’re shaping.
				</h2>
			</div>
			<p class="text-muted leading-8 text-lg max-w-md lg:justify-self-end self-end">
				Whether you’re growing a team or taking your next career step, progress is easier when the
				people and the process are connected.
			</p>
		</div>
		<div class="grid md:grid-cols-2 gap-6">
			<a
				class="group p-8 lg:p-10 bg-canvas rounded-2xl border border-line hover:border-forest/40 transition-colors"
				href="/services"
				><Code2 size={31} strokeWidth={1.3} class="mb-10 text-forest" />
				<p class="eyebrow">FOR BUSINESSES</p>
				<h3 class="text-3xl tracking-tight font-medium">
					Turn the challenge<br />into a working solution.
				</h3>
				<p class="text-muted leading-7 max-w-md">
					Software, systems, data, and talent support shaped around what your team needs to
					accomplish.
				</p>
				<span
					class="flex items-center justify-between border-t border-line pt-5 mt-8 text-sm font-medium"
					>See how we can help <ArrowUpRight
						size={22}
						class="group-hover:translate-x-1 transition-transform"
					/></span
				></a
			><a
				class="group p-8 lg:p-10 bg-sage rounded-2xl border border-sage hover:border-forest/40 transition-colors"
				href="/careers"
				><Users size={31} strokeWidth={1.3} class="mb-10 text-forest" />
				<p class="eyebrow">FOR CANDIDATES</p>
				<h3 class="text-3xl tracking-tight font-medium">
					Give your next move<br />a little more direction.
				</h3>
				<p class="text-forest/75 leading-7 max-w-md">
					Relevant opportunities, a place for every application, and support that stays connected to
					your search.
				</p>
				<span
					class="flex items-center justify-between border-t border-forest/15 pt-5 mt-8 text-sm font-medium"
					>Explore your next chapter <ArrowUpRight
						size={22}
						class="group-hover:translate-x-1 transition-transform"
					/></span
				></a
			>
		</div>
	</div>
</section>
<section class="max-w-[1600px] mx-auto px-6 lg:px-10 py-16 lg:py-24">
	<div class="flex flex-wrap justify-between items-end gap-6 mb-10">
		<div>
			<p class="eyebrow">BUILT AROUND YOUR BUSINESS</p>
			<h2 class="text-4xl lg:text-5xl tracking-tight font-medium mb-0">
				Good ideas need good execution.
			</h2>
		</div>
		<a class="text-button" href="/services">All services <ArrowUpRight size={17} /></a>
	</div>
	<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-x-10">
		{#each services.slice(0, 6) as service, i}<a
				class="group py-8 border-b border-line"
				href={`/services/${service.slug}`}
				><div class="flex justify-between text-muted mb-6">
					<span class="text-xs">0{i + 1}</span><ArrowUpRight
						size={21}
						class="group-hover:text-rust"
					/>
				</div>
				<h3 class="text-xl font-medium">{service.name}</h3>
				<p class="text-sm text-muted leading-7 mb-0">{service.line}</p></a
			>{/each}
	</div>
</section>
<section class="max-w-7xl mx-auto px-6 lg:px-10 pb-16 lg:pb-24">
	<div class="grid lg:grid-cols-[.8fr_1.2fr] gap-10 items-center border-t border-line pt-12">
		<div>
			<p class="eyebrow">THE HUMAN SIDE OF TECHNOLOGY</p>
			<h2 class="text-4xl lg:text-5xl tracking-tight leading-tight font-medium">
				Good work starts<br />with a conversation.
			</h2>
			<p class="text-muted text-lg leading-8 max-w-md">
				A shared screen. A better question. A team willing to work through the details. That’s where
				an idea starts becoming useful.
			</p>
			<a class="text-button mt-4" href="/about">Get to know Space One <ArrowUpRight size={17} /></a>
		</div>
		<figure class="m-0">
			<video
				class="w-full aspect-video object-cover rounded-2xl bg-sage"
				controls
				muted
				playsinline
				preload="none"
				poster={media.collaboration}
				aria-label="Illustrative collaboration footage from the Space One website"
				><source src={media.collaborationVideo} type="video/mp4" />Your browser cannot play this
				video. <a href={media.collaborationVideo}>Open the original video</a>.</video
			>
			<figcaption class="mt-3 text-xs text-muted">
				A moment of collaboration, from the Space One media library.
			</figcaption>
		</figure>
	</div>
</section>
<section class="bg-sand">
	<div class="max-w-[1600px] mx-auto px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-2 gap-12">
		<div>
			<p class="eyebrow">A CLEARER WAY TO WORK</p>
			<h2 class="text-4xl lg:text-5xl tracking-tight leading-tight font-medium max-w-md">
				Less guesswork.<br />More meaningful progress.
			</h2>
			<p class="text-muted leading-8 max-w-md">
				We start by understanding the problem, make the plan visible, and keep the next step
				practical.
			</p>
			<a class="text-button mt-4" href="/about">Meet Space One <ArrowUpRight size={17} /></a>
		</div>
		<div>
			{#each [['Understand', 'Get clear on the people, the problem, and what a useful outcome looks like.'], ['Shape', 'Choose the right scope, responsibilities, and approach before the work begins.'], ['Move', 'Build, review, and improve with a shared view of what happens next.']] as [title, body], i}<div
					class="flex gap-6 py-6 border-b border-rust/15 first:pt-0"
				>
					<span class="text-rust text-sm pt-1">0{i + 1}</span>
					<div>
						<h3 class="text-2xl font-medium tracking-tight">{title}</h3>
						<p class="text-muted leading-7 mb-0">{body}</p>
					</div>
				</div>{/each}
		</div>
	</div>
</section>
<section class="max-w-[1600px] mx-auto px-6 lg:px-10 py-16 lg:py-24">
	<div class="flex flex-wrap justify-between gap-5 items-end mb-10">
		<div>
			<p class="eyebrow">FIELD NOTES</p>
			<h2 class="text-4xl tracking-tight font-medium mb-0">
				A little perspective goes a long way.
			</h2>
		</div>
		<a class="text-button" href="/insights">More insights <ArrowUpRight size={17} /></a>
	</div>
	<div class="grid md:grid-cols-3 gap-7">
		{#each [articles[1], articles[4], articles[7]] as article, i}<a
				class="group p-7 border border-line rounded-xl bg-paper hover:border-forest/40"
				href={`/insights/${article.slug}`}
				><div class="flex justify-between items-center mb-14">
					<span class="text-xs text-rust tracking-widest">PERSPECTIVE / 0{i + 1}</span><ArrowUpRight
						size={19}
					/>
				</div>
				<h3 class="text-xl leading-snug font-medium group-hover:text-forest">{article.title}</h3>
				<p class="text-sm text-muted leading-7 mb-0">{article.intro}</p></a
			>{/each}
	</div>
</section>
