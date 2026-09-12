<script lang="ts">
	let { source, updatedAt }: { source: string | null; updatedAt: string | null } = $props();
	const seeded = $derived(!source || source === 'seed');
</script>

<aside class="oh-card ccl-banner" aria-label="Data source">
	<span class="oh-eyebrow">{seeded ? 'Seeded demo' : 'Ingested'}</span>
	{#if seeded}
		<p>
			Scores on this boot come from local SQLite seed until
			<code class="oh-mono">pnpm ingest</code> writes ESPN/Cricinfo rows. This page never scrapes.
		</p>
	{:else}
		<p>
			Scores are from SQLite last written by
			<code class="oh-mono">pnpm ingest</code>
			({source}). This page still only reads the local database.
		</p>
	{/if}
	{#if updatedAt}
		<p class="oh-muted oh-mono">updated_at {updatedAt}</p>
	{/if}
</aside>
