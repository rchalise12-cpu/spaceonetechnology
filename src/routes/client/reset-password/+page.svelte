<script lang="ts">
	import AccountLinkForm from '$lib/components/AccountLinkForm.svelte';
	let { data } = $props();
</script>

<svelte:head><title>Choose a password · Space One</title></svelte:head><AccountLinkForm
	mode="reset-password"
	token={data.token}
/>
