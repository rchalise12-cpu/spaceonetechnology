<script lang="ts">
	import { page } from '$app/state';
</script>

<main class="standalone">
	<a class="brand" href="/">space one<span class="brand-dot">.</span></a>
	<p class="eyebrow">{page.status}</p>
	<h1>{page.error?.message || 'Something went wrong'}</h1>
	<p class="muted">Try again, or return to your workspace.</p>
	<a class="button primary" href="/">Back to Space One →</a>
</main>
