<script lang="ts">
	import Scorecard from '$lib/components/Scorecard.svelte';
	import { competitionLabel, teamLabel } from '$lib/format';

	let { data } = $props();
</script>

<svelte:head>
	<title>
		{teamLabel(data.match.homeTeamId, data.match.format)} vs {teamLabel(
			data.match.awayTeamId,
			data.match.format
		)} · County Cricket Live
	</title>
</svelte:head>

<span class="oh-eyebrow {data.match.status === 'live' ? 'oh-eyebrow--band' : ''}"
	>{data.match.status}</span
>
<h1 class="ccl-page-title oh-display">
	{teamLabel(data.match.homeTeamId, data.match.format)}
	<span class="oh-muted">v</span>
	{teamLabel(data.match.awayTeamId, data.match.format)}
</h1>
<p class="oh-lede">{competitionLabel(data.match.competitionId, data.match.groupId)}</p>

{#if data.match.resultText}
	<article class="oh-card oh-card--band">
		<h2 class="oh-card__title">{data.match.resultText}</h2>
	</article>
{/if}

<div class="oh-stack-lg">
	<Scorecard match={data.match} />
</div>
