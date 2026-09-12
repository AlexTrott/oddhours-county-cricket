<script lang="ts">
	import { onMount } from 'svelte';
	import MatchCard from '$lib/components/MatchCard.svelte';
	import FreshnessBanner from '$lib/components/FreshnessBanner.svelte';
	import { appConfig } from '$lib/config';
	import type { MatchSummary } from '$lib/match-types';
	import type { FreshnessSnapshot } from '$lib/ingest/freshness';

	let { data } = $props();
	let polledLive = $state<MatchSummary[] | null>(null);
	let polledUpdated = $state<string | null>(null);
	let polledFreshness = $state<FreshnessSnapshot | null>(null);
	const live = $derived(polledLive ?? data.live);
	const updatedAt = $derived(polledUpdated ?? data.updatedAt);
	const freshness = $derived(polledFreshness ?? data.freshness);

	onMount(() => {
		const interval = setInterval(async () => {
			const response = await fetch('/api/live');
			if (!response.ok) return;
			const payload = (await response.json()) as {
				live: MatchSummary[];
				updatedAt: string | null;
				freshness: FreshnessSnapshot;
			};
			polledLive = payload.live;
			polledUpdated = payload.updatedAt;
			polledFreshness = payload.freshness;
		}, appConfig.polling.liveSeconds * 1000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Live · County Cricket Live</title>
	<meta name="description" content="Men's county cricket scores. Unofficial fan site." />
</svelte:head>

<span class="oh-eyebrow oh-eyebrow--band">Live</span>
<h1 class="ccl-page-title oh-display">County cricket, still going.</h1>
<p class="oh-lede">
	Championship, Blast, and One-Day Cup. This page polls the local database every
	{appConfig.polling.liveSeconds}s. It does not scrape the web.
</p>

<FreshnessBanner status={freshness.status} message={freshness.message} {updatedAt} />

<section class="oh-stack-lg">
	<div>
		<h2>Now</h2>
		{#if live.length}
			<div class="ccl-grid ccl-grid--2">
				{#each live as match (match.id)}
					<MatchCard {match} />
				{/each}
			</div>
		{:else}
			<article class="oh-card">
				<h3>Quiet out there</h3>
				<p>No live games in the database right now. Check fixtures.</p>
			</article>
		{/if}
	</div>

	<div>
		<h2>Next</h2>
		<div class="ccl-grid ccl-grid--2">
			{#each data.upcoming as match (match.id)}
				<MatchCard {match} />
			{/each}
		</div>
	</div>

	<div>
		<h2>Done</h2>
		<div class="ccl-grid ccl-grid--2">
			{#each data.completed as match (match.id)}
				<MatchCard {match} />
			{/each}
		</div>
	</div>
</section>
