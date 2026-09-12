<script lang="ts">
	let {
		status,
		message,
		updatedAt
	}: {
		status: 'seed' | 'ok' | 'delayed' | 'unavailable';
		message: string;
		updatedAt: string | null;
	} = $props();
</script>

<aside class="oh-card ccl-banner ccl-freshness ccl-freshness--{status}" aria-label="Data freshness">
	<span class="oh-eyebrow">
		{#if status === 'seed'}
			Seeded demo
		{:else if status === 'delayed'}
			Delayed
		{:else if status === 'unavailable'}
			Unavailable
		{:else}
			Live ingest
		{/if}
	</span>
	<p>{message}</p>
	{#if updatedAt}
		<p class="oh-muted oh-mono">updated_at {updatedAt}</p>
	{/if}
</aside>
