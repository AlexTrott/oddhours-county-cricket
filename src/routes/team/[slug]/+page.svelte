<script lang="ts">
	import MatchCard from '$lib/components/MatchCard.svelte';
	import StandingsTable from '$lib/components/StandingsTable.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.county.name} · County Cricket Live</title>
</svelte:head>

<span
	class="oh-eyebrow"
	style="background:{data.county.palette.light.band};color:{data.county.palette.light.bandFg}"
>
	{data.county.abbreviation}
</span>
<h1 class="ccl-page-title oh-display">{data.county.name}</h1>
<p class="oh-lede">
	{data.county.blastName} in the Blast. Home: {data.county.homeGround}. YouTube channel ID:
	{data.county.youtubeChannelId || 'placeholder'}.
</p>

<div class="oh-stack-lg">
	<div class="ccl-grid ccl-grid--2">
		{#each data.matches as match (match.id)}
			<MatchCard {match} />
		{/each}
	</div>
	{#if data.championship}
		<article class="oh-card">
			<h2 class="oh-card__title">Championship · {data.championship.groupName}</h2>
			<StandingsTable rows={data.championship.rows} format="first-class" />
		</article>
	{/if}
</div>
