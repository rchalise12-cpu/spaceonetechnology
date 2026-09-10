<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import {
		BriefcaseBusiness,
		CalendarDays,
		Files,
		Settings,
		LogOut,
		ArrowUpRight,
		PanelLeftClose,
		Menu,
		ShieldCheck,
		LayoutDashboard,
		Users,
		Upload,
		Mail,
		Inbox
	} from '@lucide/svelte';
	import { api, initials } from '$lib/client';
	let { data, children } = $props();
	let menu = $state(false);
	let error = $state('');
	let links = $derived([
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/jobs', label: 'My opportunities', icon: BriefcaseBusiness },
		{ href: '/interviews', label: 'Interviews', icon: CalendarDays },
		{ href: '/documents', label: 'Documents', icon: Files },
		...(data.user.role !== 'client'
			? [
					{ href: '/candidates', label: 'Candidates', icon: Users },
					{ href: '/imports', label: 'Import jobs', icon: Upload },
					{ href: '/invitations', label: 'Invitations', icon: Mail },
					{ href: '/inquiries', label: 'Inquiries', icon: Inbox }
				]
			: []),
		...(data.user.role === 'admin'
			? [{ href: '/team', label: 'Team & access', icon: ShieldCheck }]
			: [])
	]);
	async function logout() {
		try {
			await api('auth/logout', 'POST', {});
			await invalidateAll();
			await goto('/client/login');
		} catch (e) {
			error = (e as Error).message;
		}
	}
</script>

<div class="workspace">
	<aside class:mobile-open={menu} class="sidebar overflow-y-auto">
		<a class="brand" href="/dashboard">space one<span class="brand-dot">.</span></a>
		<div class="workspace-label my-6 text-xs">
			<span class="tiny-square"></span>
			{data.user.role === 'client' ? 'CLIENT WORKSPACE' : 'OPERATIONS'}
		</div>
		<nav aria-label="Main navigation">
			{#each links as link}<a
					class:active={page.url.pathname.startsWith(link.href)}
					href={link.href}
					onclick={() => (menu = false)}
					><link.icon size={19} />{link.label}{#if page.url.pathname.startsWith(link.href)}<span
							class="nav-dot"
						></span>{/if}</a
				>{/each}
		</nav>
		<div class="sidebar-note hidden 2xl:block">
			<div class="orbit-mark">↗</div>
			<p>Make your next<br />move count.</p>
			<span>One application at a time.</span>
		</div>
		<nav class="bottom-nav" aria-label="Account navigation">
			{#if data.user.role !== 'client'}<a
					class:active={page.url.pathname === '/admin'}
					href="/admin"
					onclick={() => (menu = false)}><ShieldCheck size={18} />Manage workspace</a
				>{/if}<a
				class:active={page.url.pathname === '/settings'}
				href="/settings"
				onclick={() => (menu = false)}><Settings size={18} />Settings</a
			>
		</nav>
		<div class="profile">
			<div class="avatar">{initials(data.user.name)}</div>
			<div>
				<strong>{data.user.name}</strong><small
					>{data.user.role === 'admin'
						? 'Administrator'
						: data.user.role === 'staff'
							? 'Staff account'
							: 'Client account'}</small
				>
			</div>
			<button class="icon-button" aria-label="Sign out" onclick={logout}
				><LogOut size={17} /></button
			>
		</div>
	</aside>
	{#if menu}<button
			class="mobile-scrim"
			aria-label="Close navigation"
			onclick={() => (menu = false)}
		></button>{/if}
	<div class="main-wrap">
		<header class="topbar">
			<div class="breadcrumb">
				<button
					class="icon-button mobile-toggle"
					aria-label="Toggle navigation"
					onclick={() => (menu = !menu)}><Menu size={20} /></button
				><PanelLeftClose size={17} class="desktop-only" /><span class="breadcrumb-divider">/</span
				><span>Workspace</span><span class="breadcrumb-divider">/</span><strong
					>{page.url.pathname.startsWith('/jobs/')
						? 'Job details'
						: page.url.pathname === '/jobs'
							? 'My opportunities'
							: page.url.pathname === '/admin'
								? 'Manage workspace'
								: page.url.pathname.slice(1).replace(/^./, (s) => s.toUpperCase())}</strong
				>
			</div>
			<span class="topbar-tag">SPACE ONE TECHNOLOGY <ArrowUpRight size={13} /></span>
		</header>
		<main class="main-content" id="main">
			{#if error}<p class="alert error" role="alert">{error}</p>{/if}{@render children()}
		</main>
		<footer class="footer">
			<span>SPACE ONE TECHNOLOGY</span><span>A little progress, every day.</span>
		</footer>
	</div>
</div>
