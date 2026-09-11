<script lang="ts">
	let { updatedAt }: { updatedAt: string | null } = $props();
</script>

<aside class="oh-card ccl-banner" aria-label="Data source">
	<span class="oh-eyebrow">Seeded demo</span>
	<p>
		Scores on this boot come from local SQLite seed, not a live scrape. Ingest is a separate
		<code class="oh-mono">pnpm ingest</code> command and is not cut over yet.
	</p>
	{#if updatedAt}
		<p class="oh-muted oh-mono">updated_at {updatedAt}</p>
	{/if}
</aside>
