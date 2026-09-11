<script lang="ts">
	import CountyPicker from '$lib/components/CountyPicker.svelte';
	import MatchCard from '$lib/components/MatchCard.svelte';
	import StandingsTable from '$lib/components/StandingsTable.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>My Team · County Cricket Live</title>
</svelte:head>

<span class="oh-eyebrow oh-eyebrow--ink">Favourite</span>
<h1 class="ccl-page-title oh-display">
	{data.county ? data.county.name : 'Pick a county.'}
</h1>
<p class="oh-lede">
	One colour overlay on OddHours petrol. No crests. First paint uses a cookie so the band does not
	flash.
</p>

<CountyPicker favourite={data.favourite} />

{#if data.county}
	<p><a class="oh-btn oh-btn--secondary" href="/team/{data.county.id}">Open team page</a></p>
	<section class="oh-stack-lg">
		<div>
			<h2>Their games</h2>
			<div class="ccl-grid ccl-grid--2">
				{#each data.matches as match (match.id)}
					<MatchCard {match} />
				{/each}
			</div>
		</div>
		<article class="oh-card">
			<h2 class="oh-card__title">Championship</h2>
			<StandingsTable rows={data.tables.championship} format="first-class" />
		</article>
	</section>
{/if}
