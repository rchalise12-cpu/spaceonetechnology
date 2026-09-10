<script lang="ts">
	import '@fontsource-variable/dm-sans';
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head
	><title>Space One · Client workspace</title><meta
		name="description"
		content="Your next opportunity, organized. Track jobs, applications, documents, and interviews with Space One Technology."
	/></svelte:head
>
{@render children()}
