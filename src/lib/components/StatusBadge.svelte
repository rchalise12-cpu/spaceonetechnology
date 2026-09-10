<script lang="ts">
	import { statusLabel, type Status } from '$lib/types';
	let { status }: { status: Status } = $props();
</script>

<span class="status-badge {status}"><span></span>{statusLabel[status]}</span>
