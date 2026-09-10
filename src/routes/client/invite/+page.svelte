<script lang="ts">
	import AccountLinkForm from '$lib/components/AccountLinkForm.svelte';
	let { data } = $props();
</script>

<svelte:head><title>Accept your invitation · Space One</title></svelte:head><AccountLinkForm
	mode="invite"
	invite={data.invite}
	token={data.token}
/>
