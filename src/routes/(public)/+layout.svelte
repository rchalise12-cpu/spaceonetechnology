<script lang="ts">
	import { page } from '$app/state';
	import { ArrowUpRight, ArrowRight, Menu, X, Globe } from '@lucide/svelte';
	let { children, data } = $props();
	let menu = $state(false);
	const links = [
		['/services', 'Services'],
		['/about', 'Company'],
		['/projects', 'Our thinking'],
		['/careers', 'Careers'],
		['/insights', 'Insights']
	];
</script>

<div class="bg-canvas min-h-screen">
	<a
		class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-paper focus:p-4"
		href="#public-main">Skip to content</a
	>
	<header class="border-b border-line bg-canvas">
		<div
			class="max-w-[1600px] mx-auto px-6 lg:px-10 min-h-24 flex items-center justify-between gap-6"
		>
			<a class="brand text-2xl" href="/" aria-label="Space One Technology home"
				>space one<span class="brand-dot">.</span></a
			>
			<nav class="hidden lg:flex gap-7 text-sm" aria-label="Company navigation">
				{#each links as [href, label]}<a
						class="hover:text-rust transition-colors"
						class:text-rust={page.url.pathname.startsWith(href)}
						{href}>{label}</a
					>{/each}
			</nav>
			<div class="flex items-center gap-6">
				<a
					class="hidden sm:flex text-sm items-center gap-2 hover:text-rust"
					href={data.signedIn ? '/dashboard' : '/client/login'}
					>{data.signedIn ? 'Dashboard' : 'Client sign in'}<ArrowUpRight size={15} /></a
				><a class="button primary hidden lg:inline-flex" href="/contact"
					>Let’s talk <ArrowUpRight size={16} /></a
				><button
					class="icon-button lg:hidden"
					aria-label={menu ? 'Close navigation' : 'Open navigation'}
					aria-expanded={menu}
					onclick={() => (menu = !menu)}
					>{#if menu}<X />{:else}<Menu />{/if}</button
				>
			</div>
		</div>
		{#if menu}<nav
				class="lg:hidden border-t border-line px-6 py-6 grid gap-5"
				aria-label="Mobile navigation"
			>
				{#each [...links, ['/contact', 'Contact'], [data.signedIn ? '/dashboard' : '/client/login', data.signedIn ? 'Dashboard' : 'Client sign in']] as [href, label]}<a
						{href}
						onclick={() => (menu = false)}>{label}</a
					>{/each}
			</nav>{/if}
	</header>
	<main id="public-main">{@render children()}</main>
	<section class="bg-forest text-white">
		<div
			class="max-w-[1600px] mx-auto px-6 lg:px-10 py-16 lg:py-24 flex flex-col md:flex-row md:items-center justify-between gap-8"
		>
			<div>
				<p class="text-xs tracking-[.18em] mb-4 text-sage">A GOOD PLACE TO BEGIN</p>
				<h2 class="text-4xl lg:text-5xl tracking-tight font-medium mb-0 max-w-xl">
					Let’s make the next<br />step a useful one.
				</h2>
			</div>
			<a
				class="inline-flex items-center justify-between gap-12 rounded-full bg-sage text-forest px-7 py-5 font-medium w-fit hover:bg-paper transition-colors"
				href="/contact">Start a conversation <ArrowUpRight size={22} /></a
			>
		</div>
	</section>
	<footer class="max-w-[1600px] mx-auto px-6 lg:px-10 pt-16 pb-7">
		<div class="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
			<div>
				<a class="brand" href="/">space one<span class="brand-dot">.</span></a>
				<p class="text-muted text-sm leading-7 mt-5 max-w-64">
					Technology that works.<br />People who move it forward.
				</p>
				<a
					class="inline-flex items-center gap-2 text-sm mt-2"
					href="https://www.linkedin.com/company/spaceonesocial"
					target="_blank"
					rel="noopener noreferrer"><Globe size={16} />Follow our work <ArrowUpRight size={14} /></a
				>
			</div>
			<div>
				<h3 class="text-sm mb-5">Explore</h3>
				<div class="grid gap-3 text-sm text-muted">
					{#each [['/services', 'Services'], ['/about', 'About Space One'], ['/company/team', 'Our disciplines'], ['/projects', 'Product concepts'], ['/engagements', 'Engagements'], ['/insights', 'Insights']] as [href, label]}<a
							class="hover:text-ink"
							{href}>{label}</a
						>{/each}
				</div>
			</div>
			<div>
				<h3 class="text-sm mb-5">Your next chapter</h3>
				<div class="grid gap-3 text-sm text-muted">
					{#each [['/careers', 'Careers'], ['/client/login', 'Client workspace'], ['/client/signup', 'Create an account'], ['/resources/candidate-roadmap', 'Preparation guide'], ['/contact', 'Get in touch']] as [href, label]}<a
							class="hover:text-ink"
							{href}>{label}</a
						>{/each}
				</div>
			</div>
			<div>
				<h3 class="text-sm mb-5">Based in Texas. Built for connection.</h3>
				<address class="not-italic text-sm text-muted leading-7">
					2300 Valley View Ln, Ste #865<br />Irving, TX 75062<br /><a
						class="inline-link block mt-3"
						href="tel:+18327105930">+1 (832) 710-5930</a
					>
				</address>
				<p class="text-xs text-muted mt-3">Monday–Friday · 8am–5pm Central</p>
			</div>
		</div>
		<div
			class="flex flex-wrap justify-between gap-5 border-t border-line mt-14 pt-6 text-xs text-muted"
		>
			<span>© {new Date().getFullYear()} Space One Technology.</span>
			<div class="flex gap-5">
				<a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/image-credits"
					>Image credits</a
				>
			</div>
		</div>
	</footer>
</div>
