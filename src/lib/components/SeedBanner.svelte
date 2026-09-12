<script lang="ts">
	import FreshnessBanner from './FreshnessBanner.svelte';

	let { updatedAt }: { updatedAt: string | null } = $props();
</script>

<FreshnessBanner
	status="seed"
	message="Scores on this boot come from local SQLite seed, not a live scrape. Enable ingest with INGESTION_ENABLED=true and pnpm ingest."
	{updatedAt}
/>
